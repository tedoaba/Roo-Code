---
description: "Task list for REQ-ID Injection Enforcement implementation"
---

# Tasks: REQ-ID Injection Enforcement

**Input**: Design documents from `/specs/008-req-id-trace-injection/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks have been included per the standard backend development process for the HookEngine to ensure strict governance invariants.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base classes for the traceability enforcement.

- [x] T001 Create `TraceabilityError` custom exception class in `src/errors/TraceabilityError.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core payload definition and downstream dependencies which MUST be met before `HookEngine` blocking logic can be validated.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update `AgentTraceEntry` interface to include the `related: string[]` field in `src/contracts/AgentTrace.ts`
- [x] T003 Update `recordMutation` logic in `src/utils/orchestration/LedgerManager.ts` to automatically inject `related: [params.intentId]` into the trace object.

**Checkpoint**: Ledger and data models are ready. User stories for enforcing rules inside the `HookEngine` can begin.

---

## Phase 3: User Story 1 - Secure Mutation with Requirement Traceability (Priority: P1) 🎯 MVP

**Goal**: Block any execution of destructive tools if the trace requirement identifier (`intentId`) is missing.

**Independent Test**: Can be tested by invoking `HookEngine.preToolUse` with a destructive tool name but `undefined` intentId, confirming it throws `TraceabilityError`.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [US1] Add unit test checking that `HookEngine.preToolUse` throws `TraceabilityError` when `req.intentId` is missing for a destructive tool in `src/hooks/__tests__/HookEngine.test.ts`
- [x] T005 [US1] Add unit test checking that `HookEngine.preToolUse` allows execution of `SAFE` tools (e.g., `read_file`) even when `req.intentId` is missing, ensuring zero impact on read-only tools in `src/hooks/__tests__/HookEngine.test.ts`

### Implementation for User Story 1

- [x] T006 [US1] Implement intent presence validation in `src/hooks/HookEngine.ts` inside `preToolUse()` handling to throw `TraceabilityError` for destructive tools.

**Checkpoint**: At this point, mutations are securely blocked without an intentId, satisfying accountability basics.

---

## Phase 4: User Story 2 - Requirement ID Format Validation (Priority: P2)

**Goal**: Ensure that provided requirement identifiers follow the strict standard of the project (e.g., starting with `REQ-`).

**Independent Test**: Provide an invalid intentId to `HookEngine.preToolUse` (e.g., "FIX-123") and verify it is blocked. Provide a valid intentId ("REQ-456") and verify it passes.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [x] T007 [US2] Add unit test to verify rejection of malformed `intentId` formats (e.g., "FIX-123", plain numeric, or empty strings "") in `src/hooks/__tests__/HookEngine.test.ts`
- [x] T008 [US2] Add unit test to verify acceptance of valid `intentId` formats (e.g., "REQ-123", "REQ-AUTH-01") in `src/hooks/__tests__/HookEngine.test.ts`

### Implementation for User Story 2

- [x] T009 [US2] Implement flexible regex format validation (`/^REQ-[a-zA-Z0-9\-]+$/`) to the intentId check block in `src/hooks/HookEngine.ts`

**Checkpoint**: The HookEngine now guarantees all requirement links are perfectly formatted.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 Refactoring / optimize HookEngine validation checks to remain strictly under the <50ms goal metric.
- [x] T011 Update documentation or run quickstart sample locally.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Defines custom errors.
- **Foundational (Phase 2)**: Defines the trace shape.
- **User Stories (Phase 3+)**: Implements the blocking rules in HookEngine.
- **Polish (Final Phase)**: Performance optimizations.

### User Story Dependencies

- **User Story 1 (P1)**: Independent MVP; establishes basic requirement tracking check.
- **User Story 2 (P2)**: Extends User Story 1 with regex format validation logic.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Story complete before moving to next priority

---

## Parallel Example: User Story 2

```bash
# Launch implementations concurrently (if multiple team members):
Task: "Add unit test to verify rejection of malformed intentId formats"
Task: "Add unit test to verify acceptance of valid intentId formats"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 Setup
2. Ensure `LedgerManager` securely logs the explicit relation.
3. Complete Phase 3 (US1) blocking rules in `HookEngine`.
4. **STOP and VALIDATE**: Test intent checks independently.

### Incremental Delivery

1. Phase 1 & 2 prepare down-stream logs.
2. US1 adds raw blockage support.
3. US2 refines to strict validation criteria.
