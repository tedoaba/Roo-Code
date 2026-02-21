---
description: "Task list for Proactive Tool Filtering for Intent Handshake implementation"
---

# Tasks: Proactive Tool Filtering for Intent Handshake

**Input**: Design documents from `/specs/016-proactive-tool-filtering/`
**Prerequisites**: plan.md, spec.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [x] T001 Review `src/core/task/build-tools.ts` and `src/core/task/Task.ts` to understand existing mode filtering and hookEngine integration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure updates to pass execution state down to the tool builder.

- [x] T002 Update `buildNativeToolsArray` signature in `src/core/task/build-tools.ts` to accept an `ExecutionState` parameter (e.g. `currentState: "REQUEST" | "REASONING" | "ACTION"`).
- [x] T003 Update `Task.ts` in `src/core/task/Task.ts` to fetch `this.hookEngine.getCurrentState()` and pass it when calling `buildNativeToolsArray`.

**Checkpoint**: Foundation ready - the state is now accessible inside the tool builder.

---

## Phase 3: User Story 1 - REASONING State Restrictions (Priority: P1) 🎯 MVP

**Goal**: AI in planning (REASONING/REQUEST) state should only see SAFE tools and intent selection capabilities.

**Independent Test**: Build the tools array with state `REASONING`. Verify that write tools (`write_to_file`, `execute_command`) are absent, and read tools + `select_active_intent` are present.

### Tests for User Story 1

- [x] T004 [US1] Add unit tests in `src/core/task/__tests__/build-tools.spec.ts` (or appropriate test file) to verify `buildNativeToolsArray` returns only SAFE tools when in REQUEST or REASONING state.

### Implementation for User Story 1

- [x] T005 [US1] Implement filtering logic in `src/core/task/build-tools.ts` to check the classification of each tool against `COMMAND_CLASSIFICATION` (from `src/services/orchestration/types.ts`) and drop `DESTRUCTIVE` tools when `currentState` is `REQUEST` or `REASONING`.
- [x] T006 [US1] Explicitly ensure `select_active_intent` is always preserved in the filtered list regardless of strict safety classifications.

**Checkpoint**: At this point, User Story 1 is functional. The LLM cannot see destructive tools before intent selection.

---

## Phase 4: User Story 2 - ACTION State Visibility (Priority: P1)

**Goal**: AI in execution (ACTION) state should see all available tools filtered only by mode permissions.

**Independent Test**: Build the tools array with state `ACTION`. Verify that DESTRUCTIVE tools are present according to normal mode permissions.

### Tests for User Story 2

- [x] T007 [P] [US2] Add unit tests in `src/core/task/__tests__/build-tools.spec.ts` to verify `buildNativeToolsArray` does not enforce execution-state restrictions when `currentState` is `ACTION`.

### Implementation for User Story 2

- [x] T008 [US2] Update logic in `src/core/task/build-tools.ts` to bypass execution-state filtering when `currentState === 'ACTION'`, fully deferring to the normal mode-based visibility logic.

**Checkpoint**: At this point, the tool catalog dynamically shrinks and expands based on the current AI conversational state.

---

## Phase 5: User Story 3 - Token Budget Conservation (Priority: P2)

**Goal**: Verify that tool filtering actively reduces prompt token sizes by omitting irrelevant schemas.

**Independent Test**: Compare output array sizes and verify that irrelevant tool JSON schemas are completely excluded.

### Tests for User Story 3

- [x] T009 [P] [US3] Add an assertion to the test suite verifying that the serialized JSON size of the tool array in `REASONING` state is strictly smaller than in `ACTION` state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validations and cleanups.

- [x] T010 Run existing tests for `build-tools.ts` and `Task.ts` to ensure no regressions in mode filtering.
- [x] T011 [P] Ensure Edge Cases are met: default unknown tools to DESTRUCTIVE if missing classification (fail-safe).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
    - US1 must be completed first as it introduces the core filtering loop.
    - US2 modifies the loop to allow ACTION state pass-through.
    - US3 verifies the overall outcome.
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational.
- **User Story 2 (P1)**: Depends on US1 (enhances the same function block).
- **User Story 3 (P2)**: Depends on US1 and US2.

### Parallel Opportunities

- Unit tests for US1, US2, and US3 can be drafted in parallel once the signature (Phase 2) is established.
- Polish phase test verification can be executed at any time for sanity checking base logic.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and 2 to pipe the state into the builder.
2. Implement Phase 3 (US1) checking for `REQUEST`/`REASONING` states and returning safe tools.
3. Validate independent tests for US1.

### Incremental Delivery

1. Deliver US1 implementation to lock down early destructiveness.
2. Deliver US2 to restore action capability when the intent is active.
3. Deliver US3 as a final test validation loop for token measurement.
