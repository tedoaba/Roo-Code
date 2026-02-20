# Tasks: Agent Turn Hash Snapshot

**Input**: Design documents from `specs/010-turn-hash-snapshot/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included as requested by the feature specification and best practices in research.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure for `src/core/concurrency` and `src/utils/` if missing
- [ ] T002 Ensure SHA-256 utility exists in `src/utils/hashing.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Update `ITurnContext` interface in `src/core/concurrency/types.ts` to include `startTurn`, `endTurn`, and `get_initial_hash`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initial File State Capture (Priority: P1) 🎯 MVP

**Goal**: Compute and store SHA-256 hash of a file on its first read access within a turn.

**Independent Test**: Start turn, read a file via `get_initial_hash`, and verify the returned hash matches the disk state.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US1] Create unit test for initial hash capture in `src/core/concurrency/__tests__/TurnLifecycle.test.ts`

### Implementation for User Story 1

- [ ] T005 [P] [US1] Implement `initialHashes` Map in `src/core/concurrency/TurnContext.ts`
- [ ] T006 [US1] Implement "Compute-If-Absent" pattern in `get_initial_hash` method in `src/core/concurrency/TurnContext.ts`
- [ ] T007 [US1] Handle file read errors (e.g. EACCES) by snapshotting the error state (null) in `src/core/concurrency/TurnContext.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Hash Immutability During Turn (Priority: P1)

**Goal**: Ensure the initial hash remains unchanged regardless of disk modifications during the turn.

**Independent Test**: Read a file once, modify disk, read again, and verify the hash remains the same as the first read.

### Tests for User Story 2

- [ ] T008 [P] [US2] Create unit test for hash immutability and re-read behavior in `src/core/concurrency/__tests__/TurnLifecycle.test.ts`

### Implementation for User Story 2

- [ ] T009 [US2] Ensure `get_initial_hash` returns the stored promise without re-invoking disk read in `src/core/concurrency/TurnContext.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Turn-Scoped Memory Management (Priority: P2)

**Goal**: Ensure that file hash snapshots are cleared at the end of an agent turn to prevent memory leakage.

**Independent Test**: Capture a hash in one turn, end the turn, start a new turn, and verify the snapshot is empty.

### Tests for User Story 3

- [ ] T010 [P] [US3] Create unit test for turn lifecycle and memory cleanup in `src/core/concurrency/__tests__/TurnLifecycle.test.ts`

### Implementation for User Story 3

- [ ] T011 [US3] Implement `startTurn()` and `endTurn()` to clear `initialHashes` in `src/core/concurrency/TurnContext.ts`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T012 Run all tests in `src/core/concurrency/__tests__/TurnLifecycle.test.ts` and verify 100% pass rate
- [ ] T013 Verify performance target: sub-millisecond retrieval for cached hashes in `src/core/concurrency/TurnContext.ts`
- [ ] T014 Run quickstart.md validation to ensure developer usage guide is accurate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2. No dependencies on other stories.
- **User Story 2 (P2)**: Depends on US1 logic but can be tested independently.
- **User Story 3 (P3)**: Can start after Phase 2.

### Within Each User Story

- Tests FIRST, then implementation
- Models/State before services/methods
- Core implementation before integration

### Parallel Opportunities

- T004, T005, T008, T010 can run in parallel (test creation and basic structure setup)
- Logic implementation (T006, T009, T011) can run in parallel if divided by method/responsibility

---

## Parallel Example: MVP Implementation

```typescript
// Task T004: Create tests for US1
// Task T005: Initialize initialHashes Map
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Foundation ready (T003)
2. Add US1 -> Test independently -> MVP ready
3. Add US2 -> Verify immutability
4. Add US3 -> Finalize lifecycle management
