# Tasks: Missing Post-Hooks Implementation

**Input**: Design documents from `/specs/019-post-hooks-impl/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

There are no shared infrastructure setup tasks required as this feature extends an existing system.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

There are no blocking foundational prerequisites required for this feature, as each hook can be implemented and integrated independently into the existing `HookEngine`.

---

## Phase 3: User Story 1 - Intent Progress Tracking (Priority: P1) 🎯 MVP

**Goal**: System automatically checks if all acceptance criteria for current intent have been met after a mutation, transitioning the intent to COMPLETED if satisfied using simple string/substring matching.

**Independent Test**: Can be fully tested by simulating test suite passes and verifying the intent state transitions and logs in agent_trace.jsonl.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T001 [P] [US1] Create unit tests (≥3 tests) for IntentProgressHook in src/hooks/post/**tests**/IntentProgressHook.spec.ts

### Implementation for User Story 1

- [ ] T002 [US1] Implement IntentProgressHook in src/hooks/post/IntentProgressHook.ts
- [ ] T003 [US1] Integrate IntentProgressHook into HookEngine.postToolUse in src/hooks/HookEngine.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Scope Drift Detection (Priority: P2)

**Goal**: The system detects when a file mutation touches files near the scope boundaries (parent directory) or expands the scope without prior mapping, logging an observational warning without blocking.

**Independent Test**: Can be fully tested by simulating file mutations at the scope boundary and outside the initially defined intent_map.md, verifying that appropriate warnings are logged.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US2] Create unit tests (≥3 tests) for ScopeDriftDetectionHook in src/hooks/post/**tests**/ScopeDriftDetectionHook.spec.ts

### Implementation for User Story 2

- [ ] T005 [US2] Implement ScopeDriftDetectionHook in src/hooks/post/ScopeDriftDetectionHook.ts
- [ ] T006 [US2] Integrate ScopeDriftDetectionHook into HookEngine.postToolUse in src/hooks/HookEngine.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Shared Brain Governance and Scope Lessons (Priority: P2)

**Goal**: The system records comprehensive lessons to the shared knowledge base for governance violations and scope conflicts, complementing existing verification failure records.

**Independent Test**: Can be fully tested by simulating DENY responses and scope conflicts, verifying that structured lessons are atomically appended to AGENTS.md.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US3] Create unit tests (≥3 tests) for SharedBrainHook in src/hooks/post/**tests**/SharedBrainHook.spec.ts

### Implementation for User Story 3

- [ ] T008 [US3] Implement SharedBrainHook in src/hooks/post/SharedBrainHook.ts
- [ ] T009 [US3] Integrate SharedBrainHook into HookEngine.postToolUse in src/hooks/HookEngine.ts

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T010 Run existing test suites to ensure no regressions across the HookEngine and other hooks.
- [ ] T011 Verify compilation for the entire project.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately (None)
- **Foundational (Phase 2)**: Can start immediately (None)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
    - User stories can then proceed in parallel (if staffed)
    - Or sequentially in priority order (P1 → P2 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately. No dependencies on other stories.
- **User Story 2 (P2)**: Can start immediately. No dependencies.
- **User Story 3 (P2)**: Can start immediately. No dependencies.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Hook implementation before integration to `HookEngine.ts`
- Story complete before moving to next priority

### Parallel Opportunities

- Unit tests for US1, US2, and US3 (T001, T004, T007) can all run in parallel.
- Hook implementations for US1, US2, and US3 (T002, T005, T008) can be worked on in parallel by different team members, as they are independent files.
- Integrations into `HookEngine.ts` (T003, T006, T009) should be serialized to avoid merge conflicts on the same file.

---

## Implementation Strategy

### Incremental Delivery (Recommended)

1. Complete User Story 1 (Intent Progress Tracking) → Test independently → Deploy (MVP)
2. Complete User Story 2 (Scope Drift Detection) → Test independently → Deploy
3. Complete User Story 3 (Shared Brain Governance) → Test independently → Deploy
4. Each story adds value without breaking previous stories.
