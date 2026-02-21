# Tasks: Governance Isolation Boundary Enforcement

**Input**: Design documents from `/specs/021-governance-isolation/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅), quickstart.md (✅)

**Tests**: No new test creation requested. Existing tests must pass after each move. Co-located tests move alongside their modules (FR-021).

**Organization**: Tasks follow the migration dependency order from FR-017 and data-model.md §1. Each phase corresponds to a migration phase, organized by user story where applicable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (VSCode extension)
- Paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the target directory structure that all subsequent moves depend on

- [ ] T001 Create target subdirectories under `src/hooks/`: `state/`, `state/lessons/`, `state/__tests__/`, `state/lessons/__tests__/`, `tools/`, `prompts/`, `contracts/`, `contracts/__tests__/` — per FR-001
- [ ] T002 Verify existing directories are already in place: `src/hooks/engine/` (contains `HookRegistry.ts`, `types.ts`), `src/hooks/errors/` (contains `StaleWriteError.ts`), `src/hooks/pre/`, `src/hooks/post/` — per FR-018

**Checkpoint**: All target directories exist. No files moved yet. Tests pass (no changes to code).

---

## Phase 2: Foundational — Types & Contracts Migration (Phase 1 in data-model.md)

**Purpose**: Move type definitions and contract interfaces first — they have zero governance dependencies and are imported by all other modules being moved. MUST complete before any other module moves.

**⚠️ CRITICAL**: No user story module moves can begin until contracts/types are relocated.

- [ ] T003 [US1] Copy `src/contracts/AgentTrace.ts` to `src/hooks/contracts/AgentTrace.ts`, update any internal imports to use canonical paths — per FR-012
- [ ] T004 [US1] Replace `src/contracts/AgentTrace.ts` with a re-export shim containing `@deprecated` JSDoc tag pointing to `src/hooks/contracts/AgentTrace.ts` — per FR-014
- [ ] T005 [US2] Verify all tests pass after AgentTrace move — per FR-016. Run `npx vitest run`
- [ ] T006 [US1] Copy `src/contracts/__tests__/AgentTraceEntry.test.ts` to `src/hooks/contracts/__tests__/AgentTraceEntry.test.ts`, update test imports to reference `../AgentTrace` (new canonical path) — per FR-021
- [ ] T007 [US2] Verify all tests pass after AgentTrace test move — per FR-016. Run `npx vitest run`
- [ ] T008 [P] [US1] Copy `src/core/concurrency/types.ts` to `src/hooks/state/types.ts`, update any internal imports to use canonical paths — per FR-020
- [ ] T009 [P] [US1] Replace `src/core/concurrency/types.ts` with a re-export shim containing `@deprecated` JSDoc tag pointing to `src/hooks/state/types.ts` — per FR-014
- [ ] T010 [US2] Verify all tests pass after concurrency/types move — per FR-016. Run `npx vitest run`

**Checkpoint**: Types & contracts relocated. All downstream modules can now import from canonical paths. Tests pass.

---

## Phase 3: User Story 1 — Governance Code Discoverability (Priority: P1) 🎯 MVP

**Goal**: All governance modules reside at their §6.3-documented paths under `src/hooks/`

**Independent Test**: Every governance module listed in the Architecture document §6.3 exists at its target path under `src/hooks/`, and no governance-specific logic (beyond re-exports) remains in `src/core/`, `src/services/`, `src/utils/`, or `src/errors/`

### 3a: Errors Migration (Phase 2 in data-model.md)

- [ ] T011 [US1] Copy `src/errors/TraceabilityError.ts` to `src/hooks/errors/TraceabilityError.ts`, update any internal imports to use canonical paths — per FR-009
- [ ] T012 [US1] Replace `src/errors/TraceabilityError.ts` with a re-export shim containing `@deprecated` JSDoc tag pointing to `src/hooks/errors/TraceabilityError.ts` — per FR-014
- [ ] T013 [US2] Verify all tests pass after TraceabilityError move — per FR-016. Run `npx vitest run`

### 3b: State & Concurrency Migration (Phase 3 in data-model.md)

- [ ] T014 [US1] Copy `src/core/state/StateMachine.ts` to `src/hooks/state/StateMachine.ts`, update internal imports: change `../../contracts/AgentTrace` to `../contracts/AgentTrace` (canonical), update `OrchestrationService` import, update `types` import — per FR-003, FR-019
- [ ] T015 [US1] Replace `src/core/state/StateMachine.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T016 [US1] Copy `src/core/state/__tests__/StateMachine.test.ts` to `src/hooks/state/__tests__/StateMachine.test.ts`, update test imports to reference new canonical paths — per FR-021
- [ ] T017 [US2] Verify all tests pass after StateMachine move — per FR-016. Run `npx vitest run`
- [ ] T018 [P] [US1] Copy `src/core/concurrency/TurnContext.ts` to `src/hooks/state/TurnContext.ts`, update internal imports to canonical paths — per FR-004, FR-019
- [ ] T019 [P] [US1] Replace `src/core/concurrency/TurnContext.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T020 [P] [US1] Copy `src/core/concurrency/__tests__/TurnContext.test.ts` to `src/hooks/state/__tests__/TurnContext.test.ts`, update test imports — per FR-021
- [ ] T021 [P] [US1] Copy `src/core/concurrency/OptimisticGuard.ts` to `src/hooks/state/OptimisticGuard.ts`, update internal imports to canonical paths — per FR-005, FR-019
- [ ] T022 [P] [US1] Replace `src/core/concurrency/OptimisticGuard.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T023 [P] [US1] Copy `src/core/concurrency/__tests__/OptimisticGuard.test.ts` to `src/hooks/state/__tests__/OptimisticGuard.test.ts`, update test imports — per FR-021
- [ ] T024 [P] [US1] Copy `src/core/concurrency/__tests__/TurnLifecycle.test.ts` to `src/hooks/state/__tests__/TurnLifecycle.test.ts`, update test imports — per FR-021
- [ ] T025 [US2] Verify all tests pass after TurnContext, OptimisticGuard, and TurnLifecycle moves — per FR-016. Run `npx vitest run`
- [ ] T026 [US1] Copy `src/services/orchestration/OrchestrationService.ts` to `src/hooks/state/OrchestrationService.ts`, update internal imports to canonical paths. Keep the `./types` import pointing to `../../services/orchestration/types` (NOT moved — contains non-governance `COMMAND_CLASSIFICATION`). Update any imports of already-moved modules (e.g., `AgentTrace`) to their new canonical `src/hooks/` paths — per FR-010, FR-019
- [ ] T027 [US1] Replace `src/services/orchestration/OrchestrationService.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T028 [US2] Verify all tests pass after OrchestrationService move — per FR-016. Run `npx vitest run`
- [ ] T029 [US1] Copy `src/utils/orchestration/LedgerManager.ts` to `src/hooks/state/LedgerManager.ts`, update internal imports to canonical paths — per FR-011, FR-019
- [ ] T030 [US1] Replace `src/utils/orchestration/LedgerManager.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T031 [US1] Copy `src/utils/orchestration/__tests__/LedgerManager.test.ts` to `src/hooks/state/__tests__/LedgerManager.test.ts`, update test imports — per FR-021
- [ ] T032 [US2] Verify all tests pass after LedgerManager move — per FR-016. Run `npx vitest run`

