# Tasks: Stale File Error Protocol

**Input**: Design documents from `/specs/011-stale-write-error/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/stale-write-error.json

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [ ] T001 Setup `src/hooks/errors` directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [ ] T002 [P] Create `StaleWriteError` custom Error class in `src/hooks/errors/StaleWriteError.ts`
- [ ] T003 Update concurrency error types in `src/core/concurrency/types.ts` to support the new error properties

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Stale Write Detection & Rejection (Priority: P1)

**Goal**: Detect if the file has been modified since it was last read and reject modification if so, preventing data corruption.

**Independent Test**: Simulate a read, modify the file externally, and attempt a write; verify the write is rejected and logged.

### Tests for User Story 1

- [ ] T004 [P] [US1] Write unit tests for `OptimisticGuard` rejection behavior in `src/core/concurrency/OptimisticGuard.test.ts`
- [ ] T005 [P] [US1] Write unit tests for trace logging in `src/hooks/AgentTraceHook.test.ts`

### Implementation for User Story 1

- [ ] T006 [US1] Update `src/core/concurrency/OptimisticGuard.ts` to construct and throw `StaleWriteError` instead of a generic error on hash mismatch
- [ ] T007 [US1] Update `src/hooks/AgentTraceHook.ts` to listen for `StaleWriteError` and record the conflict trace to the Agent Trace Ledger

**Checkpoint**: User Story 1 is functionally complete, modifications are rejected with the new error and logged to the trace ledger.

---

## Phase 4: User Story 2 - Machine-Readable Error Propagation (Priority: P1)

**Goal**: Propagate a structured, machine-readable JSON error payload back to the Agent Controller when a write is rejected.

**Independent Test**: Verify the error payload produced upon rejection exactly matches the predefined JSON schema (`stale-write-error.json`) directly without extra text.

### Tests for User Story 2

- [ ] T008 [P] [US2] Write unit test for `HookEngine` catching `StaleWriteError` and formatting JSON in `src/hooks/HookEngine.test.ts`

### Implementation for User Story 2

- [ ] T009 [US2] Update `src/hooks/HookEngine.ts` to catch `StaleWriteError` during tool execution and serialize the error as a pure JSON `StaleFileErrorPayload` string

**Checkpoint**: User Story 2 is integrated, Agent Controllers now receive deterministic JSON payload on conflict.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, validations and cleanup.

- [ ] T010 [P] Verify generated JSON error payload matches the schema in `contracts/stale-write-error.json`
- [ ] T011 Run all unit tests to explicitly verify 100% of tested stale write scenarios leave target files unmodified and emit logs
- [ ] T012 Run quickstart validation from `specs/011-stale-write-error/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion.
- **Polish (Phase 5)**: Depends on all user stories being completed.

### Parallel Opportunities

- Tests within each user story can be written in parallel.

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 & 2 for Foundational classes.
2. Complete Phase 3 to get error boundaries and logging right.
3. Complete Phase 4 to fulfill the API contract back to the orchestration layer.
