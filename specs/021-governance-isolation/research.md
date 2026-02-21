# Research: Governance Isolation Boundary Enforcement

**Feature**: 021-governance-isolation  
**Date**: 2026-02-21  
**Status**: Complete

## Research Questions

### RQ-1: Import Dependency Graph — What imports each module being moved?

**Decision**: Modules have well-defined import trees. No circular dependencies detected between governance modules and non-governance modules.

**Findings**:

| Module (Source)                                      | Imported By (Consumer Files)                                                                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/contracts/AgentTrace.ts`                        | `src/core/state/StateMachine.ts`, `src/core/tools/SelectActiveIntent.ts`, `src/utils/orchestration/LedgerManager.ts`, `src/services/orchestration/types.ts`                            |
| `src/errors/TraceabilityError.ts`                    | `src/hooks/pre/TraceabilityHook.ts`, `src/hooks/__tests__/HookEngine.test.ts`                                                                                                          |
| `src/core/concurrency/types.ts`                      | `src/hooks/HookEngine.ts` (imports `ITurnContext`)                                                                                                                                     |
| `src/core/concurrency/TurnContext.ts`                | `src/hooks/HookEngine.ts`                                                                                                                                                              |
| `src/core/concurrency/OptimisticGuard.ts`            | `src/hooks/pre/ConcurrencyHook.ts`                                                                                                                                                     |
| `src/core/state/StateMachine.ts`                     | `src/hooks/HookEngine.ts`, `src/hooks/pre/StateCheckHook.ts`, 8 test files in `src/hooks/__tests__/`, `src/test/integration/`                                                          |
| `src/services/orchestration/OrchestrationService.ts` | `src/hooks/HookEngine.ts`, ~15 hooks in `src/hooks/pre/` and `src/hooks/post/`, `src/core/state/StateMachine.ts`, `src/core/prompts/sections/intent-handshake.ts`, multiple test files |
| `src/utils/orchestration/LedgerManager.ts`           | `src/hooks/post/AgentTraceHook.ts`, `src/core/lessons/LessonAuditLogger.ts`                                                                                                            |
| `src/core/lessons/LessonRecorder.ts`                 | `src/hooks/post/VerificationFailureHook.ts`                                                                                                                                            |
| `src/core/tools/SelectActiveIntent.ts`               | `src/core/tools/` barrel, `src/core/task/Task.ts` (indirect)                                                                                                                           |
| `src/core/prompts/sections/intent-handshake.ts`      | `src/core/prompts/system.ts`                                                                                                                                                           |
| `src/hooks/HookEngine.ts`                            | `src/core/task/Task.ts`, all `src/hooks/__tests__/` integration tests                                                                                                                  |

**Rationale**: This dependency graph confirms the spec's FR-017 dependency ordering is correct: contracts/types must move first (they have no governance dependencies), then errors, then state modules, then tools/prompts, then engine.

**Alternatives Considered**: None — the dependency graph is factual, not a design choice.

---

### RQ-2: Re-export Shim Pattern — What is the correct TypeScript re-export syntax?

**Decision**: Use named re-exports with `@deprecated` JSDoc annotations.

**Pattern**:

```typescript
/**
 * @deprecated Moved to src/hooks/state/StateMachine.ts. Update your imports.
 * This re-export exists for backward compatibility during migration.
 */
export { StateMachine } from "../../hooks/state/StateMachine"
```

For modules that export multiple symbols:

```typescript
/**
 * @deprecated Moved to src/hooks/contracts/AgentTrace.ts. Update your imports.
 * This re-export exists for backward compatibility during migration.
 */
