# Tasks: Agent Trace Schema Evolution

**Input**: Design documents from `/specs/018-trace-schema-evolution/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Test tasks are included where they directly validate success criteria (SC-001 through SC-006). Existing tests must continue to pass (FR-010).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- TypeScript codebase with `src/contracts/`, `src/services/`, `src/hooks/`, `src/core/`, `src/utils/`

---

## Phase 1: Setup

**Purpose**: Verify branch state and capture pre-consolidation baseline

- [x] T001 Verify branch `018-trace-schema-evolution` is checked out and clean with `git status`
- [x] T002 Run `npx tsc --noEmit` to confirm zero compile errors as baseline before changes
- [x] T003 Run `npx vitest run` to confirm all existing tests pass as baseline before changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Consolidate the canonical type definition — MUST be complete before any user story work can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. All type changes happen here.

- [x] T004 Add `ExecutionState` type alias to `src/contracts/AgentTrace.ts` — define `export type ExecutionState = "REQUEST" | "REASONING" | "ACTION"` before the `AgentTraceEntry` interface (resolves RQ-1: avoids circular dependency with services)
- [x] T005 Add `Contributor` interface to `src/contracts/AgentTrace.ts` — define `export interface Contributor { entity_type: "AI" | "HUMAN"; model_identifier?: string }` with JSDoc comments per the contract specification
- [x] T006 Update `AgentTraceEntry` interface in `src/contracts/AgentTrace.ts` — add `contributor?: Contributor` field, change `state?: string` to `state?: ExecutionState`, change `metadata?: Record<string, any>` to `metadata?: { session_id: string; vcs_ref?: string; [key: string]: any }` with deprecation notice for `metadata.contributor`
- [x] T007 Remove duplicate `AgentTraceEntry` interface and `ExecutionState` type from `src/services/orchestration/types.ts` — replace with deprecation-commented re-exports: `export { AgentTraceEntry, ExecutionState, type Contributor } from "../../contracts/AgentTrace"` (preserves all existing imports via re-export) (FR-012: deprecation comment is mandatory)
- [x] T008 Run `npx tsc --noEmit` to verify zero compile errors after type consolidation and re-export

**Checkpoint**: Single canonical `AgentTraceEntry` exists. All imports resolve via re-export. Zero compile errors.

---

## Phase 3: User Story 1 — Single Canonical Type Definition (Priority: P1) 🎯 MVP

**Goal**: Eliminate duplicate `AgentTraceEntry` definitions. All code imports from `src/contracts/AgentTrace.ts` (directly or via re-export).

**Independent Test**: `grep -r "export interface AgentTraceEntry" src/` returns exactly 1 result. `npx tsc --noEmit` exits 0. All existing tests pass.

### Implementation for User Story 1

- [x] T009 [P] [US1] Update import in `src/core/tools/SelectActiveIntent.ts` — change `import { AgentTraceEntry } from "../../services/orchestration/types"` to `import { AgentTraceEntry } from "../../contracts/AgentTrace"` (also import `ExecutionState` if used)
- [x] T010 [P] [US1] Update import in `src/core/state/StateMachine.ts` — change `import { ExecutionState, AgentTraceEntry, COMMAND_CLASSIFICATION } from "../../services/orchestration/types"` to import `ExecutionState` and `AgentTraceEntry` from `../../contracts/AgentTrace` and `COMMAND_CLASSIFICATION` from `../../services/orchestration/types`
- [x] T011 [P] [US1] Update import in `src/core/prompts/sections/intent-handshake.ts` — change `import { AgentTraceEntry } from "../../../services/orchestration/types"` to `import { AgentTraceEntry } from "../../../contracts/AgentTrace"`
- [x] T012 [US1] Run `npx tsc --noEmit` to verify zero compile errors after import migration
- [x] T013 [US1] Run `npx vitest run` to verify all existing tests pass after import migration (FR-010)
- [x] T014 [US1] Add validation test in `src/contracts/__tests__/AgentTraceEntry.test.ts` — verify that `grep -r "export interface AgentTraceEntry" src/` returns exactly 1 result (SC-001), verify the canonical interface includes all expected fields: `trace_id`, `timestamp`, `mutation_class`, `intent_id`, `related`, `ranges`, `actor`, `summary`, `contributor`, `state`, `action_type`, `payload`, `result`, `metadata`, and verify `ILedgerManager` interface remains co-located in `src/contracts/AgentTrace.ts` (FR-008)

**Checkpoint**: US1 complete. Single canonical type, all imports migrated, all tests passing.

---

## Phase 4: User Story 2 — Contributor Attribution in Trace Entries (Priority: P2)

**Goal**: All trace entry producers populate `contributor: { entity_type: "AI", model_identifier: "roo-code" }`. The deprecated `metadata.contributor` field is removed from new entries.

**Independent Test**: Create a trace entry via `AgentTraceHook` or `LedgerManager.recordMutation()`, read back from JSONL, verify `contributor.entity_type === "AI"` and `contributor.model_identifier === "roo-code"`.

### Implementation for User Story 2

- [x] T015 [US2] Extend `LedgerManager.recordMutation()` params in `src/utils/orchestration/LedgerManager.ts` — add optional `contributor?: Contributor` parameter (import `Contributor` from `../../contracts/AgentTrace`), propagate it to the constructed `AgentTraceEntry` object in the method body
- [x] T016 [US2] Update `AgentTraceHook.execute()` in `src/hooks/post/AgentTraceHook.ts` — pass `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to `this.ledgerManager.recordMutation()` call (note: `"roo-code"` is a placeholder; dynamic model detection is a future enhancement per spec.md US2 AS-2)
- [x] T017 [US2] Update `AuditHook.recordMutation()` in `src/hooks/post/AuditHook.ts` — add top-level `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the `logTrace()` entry, remove the `metadata.contributor: "roo-code-agent"` field (FR-014)
- [x] T018 [US2] Update `HookEngine` logTrace calls in `src/hooks/HookEngine.ts` — add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to all 4 `logTrace()` call sites (lines ~150, ~220, ~280, ~387-412), remove all `as any` casts that workaround the old type mismatch (RQ-4)
- [x] T019 [P] [US2] Update `ScopeEnforcementHook` logTrace call in `src/hooks/pre/ScopeEnforcementHook.ts` — add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the scope denial `logTrace()` entry
- [x] T020 [P] [US2] Update `ContextEnrichmentHook` logTrace call in `src/hooks/pre/ContextEnrichmentHook.ts` — add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the context injection `logTrace()` entry
- [x] T021 [P] [US2] Update `BudgetHook` logTrace call in `src/hooks/pre/BudgetHook.ts` — add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the budget exceeded `logTrace()` entry
- [x] T022 [US2] Update `SelectActiveIntent` logTrace call in `src/core/tools/SelectActiveIntent.ts` — add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the intent selection `logTrace()` entry, remove `as any` cast
- [x] T023 [US2] Update `StateMachine.transitionTo()` logTrace call in `src/core/state/StateMachine.ts` — add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the state transition `logTrace()` entry, remove `as any` cast
- [x] T024 [US2] Update `LessonAuditLogger` recordMutation call in `src/core/lessons/LessonAuditLogger.ts` — pass `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the `ledgerManager.recordMutation()` call
- [x] T025 [US2] Update `OrchestrationService` logTrace call in `src/services/orchestration/OrchestrationService.ts` — add `contributor: { entity_type: "AI" as const, model_identifier: "roo-code" }` to the internal `logTrace()` entry construction at line ~320
- [x] T026 [US2] Run `npx tsc --noEmit` to verify zero compile errors and confirm no `as any` casts remain on `logTrace()` calls
- [x] T027 [US2] Run `npx vitest run` to verify all tests pass after producer updates
- [x] T028 [US2] Add contributor validation test in `src/contracts/__tests__/AgentTraceEntry.test.ts` — verify the `Contributor` type accepts `{ entity_type: "AI", model_identifier: "roo-code" }` and `{ entity_type: "HUMAN" }` (SC-003), and verify that a mock `LedgerManager.recordMutation()` call with `contributor` produces an entry with the field (integration smoke test)

