# Tasks: Automated Lessons Learned Recorder

**Input**: Design documents from `/specs/012-lesson-recorder/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included as requested by the implementation plan and user stories for verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan (src/core/lessons, src/cli, src/hooks, tests/unit, tests/integration)
- [x] T002 Initialize TypeScript project with Node.js v20+ and Vitest dependencies in package.json
- [x] T003 [P] Configure linting and formatting (ESLint/Prettier) in .eslintrc.json and .prettierrc
- [x] T004 Define `Lesson` entity and types in `src/core/lessons/types.ts` per updated data-model.md (intent_id required)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Implement file locking utility for cross-process atomic writes in `src/core/lessons/LockManager.ts`
- [x] T006 [P] Implement SHA256 signature generation helper in `src/core/lessons/Deduplicator.ts` per research.md
- [x] T007 [P] Implement audit logging integration using `LedgerManager` to write to `.orchestration/agent_trace.jsonl`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automatic Recording of Verification Failures (Priority: P1) 🎯 MVP

**Goal**: Automatically record failed verification steps into `AGENT.md` with full metadata and audit trail.

**Independent Test**: Trigger a failure, run the recorder with a valid intent_id, and verify entries in BOTH `AGENT.md` and `audit_trace.jsonl`.

### Tests for User Story 1

- [x] T008 [P] [US1] Create unit tests for `LessonRecorder` in `src/core/lessons/__tests__/LessonRecorder.test.ts`
- [x] T009 [P] [US1] Create integration test for CLI in `src/cli/__tests__/record-lesson.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Implement `LessonRecorder` core logic (atomic append, EOS formatting, 500-char truncation) in `src/core/lessons/LessonRecorder.ts`
- [x] T011 [US1] Implement CLI entry point in `src/cli/record-lesson.ts` strictly enforcing `contracts/cli.json` (required intent-id)
- [x] T012 [US1] Integrate `LedgerManager` into `LessonRecorder` to log every recording event to the audit ledger
- [x] T013 [US1] Add basic error handling (fail silently after retry after 100ms delay) per spec.md in `src/core/lessons/LessonRecorder.ts`

**Checkpoint**: Core recording functionality with traceability is functional.

---

## Phase 4: User Story 2 - Self-Healing Ledger Infrastructure (Priority: P2)

**Goal**: Ensure the "Lessons Learned" section exists in `AGENT.md`, creating it or the file itself if necessary.

**Independent Test**: Delete `AGENT.md`, record a lesson, and verify the file and header are recreated accurately.

### Tests for User Story 2

- [x] T014 [US2] Add unit tests for file/section existence checks and creation in `src/core/lessons/__tests__/LessonRecorder.test.ts`

### Implementation for User Story 2

- [x] T015 [US2] Implement section detection and automatic creation logic in `src/core/lessons/LessonRecorder.ts`
- [x] T016 [US2] Ensure atomic creation of the file and header using the `LockManager`

**Checkpoint**: The system is now robust against missing storage files or headers.

---

## Phase 5: User Story 3 - Duplicate Prevention and Ledger Cleanliness (Priority: P3)

**Goal**: Prevent duplicate entries for the same failure [File + Error Summary] signature.

**Independent Test**: Record the same technical failure twice and verify `AGENT.md` only contains one entry.

### Tests for User Story 3

- [x] T017 [P] [US3] Create unit tests for signature-based de-duplication in `src/core/lessons/__tests__/Deduplicator.test.ts`

### Implementation for User Story 3

- [x] T018 [US3] Implement de-duplication logic using the SHA256 signature in `src/core/lessons/Deduplicator.ts`
- [x] T019 [US3] Integrate `Deduplicator` into the `LessonRecorder` write flow in `src/core/lessons/LessonRecorder.ts`

**Checkpoint**: The log remains clean and free of redundant entries.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, hooks, and final documentation.

- [x] T020 [P] Implement `PostVerificationHook` skeleton in `src/hooks/post/PostVerificationHook.ts` to suggest recording to the agent.
- [x] T021 [P] Implement lesson retrieval utility (FR-011) in `src/core/lessons/LessonRetriever.ts`
- [x] T022 [US1] Integrate `LessonRetriever` with the main Prompt Injection logic (e.g., in `src/core/prompts/system.ts`)
- [x] T023 Run final end-to-end validation of all scenarios in `quickstart.md`.
- [x] T024 Final code cleanup, JSDoc comments, and documentation review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on T001-T004 completion.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
- **Polish (Final Phase)**: Depends on Phase 3 completion (MVP).

### Parallel Opportunities

- T003, T004 (Setup)
- T005, T006, T007 (Foundational)
- T008, T009 (US1 Tests)
- T017 (US3 Tests)
- T020, T021 (Polish)

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (Core Recording + Traceability).
3. Complete Phase 4 (Self-healing).
4. **VALIDATE**: Run `record-lesson.test.ts` and check audit ledger.

### Incremental Delivery

1. Foundation -> Core Features (US1) -> Robustness (US2) -> Cleanliness (US3) -> Injection (Phase 6) -> Polish.