export { AgentTraceEntry, ExecutionState } from "../../hooks/contracts/AgentTrace"
export type { AgentTraceEntry, ExecutionState } from "../../hooks/contracts/AgentTrace"
```

**Rationale**: Named re-exports are explicit, tree-shakeable, and trigger TypeScript deprecation warnings in IDEs. Wildcard `export *` would work but is less discoverable.

**Alternatives Considered**:

- `export * from "..."` — simpler but less explicit; no control over what's exported.
- Path aliases in `tsconfig.json` — would avoid re-exports entirely but changes build config and may affect other consumers unpredictably.

---

### RQ-3: OrchestrationService — Is it purely governance logic?

**Decision**: OrchestrationService is governance logic. It manages intent lifecycle, scope validation, audit logging, and orchestration state — all governance concerns per the Constitution.

**Findings**:

- 690 lines of intent management, scope validation, trace logging, hash computation, and orchestration initialization
- Imports: `fs`, `path`, `crypto`, `js-yaml`, `vscode`, `minimatch`, `ignore`, internal types
- No non-governance utility functions detected
- Every method serves a governance purpose (intent validation, trace logging, scope checking, shared brain management)

**Rationale**: The entire OrchestrationService is governance logic per Constitution Axiom 3 ("Governance is not optional") and Invariant 4 ("Single Source of Orchestration Truth"). It belongs in `src/hooks/state/`.

**Alternatives Considered**:

- Splitting into governance and non-governance parts — rejected because no non-governance parts were identified.

---

### RQ-4: SelectActiveIntent.ts → SelectActiveIntentTool.ts — Is the rename safe?

**Decision**: The filename rename from `SelectActiveIntent.ts` to `SelectActiveIntentTool.ts` is safe because the class is already named `SelectActiveIntentTool` internally.

**Findings**:

- The class is `export class SelectActiveIntentTool extends BaseTool<"select_active_intent">`
- A singleton is exported as `export const selectActiveIntentTool = new SelectActiveIntentTool()`
- The re-export shim at the old location will map both exports to the new path
- The file also imports from `BaseTool` (relative: `./BaseTool`) — this import will need updating since `BaseTool` stays in `src/core/tools/`

**Rationale**: Aligning the filename with the class name follows TypeScript conventions and matches the spec target (FR-007).

**Alternatives Considered**:

- Keep the old filename — rejected because the spec explicitly requires `SelectActiveIntentTool.ts`.

---

### RQ-5: Test Migration — What import path changes are needed for co-located tests?

**Decision**: Co-located test files that use relative imports (`../StateMachine`) will need their imports updated to the new relative path when moved.

**Findings**:

- `src/core/state/__tests__/StateMachine.test.ts` imports `from "../StateMachine"` and `from "../../../services/orchestration/OrchestrationService"`
- `src/core/concurrency/__tests__/TurnContext.test.ts` imports `from "../TurnContext"`
- `src/core/concurrency/__tests__/OptimisticGuard.test.ts` imports `from "../OptimisticGuard"`
- `src/core/lessons/__tests__/LessonRecorder.test.ts` imports `from "../LessonRecorder"`
- `src/utils/orchestration/__tests__/LedgerManager.test.ts` imports `from "../LedgerManager"`
- `src/contracts/__tests__/AgentTraceEntry.test.ts` imports `from "../AgentTrace"`

After moving to `src/hooks/state/__tests__/`, relative imports to sibling modules (`../StateMachine`) still work — same relative structure. Cross-module imports (e.g., to `OrchestrationService`) need path updates.

**Rationale**: Moving tests maintains co-location, which is the project's established testing convention.

**Alternatives Considered**:

- Leave tests behind — rejected per clarification Q2 (user chose co-location).

---

### RQ-6: Barrel Export Strategy — How to organize `src/hooks/index.ts`?

**Decision**: Organize barrel exports by subdirectory namespace with section comments.

**Pattern**:

```typescript
// Engine
export { HookEngine, type ToolRequest, type ToolResult } from "./engine/HookEngine"
export { HookRegistry } from "./engine/HookRegistry"

// State
export { StateMachine } from "./state/StateMachine"
export { OrchestrationService } from "./state/OrchestrationService"
export { TurnContext } from "./state/TurnContext"
export { OptimisticGuard } from "./state/OptimisticGuard"
export { LedgerManager } from "./state/LedgerManager"

// State: Lessons
export { LessonRecorder } from "./state/lessons/LessonRecorder"

// Tools
export { SelectActiveIntentTool, selectActiveIntentTool } from "./tools/SelectActiveIntentTool"

// Contracts
export { AgentTraceEntry, ExecutionState } from "./contracts/AgentTrace"

// Errors
export { StaleWriteError } from "./errors/StaleWriteError"
export { TraceabilityError } from "./errors/TraceabilityError"

// Pre-hooks
export { IntentGateHook } from "./pre/IntentGateHook"
// ...existing pre-hook exports...

// Post-hooks
export { AuditHook } from "./post/AuditHook"
// ...existing post-hook exports...
```

**Rationale**: Section comments match the directory structure, helping developers mentally map exports to subdirectories. Only public APIs are exported — internal types and utilities are not barrel-exported.

**Alternatives Considered**:

- Namespace objects (e.g., `hooks.state.StateMachine`) — rejected because it changes the import API for all consumers.
- No barrel export — rejected because it reduces discoverability.
