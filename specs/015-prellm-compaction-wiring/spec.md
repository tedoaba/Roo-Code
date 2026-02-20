# Feature Specification: Pre-LLM Context Compaction Wiring

**Feature Branch**: `015-prellm-compaction-wiring`  
**Created**: 2026-02-20  
**Status**: Draft  
**Task ID**: REQ-ARCH-015  
**Input**: User description: "Wire the existing HookEngine.preLLMRequest() method into Task.recursivelyMakeClineRequests() so that context compaction runs before every LLM API call."

## Clarifications

### Session 2026-02-20

- Q: Where should the compaction summary be injected — prepended to system prompt, inserted as a system message, or appended to system prompt? → A: Prepend to system prompt.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Long-Running Intent Compaction (Priority: P1)

As a long-running intent with more than 20 tool executions, the LLM should receive a compacted summary instead of the full trace history, preventing context window overflow and improving response quality.

**Why this priority**: This is the core value proposition of the feature. Without compaction, long-running intents risk exceeding the context window, leading to degraded LLM responses or outright failures. This directly enables sustainable multi-step agent workflows.

**Independent Test**: Can be fully tested by creating a mock intent with 21+ trace history entries and verifying that the LLM receives a compacted summary injected into the prompt context rather than the full raw history.

**Acceptance Scenarios**:

1. **Given** an active intent with 21 or more trace history entries, **When** `recursivelyMakeClineRequests()` prepares to call `createMessage()`, **Then** `preLLMRequest(intentId)` is invoked and returns a non-null compacted summary string.
2. **Given** a non-null compaction result, **When** the system prompt and messages are assembled for the LLM call, **Then** the compacted summary is prepended to the system prompt string.
3. **Given** a compacted summary is injected, **When** the LLM processes the request, **Then** the response quality is maintained without context window overflow errors.

---

### User Story 2 - Short Intent No-Op Path (Priority: P1)

As an intent with fewer than 20 history entries, compaction should be a complete no-op with zero overhead — no modifications to the system prompt or messages.

**Why this priority**: Equal priority to US1 because this is the default path for most intents. It must guarantee zero performance regression for the common case. If the no-op path adds latency, it would degrade the entire user experience.

**Independent Test**: Can be fully tested by creating a mock intent with fewer than 20 trace entries and verifying that `preLLMRequest()` returns null and the system prompt/messages remain completely unmodified.

**Acceptance Scenarios**:

1. **Given** an active intent with fewer than 20 trace history entries, **When** `recursivelyMakeClineRequests()` prepares to call `createMessage()`, **Then** `preLLMRequest(intentId)` is invoked and returns null.
2. **Given** `preLLMRequest()` returns null, **When** the system prompt and messages are assembled, **Then** no modification occurs — they are identical to the pre-compaction behavior.

---

### User Story 3 - Graceful Handling Without Active Intent (Priority: P2)

As a task in REASONING state (without an active intent), the `preLLMRequest()` call should gracefully return null without errors, ensuring the LLM loop continues uninterrupted.

**Why this priority**: Important for resilience but secondary to the core compaction functionality. Tasks may transiently lack an active intent during state transitions, and the system must remain stable.

**Independent Test**: Can be fully tested by invoking the compaction wiring path when `hookEngine` has no active intent and verifying that null is returned and no errors are thrown or logged.

**Acceptance Scenarios**:

1. **Given** a task in REASONING state with no active intent, **When** `recursivelyMakeClineRequests()` prepares to call `createMessage()`, **Then** `preLLMRequest()` is called and returns null without throwing.
2. **Given** `preLLMRequest()` returns null in REASONING state, **When** the system prompt and messages are assembled, **Then** they remain unmodified and the LLM call proceeds normally.

---

### User Story 4 - Error Resilience (Priority: P2)

As the LLM loop, if `preLLMRequest()` encounters an unexpected error (e.g., orchestration is unhealthy, hook engine throws), the error should be caught and logged, never propagating to crash the LLM loop.

**Why this priority**: Critical for production stability. The compaction feature is an optimization — it must never cause the core LLM functionality to fail.

**Independent Test**: Can be fully tested by mocking `preLLMRequest()` to throw an exception and verifying that the error is caught, logged, and the LLM call proceeds with unmodified prompt/messages.

**Acceptance Scenarios**:

1. **Given** `preLLMRequest()` throws an unexpected error, **When** the error is encountered in `recursivelyMakeClineRequests()`, **Then** the error is caught and logged with sufficient diagnostic context (intent ID, error message).
2. **Given** an error was caught from `preLLMRequest()`, **When** the system prompt and messages are assembled, **Then** they remain unmodified (fallback to no-compaction behavior) and the LLM call proceeds normally.
3. **Given** repeated errors from `preLLMRequest()` across multiple LLM calls, **When** the errors occur, **Then** each is independently caught and logged without accumulating state or causing cascading failures.