**Checkpoint**: US2 complete. All 12 producer sites populate `contributor`. No `as any` casts remain. `metadata.contributor` deprecated.

---

## Phase 5: User Story 3 — Documentation Alignment (Priority: P3)

**Goal**: ARCHITECTURE_NOTES.md §7.2 accurately reflects the flat schema with the `contributor` field. Nested schema moved to "Future Evolution" note.

**Independent Test**: Compare the JSON example in ARCHITECTURE_NOTES.md §7.2 against the `AgentTraceEntry` interface — every field maps 1:1.

### Implementation for User Story 3

- [x] T029 [US3] Update ARCHITECTURE_NOTES.md §7.2 JSON example — replace the nested `files[].conversations[].ranges[]` schema (lines ~631-670) with a flat JSON example matching the canonical `AgentTraceEntry` fields: `trace_id`, `timestamp`, `mutation_class`, `intent_id`, `related`, `ranges`, `actor`, `summary`, `contributor`, `state`, `action_type`, `payload`, `result`, `metadata`
- [x] T030 [US3] Add "Future Evolution" note to ARCHITECTURE_NOTES.md §7.2 — preserve the nested schema as a documented target for multi-file atomic operations, explaining it is the evolution path when the Hook Engine needs to support multi-file transactions
- [x] T031 [US3] Update "Critical Design Properties" section in ARCHITECTURE_NOTES.md §7.2 — update Spatial Independence, Golden Thread, and Contributor Attribution descriptions to reflect the flat schema's approach, noting that `contributor` is now a top-level structured object with `entity_type` and `model_identifier`
- [x] T032 [US3] Verify documentation alignment (SC-004) — manually compare the updated JSON example against the `AgentTraceEntry` interface in `src/contracts/AgentTrace.ts` and confirm every field in the example maps to a field in the interface with matching name, type, and optionality

