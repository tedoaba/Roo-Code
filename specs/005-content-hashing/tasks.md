# Tasks: SHA-256 Content Hashing Utility

**Input**: Design documents from `/specs/005-content-hashing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested in the feature specification (US1 & US2 Acceptance Scenarios). A TDD approach will be followed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All descriptions include exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Establish `src/utils/` directory structure per plan.md
- [ ] T002 Initialize `src/utils/__tests__/` directory for Vitest unit tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Define `HashingUtility` interface in `src/utils/hashing.ts` based on `contracts/hashing.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Generate File Content Integrity Hash (Priority: P1) 🎯 MVP

**Goal**: Implement the core hashing function that produces standard SHA-256 hex digests for arbitrary string content.

**Independent Test**: Pass "Hello World" to `generate_content_hash` and verify it returns `a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e`.

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US1] Create unit test for hex digest correctness (empty & non-empty strings) in `src/utils/__tests__/hashing.test.ts`
- [ ] T005 [P] [US1] Create unit test for input validation (TypeError for non-strings, RangeError for >1GB) in `src/utils/__tests__/hashing.test.ts`

### Implementation for User Story 1

- [ ] T006 [US1] Implement `generate_content_hash` using Node.js `crypto.createHash('sha256')` in `src/utils/hashing.ts`
- [ ] T007 [US1] Add type and size validation checks (throwing `TypeError` and `RangeError`) in `src/utils/hashing.ts`

**Checkpoint**: At this point, User Story 1 (Core Hashing) should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Verify Hashing Determinism (Priority: P1)

**Goal**: Ensure the hashing process is entirely deterministic across multiple calls and correctly distinguishes between different inputs.

**Independent Test**: Assert that two calls with the same input string yield identical results.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T008 [P] [US2] Create unit test verifying identical output for identical input in `src/utils/__tests__/hashing.test.ts`
- [ ] T009 [P] [US2] Create unit test verifying different outputs for different inputs in `src/utils/__tests__/hashing.test.ts`

### Implementation for User Story 2

- [ ] T010 [US2] Verify logic in `src/utils/hashing.ts` satisfies determinism (intrinsic to `crypto` module usage)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production readiness.

- [ ] T011 [P] Implement performance benchmark test (< 50ms for 1MB payload) in `src/utils/__tests__/hashing.test.ts`
- [ ] T012 [P] Export utility from main entry point (if applicable) in `src/index.ts`
- [ ] T013 Verify `quickstart.md` examples manually against implemented utility
- [ ] T014 Ensure 100% code coverage for `src/utils/hashing.ts` via Vitest

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
    - User Story 1 (MVP) should be completed first.
    - User Story 2 can be verified immediately after US1 logic is implemented.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2). No dependencies on other stories.
- **User Story 2 (P2)**: Depends on US1 logic being present to verify determinism.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD).
- Core logic before specialized validation.
- Story complete before moving to next priority.

### Parallel Opportunities

- T001 and T002 can be done in parallel.
- Once T003 is done, T004, T005, T008, T009 can be written in parallel (Test Suite).
- T011 and T012 can be done in parallel during Polish phase.

---

## Parallel Example: Project Core Utilities

```bash
# Writing all tests for Content Hashing (TDD setup):
Task: "Create unit test for hex digest correctness in src/utils/__tests__/hashing.test.ts"
Task: "Create unit test for input validation in src/utils/__tests__/hashing.test.ts"
Task: "Create unit test verifying identical output for identical input in src/utils/__tests__/hashing.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Interface Definition)
3. Complete Phase 3: User Story 1 (Core Logic + Tests)
4. **STOP and VALIDATE**: Verify SHA-256 correctness with known hashes.

### Incremental Delivery

1. Foundation ready.
2. Add User Story 1 → Test independently → MVP!
3. Add User Story 2 → Test determinism → Quality Assurance.
4. Polish → Performance & Coverage → Production Grade.