---

### Edge Cases

- What happens when compaction returns an empty string (`""`)? It should be treated as a no-op (same as null) — no modification to the prompt.
- What happens when the compacted summary is extremely large (larger than the original history)? The system should still inject it; size optimization is the responsibility of `PreCompactHook`, not the wiring layer.
- What happens when `this.hookEngine` is undefined or null on the Task instance? The call should be guarded with a null check and treated as a no-op.
- What happens when `createMessage()` is called from multiple code paths within `recursivelyMakeClineRequests()`? `preLLMRequest()` must be called exactly once before each `createMessage()` invocation.
- What happens during the first LLM call of a new intent (0 history entries)? Compaction returns null; the call proceeds with the original prompt.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST call `hookEngine.preLLMRequest(intentId)` exactly once before every `createMessage()` invocation within `recursivelyMakeClineRequests()`.
- **FR-002**: When `preLLMRequest()` returns a non-null, non-empty string, the system MUST inject the compacted summary into the prompt context before passing it to `createMessage()`.
- **FR-003**: When `preLLMRequest()` returns null or an empty string, the system MUST NOT modify the system prompt or message array in any way.
- **FR-004**: The compaction summary MUST be prepended to the system prompt string. No other injection strategy (e.g., inserting into the message array) is used.
- **FR-005**: All errors thrown by `preLLMRequest()` MUST be caught within `recursivelyMakeClineRequests()` and logged. Errors MUST NOT propagate to crash or interrupt the LLM loop.
- **FR-006**: The error logging MUST include sufficient diagnostic context (at minimum: the intent ID and the error message/stack).
- **FR-007**: The implementation MUST follow the Decorator Pattern — adding a single `preLLMRequest()` call at the boundary without modifying the core LLM calling logic within `createMessage()`.
- **FR-008**: The implementation MUST follow Invariant 2 (all operations pass through the Hook Engine) by routing the compaction through the existing `HookEngine.preLLMRequest()` method.
- **FR-009**: The system MUST guard against a missing or undefined `hookEngine` reference on the Task instance, treating it as a no-op.
- **FR-010**: The implementation MUST NOT break any existing unit or integration tests.

### Key Entities

- **Task**: The core LLM orchestration unit that holds a `hookEngine` reference and manages the `recursivelyMakeClineRequests()` loop. The wiring change lives here.
- **HookEngine**: The central hook orchestration engine. Exposes `preLLMRequest(intentId)` which delegates to `PreCompactHook.compact()`.
- **PreCompactHook**: The hook responsible for summarizing trace history when the entry count exceeds the threshold (20 entries). Already implemented and functional.
- **Compaction Result**: A string (summary) or null returned by `preLLMRequest()`. Determines whether the prompt context is modified.
- **System Prompt**: The instruction text sent to the LLM. The compaction summary is prepended to this when compaction is active.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every LLM API call in the task loop is preceded by exactly one compaction check, verifiable via test assertions or logging.
- **SC-002**: Intents with 20+ trace history entries receive a compacted summary in their prompt context, reducing effective context size.
- **SC-003**: Intents with fewer than 20 trace history entries experience zero overhead — no prompt modifications and negligible additional processing time.
- **SC-004**: All existing unit and integration tests continue to pass without modification (zero test regressions).
- **SC-005**: Errors in the compaction path are contained — no LLM loop crashes attributable to compaction failures.
- **SC-006**: The feature can be verified as functional through a single integration point change (one method call added), demonstrating adherence to the Decorator Pattern.

## Assumptions

- The `HookEngine.preLLMRequest(intentId)` method at `src/hooks/HookEngine.ts:432-456` is fully implemented and functional, delegating to `PreCompactHook.compact()`.
- The `PreCompactHook` at `src/hooks/pre/PreCompactHook.ts` correctly summarizes trace history when the entry count exceeds 20, and returns null otherwise.
- `Task.hookEngine` is a public readonly property available at `Task.ts` line 350.
- The `recursivelyMakeClineRequests()` method has a clear, identifiable point before `createMessage()` where the hook call can be inserted.
- The `intentId` required by `preLLMRequest()` is accessible within the scope of `recursivelyMakeClineRequests()` (e.g., via `this.hookEngine` or task state).
- Prepending the compaction summary to the system prompt is an acceptable injection strategy that does not conflict with existing system prompt formatting.