**Checkpoint**: US3 complete. ARCHITECTURE_NOTES.md §7.2 matches the actual implementation. Law 6.3 (Knowledge Currency) satisfied.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, test updates, and cleanup

- [x] T033 Update test mocks in `src/hooks/__tests__/HookEngine.test.ts` — ensure mock `logTrace` entries include the `contributor` field where assertions check entry structure
- [x] T034 [P] Update test mocks in `src/core/state/__tests__/StateMachine.test.ts` — ensure mock `orchestrationService.logTrace` is typed to accept entries with `contributor`
- [x] T035 [P] Update test entry shapes in `src/utils/orchestration/__tests__/LedgerManager.test.ts` — verify `recordMutation()` correctly propagates the new `contributor` parameter to the appended entry
- [x] T036 Run full test suite `npx vitest run` and verify all tests pass (SC-005)
- [x] T037 Run `npx tsc --noEmit` for final compilation check (SC-006)
- [x] T038 Verify SC-001: `grep -r "export interface AgentTraceEntry" src/` returns exactly 1 match
- [x] T039 Verify SC-002 and FR-011: run `grep -r "import.*AgentTraceEntry" src/ --include="*.ts"` and confirm every match imports from either `contracts/AgentTrace` (direct) or `services/orchestration/types` (re-export only — no local definition). Verify no file defines its own `AgentTraceEntry` interface outside `src/contracts/AgentTrace.ts`
- [x] T040 Run quickstart.md verification checklist — confirm all 5 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — No dependencies on other stories
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — Can run in parallel with US1 but logically benefits from US1 completing first (cleaner imports)
- **US3 (Phase 5)**: Depends on US2 completing (needs to document the `contributor` field accurately)
- **Polish (Phase 6)**: Depends on all user stories completing

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 — Practically benefits from US1 import cleanup but not strictly blocked
- **User Story 3 (P3)**: Depends on US2 — documentation must reflect the final schema including `contributor`

### Within Each User Story

- Type/interface changes before import migrations
- Import migrations before producer updates
- Producer updates before test validation
- Test validation as final step per story

### Parallel Opportunities

- **Phase 2**: T004 and T005 can run in parallel (different definitions in same file, no overlap)
- **Phase 3**: T009, T010, T011 can all run in parallel (different files)
- **Phase 4**: T019, T020, T021 can all run in parallel (different files); T022/T023 can also parallel with each other
- **Phase 6**: T033, T034, T035 can run in parallel (different test files)

---

## Parallel Example: User Story 1

```text
# After Phase 2 completes, launch all import migrations together:
Task T009: Update import in src/core/tools/SelectActiveIntent.ts
Task T010: Update import in src/core/state/StateMachine.ts
Task T011: Update import in src/core/prompts/sections/intent-handshake.ts
```

## Parallel Example: User Story 2

```text
# After T018 (HookEngine — largest file), launch pre-hooks together:
Task T019: Update ScopeEnforcementHook in src/hooks/pre/ScopeEnforcementHook.ts
Task T020: Update ContextEnrichmentHook in src/hooks/pre/ContextEnrichmentHook.ts
Task T021: Update BudgetHook in src/hooks/pre/BudgetHook.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline)
2. Complete Phase 2: Foundational (type consolidation + re-export)
3. Complete Phase 3: User Story 1 (import migration + validation test)
4. **STOP and VALIDATE**: `tsc --noEmit` passes, single canonical type exists
5. This alone eliminates the duplicate type definition — the root cause of type drift

### Incremental Delivery

1. Setup + Foundational → Type consolidated (biggest risk eliminated)
2. Add User Story 1 → All imports migrated → Validate (MVP!)
3. Add User Story 2 → All producers populate `contributor` → Validate
4. Add User Story 3 → Documentation aligned → Validate
5. Polish → Final verification → Feature complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- `as any` casts are cleaned up in US2 as part of producer updates (not a separate task)
- The re-export in `types.ts` (T007) provides the backward compatibility bridge — direct import migration (T009-T011) upgrades consumers to canonical path
- Commit after each phase completion for safe rollback points