### 3c: Lessons Migration (Phase 4 in data-model.md)

- [ ] T033 [P] [US1] Copy `src/core/lessons/types.ts` to `src/hooks/state/lessons/types.ts` — per FR-006
- [ ] T034 [P] [US1] Replace `src/core/lessons/types.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T035 [P] [US1] Copy `src/core/lessons/LockManager.ts` to `src/hooks/state/lessons/LockManager.ts`, update internal imports to canonical paths — per FR-006, FR-019
- [ ] T036 [P] [US1] Replace `src/core/lessons/LockManager.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T037 [P] [US1] Copy `src/core/lessons/Deduplicator.ts` to `src/hooks/state/lessons/Deduplicator.ts`, update internal imports — per FR-006, FR-019
- [ ] T038 [P] [US1] Replace `src/core/lessons/Deduplicator.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T039 [P] [US1] Copy `src/core/lessons/LessonAuditLogger.ts` to `src/hooks/state/lessons/LessonAuditLogger.ts`, update internal imports (note: imports `LedgerManager` — use canonical `../../LedgerManager`) — per FR-006, FR-019
- [ ] T040 [P] [US1] Replace `src/core/lessons/LessonAuditLogger.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T041 [P] [US1] Copy `src/core/lessons/LessonRecorder.ts` to `src/hooks/state/lessons/LessonRecorder.ts`, update internal imports — per FR-006, FR-019
- [ ] T042 [P] [US1] Replace `src/core/lessons/LessonRecorder.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T043 [P] [US1] Copy `src/core/lessons/LessonRetriever.ts` to `src/hooks/state/lessons/LessonRetriever.ts`, update internal imports — per FR-006, FR-019
- [ ] T044 [P] [US1] Replace `src/core/lessons/LessonRetriever.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T045 [P] [US1] Copy `src/core/lessons/__tests__/Deduplicator.test.ts` to `src/hooks/state/lessons/__tests__/Deduplicator.test.ts`, update test imports — per FR-021
- [ ] T046 [P] [US1] Copy `src/core/lessons/__tests__/LessonRecorder.test.ts` to `src/hooks/state/lessons/__tests__/LessonRecorder.test.ts`, update test imports — per FR-021
- [ ] T047 [US2] Verify all tests pass after all lessons module moves — per FR-016. Run `npx vitest run`

