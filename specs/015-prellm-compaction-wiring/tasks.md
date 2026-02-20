# Tasks: Pre-LLM Context Compaction Wiring

**Input**: Design documents from `/specs/015-prellm-compaction-wiring/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Included — the spec explicitly requires verifiable acceptance criteria and non-regression (FR-010, SC-004).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (VS Code extension monorepo)
- Primary change file: `src/core/task/Task.ts`
- Test file: `src/core/task/__tests__/Task.spec.ts`
- Existing hooks (no changes): `src/hooks/HookEngine.ts`, `src/hooks/pre/PreCompactHook.ts`

---

## Phase 1: Setup

**Purpose**: Verify prerequisites and existing infrastructure before making changes

- [ ] T001 Verify `HookEngine.preLLMRequest()` exists and is functional at `src/hooks/HookEngine.ts` lines 432-456
- [ ] T002 Verify `PreCompactHook.compact()` exists and is functional at `src/hooks/pre/PreCompactHook.ts` lines 27-78
- [ ] T003 Verify `Task.hookEngine` is a public readonly property at `src/core/task/Task.ts` line 350
- [ ] T004 Verify `Task.activeIntentId` is a public property at `src/core/task/Task.ts` line 351
- [ ] T005 Run existing test suite to establish baseline: `npx vitest run src/core/task/__tests__/Task.spec.ts`

**Checkpoint**: All prerequisites verified — existing infrastructure confirmed functional, baseline tests pass.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks required — all infrastructure (HookEngine, PreCompactHook, Task properties) already exists and is verified in Phase 1.

**⚠️ NOTE**: This feature has no foundational phase because it wires existing components. Proceed directly to user story implementation.

---

## Phase 3: User Story 1 — Long-Running Intent Compaction (Priority: P1) 🎯 MVP

**Goal**: When an intent has 20+ trace history entries, the LLM receives a compacted summary prepended to the system prompt.

**Independent Test**: Create a mock intent with 21+ trace entries, call `attemptApiRequest()`, and verify the system prompt passed to `createMessage()` starts with the compaction summary.

### Implementation for User Story 1

- [ ] T006 [US1] Change `const systemPrompt` to `const systemPrompt` (keep as const) and add `let effectiveSystemPrompt` variable initialized to `systemPrompt` after line 4046 in `src/core/task/Task.ts` `attemptApiRequest()` method
- [ ] T007 [US1] Add try/catch block calling `this.hookEngine.preLLMRequest(this.activeIntentId)` after the `effectiveSystemPrompt` initialization, prepending the result to `effectiveSystemPrompt` when non-null and non-empty, in `src/core/task/Task.ts` `attemptApiRequest()` method
- [ ] T008 [US1] Replace `systemPrompt` with `effectiveSystemPrompt` in the `this.api.createMessage()` call at line 4308 of `src/core/task/Task.ts`
- [ ] T009 [US1] Add unit test: verify `preLLMRequest()` is called exactly once before `createMessage()` with `this.activeIntentId` in `src/core/task/__tests__/Task.spec.ts`
- [ ] T010 [US1] Add unit test: when `preLLMRequest()` returns a non-null string, verify the system prompt passed to `createMessage()` starts with the compacted summary followed by `\n\n` in `src/core/task/__tests__/Task.spec.ts`

**Checkpoint**: Long-running intents receive compacted context. Independently testable with mock returning a summary string.

---

## Phase 4: User Story 2 — Short Intent No-Op Path (Priority: P1)

**Goal**: When an intent has fewer than 20 history entries, compaction is a complete no-op — the system prompt is unmodified.

**Independent Test**: Create a mock with `preLLMRequest()` returning null, call `attemptApiRequest()`, and verify the system prompt passed to `createMessage()` is identical to `getSystemPrompt()`.

### Implementation for User Story 2

- [ ] T011 [US2] Add unit test: when `preLLMRequest()` returns null, verify the system prompt passed to `createMessage()` is identical to the original `getSystemPrompt()` result in `src/core/task/__tests__/Task.spec.ts`
- [ ] T012 [US2] Add unit test: when `preLLMRequest()` returns empty string `""`, verify the system prompt is unmodified (treated same as null) in `src/core/task/__tests__/Task.spec.ts`

**Checkpoint**: No-op path verified — no modifications when compaction is not needed.

---

## Phase 5: User Story 3 — Graceful Handling Without Active Intent (Priority: P2)

**Goal**: When no intent is active (`activeIntentId` is undefined), `preLLMRequest()` returns null gracefully without errors.

**Independent Test**: Set `activeIntentId` to undefined, call `attemptApiRequest()`, and verify `preLLMRequest()` is called with `undefined` and the system prompt is unmodified.

### Implementation for User Story 3

- [ ] T013 [US3] Add unit test: when `this.activeIntentId` is undefined (REASONING state), verify `preLLMRequest(undefined)` is called and returns null, and system prompt is unmodified in `src/core/task/__tests__/Task.spec.ts`

**Checkpoint**: REASONING state graceful handling verified.

---

## Phase 6: User Story 4 — Error Resilience (Priority: P2)

**Goal**: Errors from `preLLMRequest()` are caught and logged, never propagating to crash the LLM loop.

**Independent Test**: Mock `preLLMRequest()` to throw, call `attemptApiRequest()`, and verify the error is caught, logged, and `createMessage()` receives the original unmodified system prompt.

### Implementation for User Story 4

- [ ] T014 [US4] Add `console.error` logging in the catch block of the `preLLMRequest()` try/catch, including Task ID, active intent ID, and error message/stack in `src/core/task/Task.ts` `attemptApiRequest()` method
- [ ] T015 [US4] Add unit test: when `preLLMRequest()` throws, verify the error is caught, `console.error` is called with diagnostic context (intent ID, error message), and the LLM call proceeds with unmodified system prompt in `src/core/task/__tests__/Task.spec.ts`
- [ ] T016 [US4] Add unit test: when `hookEngine` is null/undefined, verify `preLLMRequest()` is not called and the system prompt is unmodified in `src/core/task/__tests__/Task.spec.ts`

**Checkpoint**: Error resilience verified — compaction failures never crash the LLM loop.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and regression checks

- [ ] T017 Run the full existing test suite to verify zero regressions: `npx vitest run`
- [ ] T018 Verify the implementation follows Decorator Pattern: confirm only a single `preLLMRequest()` call was added at the boundary, no changes to `createMessage()` internals, `HookEngine.ts`, or `PreCompactHook.ts`
- [ ] T019 Run quickstart.md validation steps to confirm end-to-end correctness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verification only
- **User Story 1 (Phase 3)**: Depends on Setup — implements the core wiring
- **User Story 2 (Phase 4)**: Depends on US1 completion — tests the null path of the same code
- **User Story 3 (Phase 5)**: Depends on US1 completion — tests undefined intentId path
- **User Story 4 (Phase 6)**: Depends on US1 completion — tests error handling of the same code
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core wiring — MUST complete first (all other stories test paths within the same code)
- **User Story 2 (P1)**: Tests null return path — can start after US1 code is in place
- **User Story 3 (P2)**: Tests undefined intentId — can start after US1 code is in place
- **User Story 4 (P2)**: Tests error path — can start after US1 code is in place

### Within Each User Story

- Implementation tasks before test tasks (for US1 which adds the code)
- Test tasks for US2/US3/US4 are independent and can run in parallel after US1

### Parallel Opportunities

- T001–T005 (Setup verification) can all run in parallel
- T011–T013, T015–T016 (US2/US3/US4 tests) can all run in parallel after US1 is complete
- T017–T019 (Polish) are sequential (full test suite first, then pattern review, then quickstart)

---

## Parallel Example: After US1 Complete

```bash
# After Phase 3 (US1) is complete, launch all remaining test tasks in parallel:
Task: "T011 [US2] Test null return path"
Task: "T012 [US2] Test empty string return path"
Task: "T013 [US3] Test undefined intentId path"
Task: "T015 [US4] Test error thrown path"
Task: "T016 [US4] Test null hookEngine path"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 3: User Story 1 (T006–T010)
3. **STOP and VALIDATE**: Run `npx vitest run src/core/task/__tests__/Task.spec.ts`
4. Core compaction wiring is functional — MVP complete

### Incremental Delivery

1. Setup verification → Prerequisites confirmed
2. User Story 1 → Core wiring + positive path tests → MVP ✅
3. User Story 2 → No-op path tests → Null safety verified
4. User Story 3 → REASONING state tests → Graceful degradation verified
5. User Story 4 → Error resilience tests → Production hardened
6. Polish → Full regression + Decorator Pattern audit

### Single Developer Strategy

Since this is a single-file change with ~10 lines of code:

1. Implement all of US1 (T006–T010) as a single commit
2. Add all remaining tests (T011–T016) as a second commit
3. Run polish (T017–T019) as final validation

---

## Notes

- This is a minimal wiring feature — the core code change is ~10 lines in a single file
- All hook infrastructure (`HookEngine.preLLMRequest`, `PreCompactHook.compact`) is already implemented
- The `effectiveSystemPrompt` variable separation ensures `manageContext()` at line 4151 continues using the original `systemPrompt` for context window calculations (no double-counting)
- Task T014 (error logging) is listed under US4 but is implemented as part of the same try/catch block added in T007; the task ensures the logging includes proper diagnostic context
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase checkpoint
- Stop at any checkpoint to validate independently
