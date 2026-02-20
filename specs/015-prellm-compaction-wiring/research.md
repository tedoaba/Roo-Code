# Research: Pre-LLM Context Compaction Wiring

**Feature**: 015-prellm-compaction-wiring  
**Date**: 2026-02-20  
**Status**: Complete — all unknowns resolved

## Research Tasks

### R1: Injection Point Location in `attemptApiRequest()`

**Decision**: Insert `preLLMRequest()` call between `systemPrompt` construction (line 4046) and `createMessage()` invocation (line 4307) in `Task.attemptApiRequest()`.

**Rationale**: The `systemPrompt` variable is assigned at line 4046 via `await this.getSystemPrompt()`. It is then passed to `createMessage()` at line 4307. The compaction result must be prepended to this string _after_ it's built but _before_ it's consumed by `createMessage()`. The ideal location is just before the `createMessage()` call (around line 4300), where we can mutate the `systemPrompt` local variable.

**Alternatives considered**:

- Inserting at the top of `recursivelyMakeClineRequests()` — rejected because `systemPrompt` is not in scope there; it's built inside `attemptApiRequest()`.
- Modifying `getSystemPrompt()` — rejected because it violates the Decorator Pattern constraint (would modify core logic rather than adding a boundary call).

### R2: Intent ID Access

**Decision**: Use `this.activeIntentId` (Task.ts line 351).

**Rationale**: `activeIntentId` is a public property on the Task instance, set during intent selection. It's `undefined` when no intent is active (REASONING state), which is exactly the input `preLLMRequest()` expects — it returns null when `intentId` is falsy.

**Alternatives considered**:

- Querying the orchestration service for active intent — rejected because `activeIntentId` is the canonical source on Task already.
- Passing through `hookEngine.getCurrentState()` — rejected because it returns state name, not intent ID.

### R3: How `systemPrompt` Flows to `createMessage()`

**Decision**: The `systemPrompt` variable is a `const` assigned at line 4046. We need to use `let` instead, or create a new variable for the modified prompt.

**Rationale**: Since `systemPrompt` is declared as `const`, we'll create a new `let effectiveSystemPrompt = systemPrompt` variable and prepend compaction to it. This avoids changing the `const` declaration which other logic may depend on. The `effectiveSystemPrompt` is then passed to `createMessage()`.

**Alternatives considered**:

- Changing `const systemPrompt` to `let` — acceptable but creating a new variable is more explicit about intent.
- String concatenation inline in `createMessage()` call — rejected because it complicates readability and makes testing harder.

### R4: Error Handling Strategy

**Decision**: Wrap the `preLLMRequest()` call and prompt modification in a try/catch block. Catch logs with `console.error` including `this.activeIntentId` and the error. On error, fall back to the original `systemPrompt` unmodified.

**Rationale**: `preLLMRequest()` already has an internal try/catch that returns null on error. The outer try/catch in `attemptApiRequest()` provides defense-in-depth against unexpected failures (e.g., property access on undefined, async rejection). Using `console.error` aligns with existing error logging patterns in Task.ts.

**Alternatives considered**:

- Not adding outer try/catch (relying on preLLMRequest's internal handler) — rejected because defense-in-depth is required per FR-005.
- Using structured logging service — deferred to future; `console.error` is the established pattern in Task.ts.

### R5: Existing Test Infrastructure

**Decision**: Add tests in `src/core/task/__tests__/Task.spec.ts` using `vi.spyOn(task.hookEngine, 'preLLMRequest')`.

**Rationale**: Task.spec.ts already contains tests for `recursivelyMakeClineRequests()` and `createMessage()` with established patterns for mocking the API handler. The `hookEngine` is a public property, making it directly spy-able.

**Alternatives considered**:

- Creating a separate test file — rejected because the wiring is part of Task behavior and belongs in the Task test suite.
- Integration tests only — rejected because unit tests can precisely verify the call-before-createMessage ordering.
