# Tasks: Optimistic Locking Guard

**Input**: Design documents from `/specs/009-optimistic-locking-guard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested in the feature specification (User Scenarios & Testing section).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize `009-optimistic-locking-guard` feature workspace and confirm branch status
- [x] T002 Define shared interfaces `ITurnContext` and `OptimisticLockResult` in `src/core/concurrency/types.ts` per `concurrency-internal.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `TurnContext` class in `src/core/concurrency/TurnContext.ts` with `Map`-based baseline hash storage
- [x] T004 Implement `verifyOptimisticLock` verification logic in `src/core/concurrency/OptimisticGuard.ts` per `concurrency-internal.md`
- [x] T005 [P] Verify existing SHA-256 utility in `src/utils/hashing.ts` meets `OptimisticGuard` requirements
- [x] T006 [P] Create unit tests for `TurnContext` in `src/core/concurrency/__tests__/TurnContext.test.ts`
- [x] T007 [P] Create unit tests for `OptimisticGuard` in `src/core/concurrency/__tests__/OptimisticGuard.test.ts`
- [x] T008 Configure `HookEngine` registry to allow `ConcurrencyHook` integration in `src/hooks/HookEngine.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Prevent Stale Overwrites (Priority: P1) 🎯 MVP

**Goal**: Block writes when a file has changed since the agent began its turn or last read.

**Independent Test**: Simulate a parallel edit between the agent's read and write operations. Verify the write is blocked and a `STALE_FILE` error is returned.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [US1] Create integration test in `src/hooks/__tests__/ConcurrencyIntegration.test.ts` simulating a stale write conflict
- [x] T009a [US1] [P] Verify "Zero False Positives" (SC-002) in integration tests for files that haven't changed
- [x] T009b [US1] [P] Test "File Deletion" edge case (Target missing) produces a `STALE_FILE` error

### Implementation for User Story 1

- [x] T010 [US1] Implement `ConcurrencyHook` in `src/hooks/pre/ConcurrencyHook.ts` to perform pre-mutation validation
- [x] T011 [US1] Register `ConcurrencyHook` in `src/hooks/HookEngine.ts` within the `preToolUse` pipeline
- [x] T012 [US1] Add `postToolUse` interceptor in `src/hooks/HookEngine.ts` to capture `read_file` results and update `TurnContext`
- [x] T013 [US1] Add `postToolUse` interceptor in `src/hooks/HookEngine.ts` to update `TurnContext` after successful `write_to_file`
- [x] T014 [US1] Integrate `LedgerManager` in `src/hooks/pre/ConcurrencyHook.ts` to log `MUTATION_CONFLICT` events (per research.md)
- [x] T015 [US1] Implement structured error return with `STALE_FILE` code and diagnostic hashes in `ConcurrencyHook.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Conflict Recovery Flow (Priority: P2)

**Goal**: Allow agent to recover from a conflict by re-reading the file.

**Independent Test**: Block a write, then perform a new read, then attempt another write. Verify the second write succeeds.

### Tests for User Story 2

- [x] T016 [US2] Add recovery flow scenario test in `src/hooks/__tests__/ConcurrencyIntegration.test.ts` (Read -> Conflict -> Read -> Success)

### Implementation for User Story 2

- [x] T017 [US2] Ensure `TurnContext.recordRead` correctly updates existing entries to reset baseline for recovery
- [x] T018 [US2] Verify integration with `read_file` tool properly resets the guard for the target file

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T019 [P] Performance benchmark for hashing large files (>1MB) in `src/utils/__tests__/hashing_perf.test.ts`
- [x] T020 Review and finalize error recovery hints in `STALE_FILE` response per `quickstart.md`
- [x] T021 [P] Update implementation status in `specs/009-optimistic-locking-guard/tasks.md`
- [x] T022 Run `quickstart.md` validation scenarios against final build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
    - User Story 1 (P1) is the primary MVP.
    - User Story 2 (P2) depends on User Story 1 implementation of the hook.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Foundation for all concurrency protection.
- **User Story 2 (P2)**: Extends US1 with recovery logic.

### Parallel Opportunities

- T005, T006, T007 (Foundational unit tests and utility verification)
- T019, T021 (Polish tasks)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently using simulated parallel edits.

### Incremental Delivery

1. Foundation ready (Phase 1 & 2)
2. MVP: Prevent stale overwrites (Phase 3)
3. Recovery: Allow healing via re-read (Phase 4)
4. Full Polish (Phase 5)
