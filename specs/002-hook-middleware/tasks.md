# Tasks: Hook Middleware & Security Boundary

**Input**: Design documents from `specs/002-hook-middleware/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize `src/hooks/HookEngine.ts` with class skeleton (`preToolUse`, `postToolUse` stubs) and register in `Task.ts`
- [x] T002 Ensure `ignore` library is available for `.intentignore` pattern matching

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Define `HookResponse` interface and `CommandClassification` constant in `src/hooks/HookEngine.ts`
- [x] T004 Implement `.intentignore` loading and watching in `src/services/orchestration/OrchestrationService.ts`
- [x] T005 Update `OrchestrationService.validateScope` to enforce `.intentignore` precedence over `owned_scope`
- [x] T006 Implement Turn Budget enforcement (Law 3.1.5) in `HookEngine.preToolUse` (check `consumed_turns` vs `max_turns`)
- [x] T007 [P] Deprecate `IntentGateHook` and unify all existing gatekeeper logic into `HookEngine` to ensure a single execution gateway (Invariant 2)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Secure Command Execution (Priority: P1) 🎯 MVP

**Goal**: Pause and ask for user approval before executing any destructive command.

**Independent Test**: Trigger a `write_to_file` command. The system should pause and show an approval dialog. Rejecting it should block the write.

### Implementation for User Story 1

- [x] T008 [US1] Implement `HookEngine.isDestructiveTool` matching the "Destructive" classification in `src/hooks/HookEngine.ts`
- [x] T009 [US1] Implement `HookEngine.preToolUse` to classify tools and determine if rejection or approval is required
- [x] T010 [US1] Integrate `HookEngine.preToolUse` into the execution loop in `src/core/assistant-message/presentAssistantMessage.ts`
- [x] T011 [US1] Implement UI-Blocking "Approve/Reject" trigger in `src/core/assistant-message/presentAssistantMessage.ts` using `askApproval` callback
- [x] T012 [US1] Implement `HookEngine.postToolUse` with SHA-256 cryptographic hashing of modified code blocks for audit logging in `src/hooks/HookEngine.ts`
- [x] T013 [US1] Integrate `HookEngine.postToolUse` into the execution loop in `src/core/assistant-message/presentAssistantMessage.ts`

**Checkpoint**: User Story 1 (Secure Command Execution) is fully functional as an MVP.

---

## Phase 4: User Story 2 - Intent Scope Enforcement (Priority: P1)

**Goal**: Automatically block file modifications that are outside the active intent's scope.

**Independent Test**: Define an intent with scope `["src/utils/"]`. Attempting to write to `src/core/main.ts` should be blocked immediately with a "Scope Violation" error.

### Implementation for User Story 2

- [x] T014 [P] [US2] Update `HookEngine.preToolUse` to call `OrchestrationService.validateScope` for file-mutating tools
- [x] T015 [US2] Implement "No Active Intent" block in `HookEngine.preToolUse` to deny destructive tools if no intent is active
- [x] T016 [US2] Implement logic to distinguish between file-based destructive tools and non-file destructive tools using mapping from `data-model.md` §3

**Checkpoint**: User Story 2 (Scope Enforcement) is functional.

---

## Phase 5: User Story 3 - Autonomous Error Recovery (Priority: P2)

**Goal**: Ensure the agent receives structured JSON errors when a command is rejected or blocked.

**Independent Test**: Reject a command in the UI. The agent's next response should acknowledge the JSON error and propose a valid alternative approach.

### Implementation for User Story 3

- [x] T017 [US3] Implement standardized JSON error return format in `presentAssistantMessage.ts`
- [x] T018 [US3] Add `details` and `recovery_hint` fields to `HookResponse` interface in `src/services/orchestration/types.ts` to populate JSON errors
- [x] T019 [US3] Implement specific error reasons for "Scope Violation", "No Active Intent", and "Budget Exceeded" in `HookEngine.preToolUse`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T020 Documentation updates in `quickstart.md`, `README.md`, and `ARCHITECTURE_NOTES.md`
- [x] T021 [P] Perform final validation against all user scenarios and Invariants in `spec.md` and `constitution.md`

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies.
2. **Foundational (Phase 2)**: Depends on Setup. (Includes Gateway Unification and Budgeting)
3. **User Story 1 (Phase 3)**: Depends on Foundation. (Critical MVP)
4. **User Story 2 & 3 (Phases 4 & 5)**: Depend on Foundation. Can be worked on in parallel with or after US1.
5. **Polish (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- T007 [P] Unification can run while core foundational services are being updated.
- T014 [P] [US2] can run in parallel with US1 tasks as it targets different logic within `preToolUse`.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Setup & Foundation).
2. Complete User Story 1: Implement classification, SHA-256 auditing, and UI blocking.
3. **STOP and VALIDATE**: Verify that every destructive command triggers a prompt and logs a hash.

### Incremental Delivery

1. Foundation ready (Budgeting & Unified Gateway).
2. User Story 1: Basic security (Manual approval + Auditing).
3. User Story 2: Automated safety (Scope enforcement).
4. User Story 3: Resilience (JSON recovery).
5. Polish: Final cleanup.

---

## Completion Record

- **Status**: All tasks in this document completed.
- **Completed On**: 2026-02-19
- **Notes**: Tasks were verified and marked complete in the repo task tracker; implementation work completed on branch `002-hook-middleware`.
