# Tasks: Verification Failure Detection Hook

**Input**: Design documents from `/specs/013-verification-failure-hook/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Vitest unit and integration tests are MANDATORY for this feature to ensure robustness (SC-002) and parsing accuracy (SC-004).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create directory structure `src/hooks/post/` and `tests/hooks/` per implementation plan
- [x] T002 [P] Verify or configure Vitest setup for internal hook testing in `vitest.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Update Lesson schema in `src/core/lessons/types.ts` to make `cause`, `resolution`, and `corrective_rule` optional for auto-recordings
- [x] T004 Update `LessonRecorder.ts` to support de-duplication using the `signature` field (SHA-256 of error summary)
- [x] T005 Create `VerificationFailureHook.ts` class scaffold in `src/hooks/post/VerificationFailureHook.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automated Linter Failure Recording (Priority: P1) 🎯 MVP

**Goal**: Automatically record a lesson when a linter check fails (e.g., eslint).

**Independent Test**: Run `npm run lint` on a file with errors and verify a lesson is recorded in `.lessons/` or `AGENT.md`.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Create unit tests for linter failure parsing in `tests/hooks/VerificationFailureHook.linter.test.ts`
- [x] T007 [P] [US1] Create integration test for `postToolUse` hook trigger in `tests/integration/HookEngine.linter.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement linter command whitelisting and exit code detection in `src/hooks/post/VerificationFailureHook.ts`
- [x] T009 [US1] Implement smart filtering for linter output (extract filenames and "Error" lines) in `src/hooks/post/VerificationFailureHook.ts`
- [x] T010 [US1] Integrate `VerificationFailureHook` into `src/hooks/HookEngine.ts`'s `postToolUse` method
- [x] T011 [US1] Implement a configurable whitelist mechanism (constant or config file) for monitored tools
- [x] T012 [US1] Validate linter failure recording by running a failing lint command in the terminal

**Checkpoint**: User Story 1 (Linter Recording) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Automated Test Failure Recording (Priority: P1)

**Goal**: Automatically record a lesson when a test suite fails (e.g., jest, vitest).

**Independent Test**: Run `npm test` on a failing test case and verify the `LessonRecorder` captures the failure snippet.

### Tests for User Story 2

- [x] T013 [P] [US2] Create unit tests for test failure parsing (Jest/Vitest output) in `tests/hooks/VerificationFailureHook.testrunner.test.ts`

### Implementation for User Story 2

- [x] T014 [US2] Add test runner commands (`jest`, `vitest`, `npm test`) to the whitelist in `src/hooks/post/VerificationFailureHook.ts`
- [x] T015 [US2] Implement output filtering for test failures (FAIL blocks, expectation diffs) in `src/hooks/post/VerificationFailureHook.ts`
- [x] T016 [US2] Validate test failure recording by running a failing test in the terminal

**Checkpoint**: User Story 2 (Test Failure Recording) is fully functional and testable independently.

---

## Phase 5: User Story 3 - Robust Failure Handling (Priority: P2)

**Goal**: Ensure hook failures do not crash the primary tool execution flow.

**Independent Test**: Mock `LessonRecorder` to throw an error and verify `HookEngine` still returns the tool output correctly.

### Tests for User Story 3

- [x] T017 [P] [US3] Create robustness tests with injected errors in `tests/hooks/VerificationFailureHook.robustness.test.ts`

### Implementation for User Story 3

- [x] T018 [US3] Wrap hook execution in a try/catch block with async execution in `src/hooks/HookEngine.ts`
- [x] T019 [US3] Ensure errors in the hook are logged to the extension output but do not propagate to the AI caller

**Checkpoint**: All user stories should now be independently functional and the system is robust.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T020 [P] Update `AGENT.md` template documentation to reflect automated lesson entries
- [x] T021 Run `quickstart.md` validation scenarios
- [x] T022 [P] Code cleanup and optimization of regex patterns in `VerificationFailureHook.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
    - US1 (MVP) should be completed first
    - US2 can be completed in parallel with US1 implementation once T008 is defined
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation (Phase 2)
- **User Story 2 (P1)**: Foundation (Phase 2)
- **User Story 3 (P2)**: Implementation in HookEngine (Phase 3 integration)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify linter failures are recorded correctly.

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 (MVP)
3. Add User Story 2 (Test Failures)
4. Add User Story 3 (Robustness)
