---
description: "Tasks for Post-Write Trace Hook"
---

# Tasks: Post-Write Trace Hook

**Input**: Design documents from `/specs/006-post-write-trace-hook/`
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/PostWriteTraceHook.ts`, `quickstart.md`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize contracts file `src/contracts/AgentTrace.ts` mapping the definitions from `specs/006-post-write-trace-hook/contracts/PostWriteTraceHook.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Implement SHA-256 hash generator in `src/utils/crypto/hashing.ts` checking for existence of paths before hashing.
- [ ] T003 [P] Write unit tests for robust file hashing in `tests/utils/hashing.test.ts`.
- [ ] T004 Define empty `AgentTraceHook` class structure implementing the contract interface in `src/hooks/post/AgentTraceHook.ts`.

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Automatic Trace Capture (Priority: P1) 🎯 MVP

**Goal**: Automatically capture a structured trace after every file modification, recording system mutations verifiably.

**Independent Test**: Modifying a single file and asserting exactly one properly structured trace object is generated containing the right root attributes (path, timestamp, mutation class).

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T005 [P] [US1] Create unit test verifying minimum trace fields (agent, path, timestamp, mutation_class) in `tests/hooks/AgentTraceHook.test.ts`.

### Implementation for User Story 1

- [ ] T006 [US1] Implement trace capture logic and basic object instantiation writing directly to ledger internally in `src/hooks/post/AgentTraceHook.ts` (ensure native `fs.appendFile` or existing ledger synchronization utilities are utilized during write to avoid concurrency race conditions).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Trace Context and Relationships (Priority: P2)

**Goal**: Inject the request/intent IDs into related arrays and map the content hash exactly representing file state.

**Independent Test**: Verifying relations and payload values on a captured trace event.

### Tests for User Story 2 ⚠️

- [ ] T007 [P] [US2] Update `tests/hooks/AgentTraceHook.test.ts` to verify valid intent mapping (`related` array) and structural content hash integrity.

### Implementation for User Story 2

- [ ] T008 [US2] Extend `src/hooks/post/AgentTraceHook.ts` to assemble and inject the `related` ID tracking arrays.
- [ ] T009 [US2] Integrate `hashing.ts` into `src/hooks/post/AgentTraceHook.ts` to actively compute and set the `content_hash` payload field.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Trace Fail-Safe (Priority: P3)

**Goal**: Fail safely if trace generation encounters an error, preventing disruption of primary core operations.

**Independent Test**: Forcing an error during the trace process and ensuring the original write operation still succeeds without crashing.

### Tests for User Story 3 ⚠️

- [ ] T010 [P] [US3] Append test cases to `tests/hooks/AgentTraceHook.test.ts` to simulate internal failures from invalid structures and assert safe resolution.

### Implementation for User Story 3

- [ ] T011 [US3] Wrap internal `execute` logic inside `src/hooks/post/AgentTraceHook.ts` with a non-blocking `try-catch` logging handler.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T012 Register `AgentTraceHook` conditionally within the primary Hook Engine pipeline (post-write tool boundary) inside `src/hooks/HookEngine.ts`, explicitly filtering to apply only for write tools.
- [ ] T013 Verify e2e integration per `quickstart.md` scenario by triggering manual write operations and confirming `.orchestration/agent_trace.jsonl` footprint.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
    - Sequential in priority order (US1 → US2 → US3) since US2 and US3 expand on US1 tracing logic.
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P2)**: Modifies `src/hooks/post/AgentTraceHook.ts` to expand logging constraints. Dependent on User Story 1 object shell.
- **User Story 3 (P3)**: Wraps `src/hooks/post/AgentTraceHook.ts` execution logic. Applicable directly over User Story 1 & 2 blocks.

### Parallel Opportunities

- The unit test creations (T003, T005, T007, T010) mapped with `[P]` can be generated entirely parallelized before the underlying files are implemented fully as they strictly follow contract tests.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify Trace Engine generates simple payload to the ledger sidecar.

### Incremental Delivery

1. Foundation ready.
2. Add User Story 1 → Hooks trace basic output → Deploy/Demo (MVP!)
3. Add User Story 2 → Hooks now identify full file mappings and relationships.
4. Add User Story 3 → Hooks become robust against edge formatting cases.
5. Polish connects the verified standalone Hook into the primary Extension `HookEngine` registry.
