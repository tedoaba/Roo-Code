# Research: Agent Trace Schema Evolution

**Feature**: 018-trace-schema-evolution
**Date**: 2026-02-21
**Status**: Complete

## Research Questions

### RQ-1: How to resolve the `ExecutionState` dependency when consolidating into `contracts/`?

**Context**: The consolidated `AgentTraceEntry` in `contracts/AgentTrace.ts` needs the `state?: ExecutionState` field. `ExecutionState` is currently defined in `services/orchestration/types.ts`. Importing from services into contracts would create an inverted dependency (contracts should not depend on services).

**Decision**: Define `ExecutionState` as a string literal union directly in `contracts/AgentTrace.ts`.

**Rationale**: `ExecutionState` is `"REQUEST" | "REASONING" | "ACTION"` — a simple 3-value string union. As a domain constant, it belongs at the contract level. Duplicating a 3-value union is cheaper and cleaner than creating a circular dependency. The `services/orchestration/types.ts` file can then re-export `ExecutionState` from contracts for backward compatibility.

**Alternatives considered**:

- Import `ExecutionState` from `services/orchestration/types.ts` into `contracts/AgentTrace.ts` → Rejected: inverts the intended dependency direction (contracts ← services).
- Create a shared `types/common.ts` file → Rejected: over-engineering for a 3-value union that is tightly coupled to the trace schema.
- Use `state?: string` in contracts → Rejected: loses type safety for a field that has an enumerated set of valid values.

---

### RQ-2: How many trace entry producer sites need updating?

**Context**: The spec requires updating all producers to populate the `contributor` field (FR-013). We need to catalog every location that constructs `AgentTraceEntry` objects.

**Decision**: 12 producer call sites identified across 7 files.

**Findings**:

| #   | File                                       | Method/Location                                        | Current Pattern                               | Notes                                             |
| --- | ------------------------------------------ | ------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------- |
| 1   | `hooks/post/AgentTraceHook.ts`             | `execute()` → `ledgerManager.recordMutation()`         | Uses `actor: "roo-code"`                      | Primary mutation recorder                         |
| 2   | `hooks/post/AuditHook.ts`                  | `recordMutation()` → `orchestrationService.logTrace()` | Uses `metadata.contributor: "roo-code-agent"` | Has the `metadata.contributor` field to deprecate |
| 3   | `hooks/HookEngine.ts` (L150)               | `preToolUse()` → `logTrace()`                          | Uses `as any` cast                            | Acknowledgement comment exists                    |
| 4   | `hooks/HookEngine.ts` (L220)               | `postToolUse()` → `logTrace()`                         | Uses `as any` cast                            |                                                   |
| 5   | `hooks/HookEngine.ts` (L280)               | scope violation → `logTrace()`                         | Standard entry construction                   |                                                   |
| 6   | `hooks/HookEngine.ts` (L387-412)           | circuit breaker → `logTrace()`                         | Uses `as any` cast with comment               |                                                   |
| 7   | `hooks/pre/ScopeEnforcementHook.ts` (L44)  | scope denial → `logTrace()`                            | Standard entry construction                   |                                                   |
| 8   | `hooks/pre/ContextEnrichmentHook.ts` (L37) | context injection → `logTrace()`                       | Standard entry construction                   |                                                   |
| 9   | `hooks/pre/BudgetHook.ts` (L59)            | budget exceeded → `logTrace()`                         | Standard entry construction                   |                                                   |
| 10  | `core/tools/SelectActiveIntent.ts` (L56)   | intent selection → `logTrace()`                        | Uses `as any` cast                            |                                                   |
| 11  | `core/state/StateMachine.ts` (L68)         | state transition → `logTrace()`                        | Uses `as any` cast                            |                                                   |
| 12  | `core/lessons/LessonAuditLogger.ts` (L21)  | lesson recording → `recordMutation()`                  | Standard entry construction                   |                                                   |

**Migration strategy**: For each site, add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }`. Where `metadata.contributor` exists (AuditHook), remove it.

---

### RQ-3: What is the impact of `metadata` optionality change on existing consumers?

**Context**: `services/orchestration/types.ts` has `metadata: { session_id: string; ... }` (required). `contracts/AgentTrace.ts` has `metadata?: Record<string, any>` (optional). The canonical type will use `metadata?: { session_id: string; vcs_ref?: string; [key: string]: any }` (optional but typed when present).

**Decision**: The change from required to optional `metadata` is safe for all current consumers.

**Rationale**: Analysis of all 12 producer sites shows they ALL populate `metadata` with at least `session_id`. The only risk would be if a consumer reads `entry.metadata.session_id` without null-checking — but since the field is optional, TypeScript will force callers to check for `undefined` first. The `as any` casts currently used at 5 call sites indicate the operational type's required `metadata` is already being bypassed.

**Alternatives considered**:

- Keep `metadata` required → Rejected: breaks backward compatibility with `contracts/AgentTrace.ts` consumers (LedgerManager, AgentTraceHook tests) that already expect it optional.
- Make `metadata` required with `session_id` required → Rejected: `LedgerManager.recordMutation()` passes `metadata?: Record<string, any>` which may not have `session_id`.

---

### RQ-4: What is the `as any` cast cleanup scope?

**Context**: Multiple files cast trace entries `as any` to work around the type mismatch between the two `AgentTraceEntry` definitions. After consolidation, these casts should be removable.

**Decision**: 5 `as any` cast sites identified, all removable after consolidation.

**Findings**:

1. `SelectActiveIntent.ts` L75: `} as any)` — constructs entry with `state`, `action_type`, `payload`, `result`, `metadata.session_id` (all will be typed in canonical)
2. `StateMachine.ts` L94: `} as any)` — same pattern
3. `HookEngine.ts` L150, L280, L412: Three casts with comment "Use any temporarily as OrchestrationService.logTrace expects old schema"

All 5 casts exist because the `OrchestrationService.logTrace()` method accepts `AgentTraceEntry` from `services/orchestration/types.ts`, but callers construct objects with fields from the `contracts` definition. After consolidation to a single type, these casts become unnecessary.

---

### RQ-5: How should the `LedgerManager.recordMutation` signature evolve?

**Context**: `LedgerManager.recordMutation()` accepts `metadata?: Record<string, any>` and doesn't populate `contributor`. After consolidation, should it accept and propagate `contributor`?

**Decision**: Extend `recordMutation` params to accept an optional `contributor` object and propagate it to the constructed entry.

**Rationale**: `LedgerManager.recordMutation()` is a convenience method that constructs `AgentTraceEntry` objects. If it doesn't accept `contributor`, callers must use the lower-level `append()` method. Since `AgentTraceHook` (the primary consumer) calls `recordMutation`, this is the natural place to thread the `contributor` field through.

**Alternatives considered**:

- Only update `AgentTraceHook` to call `append()` directly instead of `recordMutation()` → Rejected: more invasive change than adding a parameter.
- Keep `recordMutation` unchanged and hard-code `contributor` in each caller → Rejected: duplicates logic across all callers.