### 3d: Tools Migration (Phase 5 in data-model.md)

- [ ] T048 [US1] Copy `src/core/tools/SelectActiveIntent.ts` to `src/hooks/tools/SelectActiveIntentTool.ts`, update internal imports: change `./BaseTool` to `../../core/tools/BaseTool`, change `../../contracts/AgentTrace` to `../contracts/AgentTrace` — per FR-007, FR-019
- [ ] T049 [US1] Replace `src/core/tools/SelectActiveIntent.ts` with a re-export shim containing `@deprecated` JSDoc tag pointing to `src/hooks/tools/SelectActiveIntentTool.ts` (re-exports `SelectActiveIntentTool` and `selectActiveIntentTool`) — per FR-014
- [ ] T050 [US2] Verify all tests pass after SelectActiveIntentTool move — per FR-016. Run `npx vitest run`

### 3e: Prompts Migration (Phase 6 in data-model.md)

- [ ] T051 [US1] Copy `src/core/prompts/sections/intent-handshake.ts` to `src/hooks/prompts/intent-handshake.ts`, update internal imports to canonical paths — per FR-008, FR-019
- [ ] T052 [US1] Replace `src/core/prompts/sections/intent-handshake.ts` with a re-export shim containing `@deprecated` JSDoc tag — per FR-014
- [ ] T053 [US2] Verify all tests pass after intent-handshake move — per FR-016. Run `npx vitest run`

### 3f: Engine Restructuring (Phase 7 in data-model.md)

- [ ] T054 [US1] Copy `src/hooks/HookEngine.ts` to `src/hooks/engine/HookEngine.ts`, update all internal imports to canonical paths: change `../services/orchestration/OrchestrationService` to `../state/OrchestrationService`, change `../core/state/StateMachine` to `../state/StateMachine`, change `../core/concurrency/types` to `../state/types`, change `../core/concurrency/TurnContext` to `../state/TurnContext`, change `./engine/HookRegistry` to `./HookRegistry` — per FR-002, FR-019
- [ ] T055 [US1] Replace `src/hooks/HookEngine.ts` with a re-export (no `@deprecated` — internal restructuring within hooks/): re-exports `HookEngine`, `ToolRequest`, `ToolResult` from `./engine/HookEngine` — per FR-002
- [ ] T056 [US2] Verify all tests pass after HookEngine restructuring — per FR-016. Run `npx vitest run`

