# Tasks: HookRegistry Dynamic Plugin System

**Input**: Design documents from `/specs/020-hook-registry/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested in Success Criteria (SC-007, SC-008) and User Stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure for `src/hooks/engine/` and directories for extracted hooks
- [ ] T002 Define `IPreHook`, `IPostHook`, and `IHookRegistry` interfaces in `src/hooks/engine/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Implement `HookRegistry` core logic (register, executePre, executePost) in `src/hooks/engine/HookRegistry.ts`
- [ ] T004 Create foundational unit tests for `HookRegistry` in `tests/hooks/HookRegistry.test.ts` covering basic registration and execution

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Register and Execute Pre-Hooks in Priority Order (Priority: P1) 🎯 MVP

**Goal**: Deliver the ordered pre-hook execution through the registry.

**Independent Test**: Register mock pre-hooks with conflicting priorities and verify FIFO order; verify DENY/HALT short-circuits.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Extract Fail-Safe check to `src/hooks/pre/FailSafeHook.ts`
- [ ] T006 [P] [US1] Extract State Check logic to `src/hooks/pre/StateCheckHook.ts`
- [ ] T007 [P] [US1] Extract Traceability enforcement to `src/hooks/pre/TraceabilityHook.ts`
- [ ] T008 [P] [US1] Extract Concurrency/Lock logic to `src/hooks/pre/ConcurrencyHook.ts`
- [ ] T009 [P] [US1] Extract Scope Enforcement to `src/hooks/pre/ScopeEnforcementHook.ts`
- [ ] T010 [P] [US1] Extract Budget Check logic to `src/hooks/pre/BudgetHook.ts`
- [ ] T011 [P] [US1] Extract Circuit Breaker logic to `src/hooks/pre/CircuitBreakerHook.ts`
- [ ] T012 [US1] Add unit tests for pre-hook priority ordering in `tests/hooks/HookRegistry.test.ts`

**Checkpoint**: At this point, the registry can handle all existing pre-execution governance logic.

---

## Phase 4: User Story 2 - Register and Execute Post-Hooks with Error Isolation (Priority: P1)

**Goal**: Deliver sequential post-hook execution with robust error isolation.

**Independent Test**: Register a crashing post-hook and verify subsequent hooks still execute.

### Implementation for User Story 2

- [ ] T013 [P] [US2] Extract Mutation Logging logic to `src/hooks/post/MutationLogHook.ts`
- [ ] T014 [P] [US2] Extract Turn Context update logic to `src/hooks/post/TurnContextHook.ts`
- [ ] T015 [P] [US2] Extract General Trace logging to `src/hooks/post/GeneralTraceHook.ts`
- [ ] T016 [US2] Add unit tests for post-hook error isolation and sequential execution in `tests/hooks/HookRegistry.test.ts`

**Checkpoint**: At this point, the registry can handle all existing post-execution audit and logging logic.

---

## Phase 5: User Story 5 - HookEngine Delegates to HookRegistry (Priority: P1)

**Goal**: Integration of the registry into the main engine, replacing monolithic code.

**Independent Test**: Run existing `HookEngine` tests and verify 100% pass rate.

### Implementation for User Story 5

- [ ] T017 [US5] Instantiate and populate `HookRegistry` in `src/hooks/HookEngine.ts` constructor with all extracted hooks
- [ ] T018 [US5] Refactor `HookEngine.preToolUse()` to delegate to `this.registry.executePre()`
- [ ] T019 [US5] Refactor `HookEngine.postToolUse()` to delegate to `this.registry.executePost()`
- [ ] T020 [US5] Verify behavioral equivalence by running `npm test tests/hooks/HookEngine.test.ts`

**Checkpoint**: The system is now architecture-complete and backward compatible.

---

## Phase 6: User Stories 3, 4, 6 - Dynamic Management & Inspection (P2-P3)

**Goal**: Complete the management API and enable better testing support.

**Independent Test**: Deregister a hook and verify it no longer runs; inspect registry and verify the returned list.

### Implementation for US3, US4, US6

- [ ] T021 [P] [US3] Implement and test `deregister()` in `src/hooks/engine/HookRegistry.ts`
- [ ] T022 [P] [US4] Implement and test `getRegisteredHooks()` in `src/hooks/engine/HookRegistry.ts`
- [ ] T023 [US6] Create integration tests showing registration of a mock hook replacing a default one in `tests/hooks/HookEngineMocking.test.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T024 [P] Update internal documentation and comments to reflect the new registry architecture
- [ ] T025 Performance audit of hook execution overhead across all stories
- [ ] T026 Final code coverage report for `src/hooks/engine/HookRegistry.ts` (target 90%+)
- [ ] T027 Run full `quickstart.md` validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
    - US1 and US2 can proceed in parallel once Phase 2 is done.
    - US5 depends on US1 and US2 (extracting the logic first).
    - US3, US4, US6 can be done in any order after Phase 2.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation ready - can start immediately.
- **User Story 2 (P1)**: Foundation ready - can start immediately.
- **User Story 5 (P1)**: Depends on US1 and US2 delivery (as it integrates the extracted logic).

### Parallel Opportunities

- Extraction of individual pre-hooks in Phase 3 (T005-T011) can run in parallel.
- Extraction of individual post-hooks in Phase 4 (T013-T015) can run in parallel.
- Phase 6 tasks are mostly independent and can run in parallel.

---

## Implementation Strategy

### MVP First (US1, US2, US5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3 (US1) & Phase 4 (US2) - extracting hook logic.
4. Complete Phase 5 (US5) - Integrating the registry.
5. **STOP and VALIDATE**: Verify all existing tests pass.

### Incremental Delivery

1. Foundation ready.
2. Pre-hooks extracted and registry-powered.
3. Post-hooks extracted and registry-powered.
4. HookEngine delegated and simplified.
5. Add dynamic management tools.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commitment after each Story completion is recommended to preserve history.
