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

- [ ] T001 Initialize `src/hooks/HookEngine.ts` with basic structure and register in `Task.ts`
- [ ] T002 Ensure `ignore` library is available for `.intentignore` pattern matching

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T003 Define `HookResponse` interface and `CommandClassification` constant in `src/hooks/HookEngine.ts`
- [ ] T004 Implement `.intentignore` loading and watching in `src/services/orchestration/OrchestrationService.ts`
- [ ] T005 Update `OrchestrationService.validateScope` to enforce `.intentignore` precedence over `owned_scope`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Secure Command Execution (Priority: P1) 🎯 MVP

**Goal**: Pause and ask for user approval before executing any destructive command.

**Independent Test**: Trigger a `write_to_file` command. The system should pause and show an approval dialog. Rejecting it should block the write.

### Implementation for User Story 1

- [ ] T006 [US1] Refine `HookEngine.isMutatingTool` to match "Destructive" classification in `src/hooks/HookEngine.ts`
- [ ] T007 [US1] Implement `HookEngine.preToolUse` to classify tools and determine if rejection or approval is required
- [ ] T008 [US1] Integrate `HookEngine.preToolUse` into the execution loop in `src/core/assistant-message/presentAssistantMessage.ts`
- [ ] T009 [US1] Implement UI-Blocking "Approve/Reject" trigger in `src/core/assistant-message/presentAssistantMessage.ts` for DESTRUCTIVE tools using `askApproval` callback
- [ ] T010 [US1] Implement `HookEngine.postToolUse` for audit logging and mutation hashing in `src/hooks/HookEngine.ts`
- [ ] T011 [US1] Integrate `HookEngine.postToolUse` into the execution loop in `src/core/assistant-message/presentAssistantMessage.ts`

**Checkpoint**: User Story 1 (Secure Command Execution) is fully functional as an MVP.

---

## Phase 4: User Story 2 - Intent Scope Enforcement (Priority: P1)

**Goal**: Automatically block file modifications that are outside the active intent's scope.

**Independent Test**: Define an intent with scope `["src/utils/"]`. Attempting to write to `src/core/main.ts` should be blocked immediately with a "Scope Violation" error.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Update `HookEngine.preToolUse` to call `OrchestrationService.validateScope` for file-mutating tools
- [ ] T013 [US2] Implement "No Active Intent" block in `HookEngine.preToolUse` to deny destructive tools if no intent is active
- [ ] T014 [US2] Implement logic to distinguish between file-based destructive tools (subject to scope) and non-file destructive tools like `run_command` (approval only)

**Checkpoint**: User Story 2 (Scope Enforcement) is functional.

---

## Phase 5: User Story 3 - Autonomous Error Recovery (Priority: P2)

**Goal**: Ensure the agent receives structured JSON errors when a command is rejected or blocked.

**Independent Test**: Reject a command in the UI. The agent's next response should acknowledge the JSON error and propose a valid alternative approach.

### Implementation for User Story 3

- [ ] T015 [US3] Implement standardized JSON error formatting for hook denials in `src/core/assistant-message/presentAssistantMessage.ts`
- [ ] T016 [US3] Add `details` and `recovery_hint` fields to `HookResponse` in `src/hooks/HookEngine.ts` to populate JSON errors
- [ ] T017 [US3] Update `HookEngine` to return specific error reasons for "Scope Violation" and "No Active Intent"

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T018 Documentation updates in `quickstart.md` and `README.md`
- [ ] T019 [P] Deprecate or unify `IntentGateHook` with the new `HookEngine` to ensure a single execution gateway
- [ ] T020 Perform final validation against all user scenarios in `spec.md`

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies.
2. **Foundational (Phase 2)**: Depends on Setup.
3. **User Story 1 (Phase 3)**: Depends on Foundation. (Critical MVP)
4. **User Story 2 & 3 (Phases 4 & 5)**: Depend on Foundation. Can be worked on in parallel with or after US1.
5. **Polish (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- T012 [P] [US2] can run in parallel with US1 tasks as it targets different logic within `preToolUse`.
- T019 [P] can run in parallel with final polish tasks.

---

## Parallel Example: User Story 1 & 2

```bash
# Launch Foundational tasks together:
Task: "Implement .intentignore loading and watching in src/services/orchestration/OrchestrationService.ts"
Task: "Define HookResponse interface and CommandClassification constant in src/hooks/HookEngine.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Setup & Foundation).
2. Complete User Story 1: Implement classification and UI blocking.
3. **STOP and VALIDATE**: Verify that every destructive command triggers a prompt.

### Incremental Delivery

1. Foundation ready.
2. User Story 1: Basic security (Manual approval).
3. User Story 2: Automated safety (Scope enforcement).
4. User Story 3: Resilience (JSON recovery).
5. Polish: Final cleanup.
