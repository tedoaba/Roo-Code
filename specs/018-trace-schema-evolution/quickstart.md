# Quickstart: Agent Trace Schema Evolution

**Feature**: 018-trace-schema-evolution
**Date**: 2026-02-21

## Prerequisites

- Branch `018-trace-schema-evolution` checked out
- `npm install` completed (no new dependencies required)
- All existing tests passing (`npx vitest run`)

## Implementation Order

Execute tasks in this exact order. Each step should compile and pass tests independently.

### Step 1: Consolidate the Canonical Type (P1 — Foundation)

**What**: Merge both `AgentTraceEntry` definitions into one canonical definition in `src/contracts/AgentTrace.ts`.

1. **Move `ExecutionState`** to `src/contracts/AgentTrace.ts`:

    ```typescript
    export type ExecutionState = "REQUEST" | "REASONING" | "ACTION"
    ```

2. **Add `Contributor` interface** to `src/contracts/AgentTrace.ts`:

    ```typescript
    export interface Contributor {
    	entity_type: "AI" | "HUMAN"
    	model_identifier?: string
    }
    ```

3. **Update `AgentTraceEntry`** in `src/contracts/AgentTrace.ts`:

    - Add `contributor?: Contributor` field
    - Change `state?: string` to `state?: ExecutionState`
    - Change `metadata?: Record<string, any>` to `metadata?: { session_id: string; vcs_ref?: string; [key: string]: any }`

4. **Remove duplicate** from `src/services/orchestration/types.ts`:

    - Delete the `AgentTraceEntry` interface
    - Delete the `ExecutionState` type
    - Add re-exports with deprecation comments:
        ```typescript
        /** @deprecated Import from '../../contracts/AgentTrace' */
        export { AgentTraceEntry, ExecutionState, type Contributor } from "../../contracts/AgentTrace"
        ```

5. **Verify**: `npx tsc --noEmit` — should produce zero errors.

### Step 2: Update Producers with Contributor (P2 — Attribution)

**What**: Add `contributor` field to all 12 producer call sites.

For each producer, add:

```typescript
contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }
```

Files to update (in this order):

1. `src/utils/orchestration/LedgerManager.ts` — add `contributor?` param to `recordMutation()`
2. `src/hooks/post/AgentTraceHook.ts` — pass `contributor` to `recordMutation()`
3. `src/hooks/post/AuditHook.ts` — add top-level `contributor`, remove `metadata.contributor`
4. `src/hooks/HookEngine.ts` — update 4 `logTrace()` calls, remove `as any` casts
5. `src/hooks/pre/ScopeEnforcementHook.ts` — add `contributor` to `logTrace()`
6. `src/hooks/pre/ContextEnrichmentHook.ts` — add `contributor` to `logTrace()`
7. `src/hooks/pre/BudgetHook.ts` — add `contributor` to `logTrace()`
8. `src/core/tools/SelectActiveIntent.ts` — add `contributor`, remove `as any`
9. `src/core/state/StateMachine.ts` — add `contributor`, remove `as any`
10. `src/core/lessons/LessonAuditLogger.ts` — pass `contributor` to `recordMutation()`

**Verify**: `npx tsc --noEmit && npx vitest run`

### Step 3: Update Documentation (P3 — Alignment)

**What**: Update ARCHITECTURE_NOTES.md §7.2 to show the flat schema.

1. Replace the nested JSON example (lines 631–670) with the actual flat schema
2. Move the nested schema to a "Future Evolution" callout
3. Update the "Critical Design Properties" section
4. Add the `contributor` field to the documented schema

**Verify**: Manual comparison of JSON example against `AgentTraceEntry` interface.

### Step 4: Tests (P1/P2 — Verification)

1. Update import paths in test files if they don't use the re-export
2. Add test: verify only one `export interface AgentTraceEntry` exists (SC-001)
3. Add test: verify `Contributor` type accepts `"AI"` and `"HUMAN"` (SC-003)
4. Run full test suite: `npx vitest run`

## Verification Checklist

- [ ] `grep -r "export interface AgentTraceEntry" src/` returns exactly 1 result
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `npx vitest run` — all tests pass
- [ ] No `as any` casts remain on `logTrace()` calls
- [ ] ARCHITECTURE_NOTES.md §7.2 JSON example matches `AgentTraceEntry` interface
