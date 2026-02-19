---
description: "Task list for Semantic Mutation Classifier implementation"
---

# Tasks: Semantic Mutation Classifier

**Input**: Design documents from `/specs/004-mutation-classifier/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are included as requested by the "Success Criteria" in spec.md (SC-001).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directories: `src/core/mutation/engines` and `src/core/mutation/__tests__`
- [x] T002 Verify `typescript` dependency is present in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Define `MutationClass` enum and shared types in `src/shared/types.ts`
- [x] T004 Implement `IMutationEngine` interface and `IMutationClassifier` in `src/core/mutation/types.ts` (based on `contracts/classifier.ts`)
- [x] T005 [P] Implement `BaseEngine` in `src/core/mutation/engines/BaseEngine.ts`
- [x] T006 Create `MutationClassifier` singleton service in `src/core/mutation/MutationClassifier.ts` with engine registration logic

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Categorize Refactoring Activity (Priority: P1) 🎯 MVP

**Goal**: Distinguish between code changes that only affect structure/formatting and those that change behavior for TS/JS.

**Independent Test**: Provide code pairs for formatting, renames, and logic changes and assert classification matches expected `MutationClass`.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Create unit test suite for TS classification in `src/core/mutation/__tests__/MutationClassifier.test.ts`
- [x] T008 [P] [US1] Add test cases for whitespace/formatting changes (AST_REFACTOR)
- [x] T009 [P] [US1] Add test cases for variable/function renames (AST_REFACTOR)
- [x] T010 [P] [US1] Add test cases for adding logic branches or new functions (INTENT_EVOLUTION)
- [x] T010b [P] [US1] Add test cases for edge cases: empty files (AST_REFACTOR) and file deletion (INTENT_EVOLUTION)

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement `TypeScriptEngine` in `src/core/mutation/engines/TypeScriptEngine.ts`
- [x] T012 [US1] Implement AST parsing with `ts.createSourceFile` and error handling (default to `INTENT_EVOLUTION`)
- [x] T013 [US1] Implement recursive AST node comparison logic ignoring trivia (whitespace/comments)
- [x] T014 [US1] Implement identifier normalization to detect consistent renames as `AST_REFACTOR`
- [x] T015 [US1] Register `TypeScriptEngine` for `.ts` and `.js` extensions in `MutationClassifier.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Ensure Deterministic Governance (Priority: P2)

**Goal**: Ensure the same pair of code changes always results in the same classification.

**Independent Test**: Repeated execution (100x) on complex inputs must yield identical results.

### Tests for User Story 2

- [x] T016 [P] [US2] Add determinism validation to `src/core/mutation/__tests__/MutationClassifier.test.ts`
- [x] T017 [US2] Implement a test runner to execute classification 100 times on a complex input pair

**Checkpoint**: User Story 2 verified - governance is predictable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T018 [P] Implement performance benchmark test in `src/core/mutation/__tests__/MutationClassifier.test.ts` (Target: < 500ms for 1000 LOC)
- [x] T019 [P] Update `README.md` with Mutation Classifier documentation
- [x] T020 Final validation of all scenarios in `quickstart.md`
- [x] T021 Code cleanup and linting of `src/core/mutation`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
    - User stories can then proceed in parallel
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Depends on US1 implementation to have something to test for determinism

### Parallel Opportunities

- T005 can run in parallel with T004 (if both started)
- T007-T010 can run in parallel with T011
- T016 can run in parallel while US1 implementation is ongoing (once interface is stable)
- Polish tasks T018 and T019 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (User Story 1).
3. **STOP and VALIDATE**: Verify accuracy against the 4 core cases in US1.

### Incremental Delivery

1. Foundation ready.
2. TS/JS Support (US1) -> MVP.
3. Determinism Verification (US2).
4. Polish and Docs.
