# Tasks: Relaxed Handshake for Analysis Tools

**Feature**: Relaxed Handshake for Analysis Tools  
**Plan**: [specs/014-relaxed-handshake-analysis/plan.md](plan.md)  
**Branch**: `014-relaxed-handshake-analysis`

## Implementation Strategy

We will follow an incremental delivery approach, starting with the core infrastructure changes and moving towards functional enablement.

1.  **Phase 1: Setup & Infrastructure**: Resolve circular dependencies by centralizing tool classifications.
2.  **Phase 2: Foundational Logic**: Update the State Machine and Hook Engine to support classification-based governance.
3.  **Phase 3: User Story 1 (Analysis Enablement)**: Enable SAFE tools during the handshake phase and update tool filtering for the agent.
4.  **Phase 4: User Story 2 (Mutation Protection)**: Verify that DESTRUCTIVE tools are correctly blocked and default classification is Fail-Close.
5.  **Phase 5: Polish & Prompting**: Update the system prompt to instruct the agent on the new relaxed flow.

## Dependencies

- Phase 1 must be completed before Phase 2.
- Phase 2 must be completed before Phases 3 and 4.
- Phase 5 can be done in parallel with testing but should be the final step for integration.

## Phase 1: Setup & Infrastructure

- [ ] T001 Relocate `COMMAND_CLASSIFICATION` mapping from `src/hooks/HookEngine.ts` to `src/services/orchestration/types.ts`
- [ ] T002 Update `src/hooks/HookEngine.ts` to import `COMMAND_CLASSIFICATION` from the types file
- [ ] T003 Ensure all unit tests for `HookEngine.ts` still pass after relocation

## Phase 2: Foundational Logic

- [ ] T004 Update `src/core/state/StateMachine.ts` to import `COMMAND_CLASSIFICATION`
- [ ] T005 Refactor `StateMachine.isToolAllowed` to permit all `SAFE` classified tools regardless of current state
- [ ] T006 Ensure `StateMachine.isToolAllowed` still blocks non-`SAFE` tools in `REQUEST` and `REASONING` states (except `select_active_intent`)
- [ ] T007 [P] Create unit tests for the updated `StateMachine.isToolAllowed` logic in `src/core/state/__tests__/StateMachine.test.ts`

## Phase 3: User Story 1 - Analysis Before Intent (Priority: P1)

**Goal**: Enable the Architect to use read-only tools before selecting an intent.

**Independent Test**: Start a new task and successfully execute `list_files` before calling `select_active_intent`.

- [ ] T008 [US1] Update `src/core/task/build-tools.ts` to filter for `SAFE` tools when `isIntentActive` is false
- [ ] T009 [US1] Update `HookEngine.preToolUse` to allow project-wide read access for `SAFE` tools when no intent is active (bypass scope check for SAFE tools)
- [ ] T010 [P] [US1] Create integration test verifying that `read_file` is permitted in `REASONING` state without an active intent
- [ ] T011 [P] [US1] Verify that `attempt_completion` can be called directly from `REASONING` state for informational tasks

## Phase 4: User Story 2 - Mutation Protection (Priority: P2)

**Goal**: Ensure destructive actions are hard-blocked without an active intent.

**Independent Test**: Attempt `write_to_file` before selecting an intent and verify it returns a State Violation error.

- [ ] T012 [US2] Verify that `isDestructiveTool` and `isFileDestructiveTool` in `HookEngine.ts` correctly utilize the new centralized classification
- [ ] T013 [US2] Verify Fail-Close default: Any tool not explicitly classified as SAFE must be blocked during the handshake
- [ ] T014 [P] [US2] Create integration test verifying that `write_to_file` is blocked with a State Violation in `REASONING` state

## Phase 5: Polish & Prompting

- [ ] T015 Update `src/core/prompts/sections/intent-handshake.ts` to clarify that analysis and read-only actions are permitted before intent selection
- [ ] T016 Perform a full end-to-end verification of the "Research -> Select Intent -> Mutate" flow
- [ ] T017 [P] Update `docs/` or `quickstart.md` if any technical details shifted during implementation

## Parallel Execution Opportunities

- T007 (StateMachine tests) can be done while T005/T006 are being finalized.
- T010 and T011 (User Story 1 tests) can be worked on in parallel.
- T014 (User Story 2 test) can be worked on in parallel with User Story 1 integration.
- T017 can be done anytime after Phase 3 starts.