**Checkpoint**: All governance modules relocated. User Story 1 (Discoverability) and User Story 2 (Backward Compatibility) are both satisfied. All tests pass.

---

## Phase 4: User Story 3 — Subdirectory Role Clarity (Priority: P2)

**Goal**: `src/hooks/index.ts` barrel export organizes exports by subdirectory namespace, and a migration guide documents the directory conventions

**Independent Test**: The barrel export at `src/hooks/index.ts` exposes all public APIs organized by subdirectory, and a migration guide maps old → new paths

### Implementation for User Story 3

- [ ] T057 [US3] Update `src/hooks/index.ts` to re-organize all exports by subdirectory namespace (engine, state, state/lessons, tools, contracts, errors, pre-hooks, post-hooks) with section comments — per FR-013, research.md RQ-6
- [ ] T058 [US2] Verify all tests pass after barrel export update — per FR-016. Run `npx vitest run`
- [ ] T059 [US3] Generate migration guide document at `specs/021-governance-isolation/migration-guide.md` mapping every old path to its new canonical path with exported symbols — per FR-015, data-model.md §4

**Checkpoint**: User Story 3 complete. Barrel export is organized by subdirectory. Migration guide is complete.

---

## Phase 5: User Story 4 — Lint Rule Enforcement Readiness (Priority: P3)

**Goal**: Codebase is structured such that `src/core/` files at old locations contain only re-export shims — ready for a future lint rule

**Independent Test**: Static inspection confirms no governance logic remains in `src/core/`, `src/services/`, `src/utils/`, or `src/errors/` (only re-export shims)

### Implementation for User Story 4

- [ ] T060 [US4] Audit all re-export shims to confirm they contain ONLY re-export statements and `@deprecated` JSDoc tags — no leftover governance logic in: `src/core/state/StateMachine.ts`, `src/core/concurrency/TurnContext.ts`, `src/core/concurrency/OptimisticGuard.ts`, `src/core/concurrency/types.ts`, `src/core/lessons/*.ts`, `src/core/tools/SelectActiveIntent.ts`, `src/core/prompts/sections/intent-handshake.ts`, `src/services/orchestration/OrchestrationService.ts`, `src/utils/orchestration/LedgerManager.ts`, `src/errors/TraceabilityError.ts`, `src/contracts/AgentTrace.ts`
- [ ] T061 [US4] Verify `src/hooks/` directory structure matches §6.3 layout: confirm subdirectories `engine/`, `pre/`, `post/`, `state/`, `state/lessons/`, `tools/`, `prompts/`, `contracts/`, `errors/` all exist with expected files

**Checkpoint**: User Story 4 complete. Codebase is lint-rule-ready.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T062 Run full test suite one final time to confirm zero regressions: `npx vitest run` — per SC-003, SC-004
- [ ] T063 [P] Verify success criteria SC-001 through SC-008 are all met by inspecting final codebase state
- [ ] T064 [P] Update `specs/021-governance-isolation/spec.md` status from Draft to Complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user story module moves
- **User Story 1 + 2 (Phase 3)**: Depends on Foundational. US1 (module moves) and US2 (verification) are interleaved — each move is followed by a verification step
- **User Story 3 (Phase 4)**: Depends on Phase 3 completion (all modules must be in place before barrel export and migration guide)
- **User Story 4 (Phase 5)**: Depends on Phase 3 completion (all re-export shims must exist for audit)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)** — Governance Code Discoverability: Core deliverable. All module moves.
- **User Story 2 (P1)** — Backward-Compatible Migration: Interleaved with US1 — each move is verified immediately. Depends on US1 tasks completing in sequence.
- **User Story 3 (P2)** — Subdirectory Role Clarity: Depends on US1 completion (barrel export needs all modules in place).
- **User Story 4 (P3)** — Lint Rule Enforcement Readiness: Can run in parallel with US3 after US1 completion.

