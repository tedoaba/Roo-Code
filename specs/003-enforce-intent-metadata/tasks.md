# Tasks: Enforce Intent Metadata in write_file Tool

**Input**: Design documents from `/specs/003-enforce-intent-metadata/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, quickstart.md

**Tests**: Unit tests are REQUIRED per feature specification to cover validation failures.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Update `toolParamNames` and `NativeToolArgs` types in `src/shared/tools.ts` to include `mutation_class`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update tool prompt schema definition in `src/core/prompts/tools/native-tools/write_to_file.ts` to include `intent_id` and `mutation_class` as required fields
- [ ] T003 Update `WriteToFileParams` type definition in `src/core/tools/WriteToFileTool.ts` to include metadata fields

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure and Traceable Code Writes (Priority: P1) 🎯 MVP

**Goal**: Every file write is associated with a specific intent and mutation class for traceability.

**Independent Test**: Successfully call `write_file` with valid `intent_id` and `mutation_class` and verify file creation.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US1] Add positive test case for valid metadata in `src/core/tools/__tests__/writeToFileTool.spec.ts`

### Implementation for User Story 1

- [ ] T005 [US1] Update `WriteToFileTool.ts` to accept and process the new metadata fields during tool execution

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Enforcement of Metadata Requirements (Priority: P1)

**Goal**: Block any attempt to write files that lacks the necessary traceability metadata.

**Independent Test**: Call `write_file` without `intent_id` or with an empty string and verify rejection.

### Tests for User Story 2

- [ ] T006 [P] [US2] Add failure test cases for missing/empty metadata in `src/core/tools/__tests__/writeToFileTool.spec.ts`

### Implementation for User Story 2

- [ ] T007 [US2] Implement strict existence validation for `intent_id` and `mutation_class` in `src/core/tools/WriteToFileTool.ts`
- [ ] T008 [US2] Implement non-empty string validation for `intent_id` in `src/core/tools/WriteToFileTool.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Validating Mutation Classification (Priority: P2)

**Goal**: Ensure code changes are only categorized into allowed enum classes.

**Independent Test**: Call `write_file` with an invalid `mutation_class` and verify rejection with allowed values listed.

### Tests for User Story 3

- [ ] T009 [P] [US3] Add failure test cases for invalid/lower-case enum values in `src/core/tools/__tests__/writeToFileTool.spec.ts`

### Implementation for User Story 3

- [ ] T010 [US3] Implement strict enum and case-sensitivity validation for `mutation_class` in `src/core/tools/WriteToFileTool.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T011 Verify all scenarios in `specs/003-enforce-intent-metadata/quickstart.md` manually
- [ ] T012 [P] Update agent context using `.specify/scripts/powershell/update-agent-context.ps1 -AgentType agy`
- [ ] T013 Run full test suite in `src/core/tools/__tests__/writeToFileTool.spec.ts` to ensure zero regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational (T002, T003)
    - User stories can then proceed in parallel
    - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Logic validation before filesystem interaction

### Parallel Opportunities

- T004, T006, T009 (tests) can be drafted in parallel, though they share the same test file.
- T012 can run in parallel with other polish tasks.

---

## Parallel Example: User Story 1 & 2 Tests

```bash
# Prepare tests for multiple stories in the same file
Task: "Add positive test case for valid metadata in src/core/tools/__tests__/writeToFileTool.spec.ts"
Task: "Add failure test cases for missing/empty metadata in src/core/tools/__tests__/writeToFileTool.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 4: User Story 2 (Enforcement is the primary security goal)
4. Complete Phase 3: User Story 1
5. **STOP and VALIDATE**: Test that writes are blocked without metadata and allowed with metadata.

### Incremental Delivery

1. Setup + Foundational -> Types and Schema ready.
2. User Story 2 -> Security boundary established (blocking invalid writes).
3. User Story 1 -> Feature complete (allowing valid writes).
4. User Story 3 -> Data integrity ensured (enum validation).

---

## Notes

- [P] tasks = different files or independent logic sections in shared files.
- [Story] label maps task to specific user story for traceability.
- Verify tests fail before implementing.
- Fail fast validation occurs in `WriteToFileTool.ts` before any `fs` calls.
