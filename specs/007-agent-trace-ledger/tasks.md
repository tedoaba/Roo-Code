# Tasks: Agent Trace Ledger (Append-Only)

**Input**: Design documents from `/specs/007-agent-trace-ledger/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Generation includes tests as specified in the quickstart and research documents (TDD approach).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create directory structure for `.orchestration/` and `src/utils/orchestration/`
- [x] T002 [P] Finalize `AgentTraceEntry` (including `attribution`) and `ILedgerManager` interfaces in `src/contracts/AgentTrace.ts`
- [x] T002a [P] Add benchmark utility to verify <50ms write target in `src/utils/orchestration/__tests__/performance.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `LedgerManager` with atomic append logic in `src/utils/orchestration/LedgerManager.ts`
- [x] T004 [P] Create unit tests for `LedgerManager` in `src/utils/orchestration/__tests__/LedgerManager.test.ts`
- [x] T005 [P] Setup SHA-256 hashing integration using existing utilities in `src/utils/orchestration/LedgerManager.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Append to Ledger (Priority: P1) 🎯 MVP

**Goal**: System process appends a semantic trace to the agent trace ledger for every mutation.

**Independent Test**: Execute a mutation and verify that `agent_trace.jsonl` receives an appended entry and no existing content is modified.

### Tests for User Story 1

- [x] T006 [P] [US1] Create unit tests for `AgentTraceHook` in `src/hooks/post/__tests__/AgentTraceHook.test.ts`
- [x] T007 [P] [US1] Create integration test for end-to-end trace logging in `src/test/integration/AgentTrace.integration.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement `AgentTraceHook` in `src/hooks/post/AgentTraceHook.ts` using `LedgerManager`
- [x] T009 [US1] Register `AgentTraceHook` in the `HookEngine` registry to trigger on `PostToolUse`
- [x] T010 [US1] Add validation in `AgentTraceHook` to ensure no duplicate entries per mutation event

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T011 [P] Ensure `.orchestration/agent_trace.jsonl` is correctly handled in gitignore or system exclusions
- [x] T012 Run quickstart.md validation scenarios to confirm ledger persistence across sessions
- [x] T013 [P] Document ledger format and rotation considerations (if any) in `specs/007-agent-trace-ledger/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **Polish (Phase 4)**: Depends on Phase 3.

### User Story Completion Order

1. **User Story 1**: Core ledger persistence and hook integration.

---

## Parallel Execution Examples

### User Story 1 Parallelization

```bash
# Parallel tests and configuration
Task: "T006 Create unit tests for AgentTraceHook"
Task: "T007 Create integration test for end-to-end trace logging"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Implement `AgentTraceHook` and register it.
3. Validate with integration tests.
4. **STOP and VALIDATE**: Confirm JSONL format and atomic appends.