### Within Phase 3 (Migration Order)

Strict dependency order per FR-017:

1. Contracts/Types (T003–T010) — no dependencies within phase
2. Errors (T011–T013) — depends on types being moved
3. State/Concurrency (T014–T032) — depends on errors and types being moved
4. Lessons (T033–T047) — depends on state modules (esp. LedgerManager) being moved
5. Tools (T048–T050) — depends on contracts being moved
6. Prompts (T051–T053) — depends on nothing specific but follows tools for safety
7. Engine (T054–T056) — MUST be last (depends on all other modules being in their canonical locations)

### Parallel Opportunities

- T008/T009 (concurrency/types) can run in parallel with T003–T007 (AgentTrace)
- T018–T024 (TurnContext, OptimisticGuard, TurnLifecycle) can all run in parallel after StateMachine is moved
- T033–T046 (all lesson modules and tests) can all run in parallel
- T057 and T059 (barrel export and migration guide) are independent of each other
- T060 and T061 (audit and structure check) can run in parallel
- T063 and T064 (success criteria and status update) can run in parallel

---

## Parallel Example: Lessons Migration

```bash
# All lesson module moves can run in parallel (different files, no inter-dependencies):
Task: "T033 Copy src/core/lessons/types.ts to src/hooks/state/lessons/types.ts"
Task: "T035 Copy src/core/lessons/LockManager.ts to src/hooks/state/lessons/LockManager.ts"
Task: "T037 Copy src/core/lessons/Deduplicator.ts to src/hooks/state/lessons/Deduplicator.ts"
Task: "T039 Copy src/core/lessons/LessonAuditLogger.ts to src/hooks/state/lessons/LessonAuditLogger.ts"
Task: "T041 Copy src/core/lessons/LessonRecorder.ts to src/hooks/state/lessons/LessonRecorder.ts"
Task: "T043 Copy src/core/lessons/LessonRetriever.ts to src/hooks/state/lessons/LessonRetriever.ts"

# All lesson re-export shim replacements can follow in parallel:
Task: "T034 Replace src/core/lessons/types.ts with re-export shim"
Task: "T036 Replace src/core/lessons/LockManager.ts with re-export shim"
Task: "T038 Replace src/core/lessons/Deduplicator.ts with re-export shim"
Task: "T040 Replace src/core/lessons/LessonAuditLogger.ts with re-export shim"
Task: "T042 Replace src/core/lessons/LessonRecorder.ts with re-export shim"
Task: "T044 Replace src/core/lessons/LessonRetriever.ts with re-export shim"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational Types/Contracts (T003–T010)
3. Complete Phase 3: All module moves with interleaved verification (T011–T056)
4. **STOP and VALIDATE**: All governance modules at canonical paths, all tests pass, all imports resolve
5. This alone delivers 100% of the core value

### Incremental Delivery

1. Complete Setup + Foundational → Types and contracts relocated
2. Complete Phase 3 (US1 + US2) → All modules migrated, tests pass (MVP! ✅)
3. Add Phase 4 (US3) → Barrel export organized, migration guide produced
4. Add Phase 5 (US4) → Audit confirms lint-rule readiness
5. Each phase adds value without breaking previous work

### Single Developer Strategy

Execute all tasks sequentially in listed order. The dependency ordering ensures each step builds safely on the last. Every verification task (`npx vitest run`) provides a gate before proceeding.

---

## Notes

- [P] tasks = different files, no dependencies within that group
- [USn] labels map tasks to spec user stories for traceability
- Every module move consists of 2–3 tasks: copy → shim → verify
- Verification tasks (Run `npx vitest run`) are explicitly listed after each move group per FR-016
- Co-located test moves are listed after their module moves per FR-021
- Re-export shims are NOT removed in this feature per clarification Q3 — removal deferred to follow-up
- The `src/services/orchestration/types.ts` file is NOT moved — it contains `COMMAND_CLASSIFICATION` and other non-governance orchestration types used broadly
