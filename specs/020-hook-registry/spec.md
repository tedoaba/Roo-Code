# Feature Specification: HookRegistry Dynamic Plugin System

**Feature Branch**: `020-hook-registry`  
**Created**: 2026-02-21  
**Status**: Draft  
**Task ID**: REQ-ARCH-020  
**Input**: User description: "Extract hook management from HookEngine into a dedicated HookRegistry that supports dynamic registration, ordering, and lifecycle management of pre-hooks and post-hooks."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register and Execute Pre-Hooks in Priority Order (Priority: P1)

As a developer adding a new pre-hook, I should be able to register it with a priority number and have it automatically called by HookEngine in the correct order — without modifying HookEngine.ts.

**Why this priority**: This is the foundational capability. Without ordered pre-hook execution through a registry, HookEngine remains a monolithic file where every hook change requires editing core infrastructure. This story delivers the Open/Closed Principle for the most critical (short-circuiting) phase.

**Independent Test**: Can be fully tested by registering multiple mock pre-hooks with different priorities, executing them through the registry, and verifying they run in ascending priority order and that DENY/HALT responses short-circuit subsequent hooks. Delivers the core value of decoupled, extensible hook management.

**Acceptance Scenarios**:

1. **Given** a HookRegistry with three pre-hooks registered at priorities 10, 20, and 30, **When** `executePre(req)` is called, **Then** the hooks execute in ascending priority order (10 → 20 → 30) and the final result reflects the last hook's response.
2. **Given** a HookRegistry with pre-hooks at priorities 10, 20, 30 where the priority-20 hook returns `DENY`, **When** `executePre(req)` is called, **Then** the priority-10 hook executes, the priority-20 hook executes and returns `DENY`, and the priority-30 hook is skipped entirely.
3. **Given** a HookRegistry with pre-hooks at priorities 10, 20, 30 where the priority-20 hook returns `HALT`, **When** `executePre(req)` is called, **Then** the priority-10 hook executes, priority-20 returns `HALT`, and priority-30 is skipped.
4. **Given** a HookRegistry with no pre-hooks registered, **When** `executePre(req)` is called, **Then** it returns a default `CONTINUE` response (no error, no blocking).

---

### User Story 2 - Register and Execute Post-Hooks with Error Isolation (Priority: P1)

As a developer adding a new post-hook, I should register it and have it automatically called after every tool execution, regardless of whether other post-hooks succeed or fail.

**Why this priority**: Post-hooks are equally essential for the audit, tracing, and analysis pipeline. Error isolation (fire-and-forget) is the key invariant — one broken hook must never prevent the others from running or crash the system.

**Independent Test**: Can be fully tested by registering multiple mock post-hooks (including one that throws), executing them through the registry, and verifying all hooks run and errors are caught without propagation.

**Acceptance Scenarios**:

1. **Given** a HookRegistry with three post-hooks registered, **When** `executePost(result)` is called, **Then** all three hooks execute regardless of individual results.
2. **Given** a HookRegistry where the second post-hook throws an error, **When** `executePost(result)` is called, **Then** the first and third hooks still execute, the error is logged but not propagated, and no exception is thrown to the caller.
3. **Given** a HookRegistry with no post-hooks registered, **When** `executePost(result)` is called, **Then** it completes silently without error.

---

### User Story 3 - Deregister Hooks Dynamically (Priority: P2)

As a developer or test author, I should be able to remove a previously registered hook from either phase by its identifier, so I can swap hooks at runtime or in tests.

**Why this priority**: Dynamic deregistration enables clean test isolation (register mocks, then tear down) and future runtime flexibility. It is secondary to the core execution flow but critical for testability and maintenance.

**Independent Test**: Can be fully tested by registering a hook, verifying it executes, deregistering it by ID, and verifying it no longer executes on subsequent calls.

**Acceptance Scenarios**:

1. **Given** a HookRegistry with a pre-hook registered with id "scope-check", **When** `deregister("PRE", "scope-check")` is called, **Then** the hook is removed and no longer executes during `executePre()`.
2. **Given** a HookRegistry with post-hooks, **When** `deregister("POST", "nonexistent-id")` is called, **Then** the operation completes silently without error (idempotent behavior).
3. **Given** a previously deregistered hook, **When** a new hook is registered with the same id, **Then** the new hook replaces the previous registration and executes normally.

---

### User Story 4 - Inspect Registry State (Priority: P3)

As a system maintainer, I should be able to inspect the registry to see all registered hooks and their execution order, for debugging and operational visibility.

**Why this priority**: Observability is valuable for diagnostics but not on the critical execution path. It enhances developer experience without affecting runtime behavior.

**Independent Test**: Can be fully tested by registering several hooks across both phases and calling an inspection method that returns the full list with metadata (id, phase, priority).

**Acceptance Scenarios**:

1. **Given** a HookRegistry with hooks registered in both phases, **When** `getRegisteredHooks("PRE")` is called, **Then** it returns an ordered list of pre-hook descriptors showing id and priority.
2. **Given** a HookRegistry with hooks registered in both phases, **When** `getRegisteredHooks("POST")` is called, **Then** it returns a list of post-hook descriptors showing id.
3. **Given** an empty HookRegistry, **When** `getRegisteredHooks("PRE")` is called, **Then** it returns an empty list.

---

### User Story 5 - HookEngine Delegates to HookRegistry (Priority: P1)

As a system, when HookEngine.preToolUse() or HookEngine.postToolUse() is called, HookEngine must delegate to HookRegistry for hook execution rather than calling hooks inline, preserving all existing behavior exactly.

**Why this priority**: This is the integration story — without it, HookRegistry exists but is unused. This story ensures the existing monolithic code is replaced by registry delegation, completing the architectural refactor.

**Independent Test**: Can be fully tested by running the existing HookEngine test suite against the refactored implementation. All existing tests must pass without modification, proving behavioral equivalence.

**Acceptance Scenarios**:

1. **Given** HookEngine is constructed, **When** it initializes, **Then** all existing pre-hooks (fail-safe, state-check, traceability, concurrency, scope enforcement, budget, circuit breaker) are registered in the HookRegistry in their required order.
2. **Given** HookEngine is constructed, **When** it initializes, **Then** all existing post-hooks (mutation logging, turn-context update, read-file baseline, agent trace, general trace logging, verification failure, intent progress, scope drift, shared brain) are registered in the HookRegistry.
3. **Given** a tool request that triggers a scope violation, **When** `preToolUse(req)` is called on the refactored HookEngine, **Then** the result is identical to the current implementation (DENY with the same reason, details, and recovery_hint).
4. **Given** a post-hook that throws an error, **When** `postToolUse(result)` is called, **Then** the error is caught and logged exactly as the current inline try/catch behavior.

---

### User Story 6 - Mock Hook Registration for Testing (Priority: P2)

As a test author, I should be able to register mock hooks in the registry for integration testing, replacing or supplementing the default hooks to control test behavior.

**Why this priority**: This enables isolated integration tests where specific hooks can be swapped with mocks, reducing test fragility and improving coverage.

**Independent Test**: Can be fully tested by creating a HookRegistry, registering a mock pre-hook that always returns DENY, and verifying that `executePre()` returns DENY without calling any real hook logic.

**Acceptance Scenarios**:

1. **Given** a fresh HookRegistry instance, **When** a mock hook is registered for the PRE phase, **Then** only the mock hook executes during `executePre()`.
2. **Given** a HookRegistry with default hooks, **When** a mock hook is registered with the same id as an existing hook, **Then** the mock replaces the existing hook for subsequent executions.

---

### Edge Cases

- What happens when two hooks are registered with the same priority in the PRE phase? They execute in insertion order (FIFO) among equal priorities, ensuring deterministic behavior.
- What happens when a pre-hook returns an unexpected (non-standard) action string? The registry treats any action other than `CONTINUE` as a short-circuit signal and returns the response immediately.
- What happens when `register()` is called with a hook that has the same id as an existing hook in the same phase? The new registration replaces the old one (upsert semantics), preventing duplicate executions.
- How does the registry handle a post-hook that enters an infinite loop or hangs? The registry does not impose timeouts (matching current behavior). Future timeout support can be added without changing the registry interface.
- What happens if `executePre()` is called during hook registration? Registration and execution are synchronous operations on the hook list. No concurrent modification protection is required in the current single-threaded Node.js model.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a `HookRegistry` class located at `src/hooks/engine/HookRegistry.ts`.
- **FR-002**: The system MUST support two execution phases: `PRE` (ordered, short-circuiting) and `POST` (unordered, fire-and-forget with error catching).
- **FR-003**: The system MUST provide a `register(phase: "PRE" | "POST", hook: IHook, options?: { priority?: number })` method for adding hooks to the registry.
- **FR-004**: The system MUST provide a `deregister(phase: "PRE" | "POST", hookId: string)` method for removing hooks by identifier.
- **FR-005**: Pre-hooks MUST execute in ascending priority order (lower number = higher priority = runs first).
- **FR-006**: If a pre-hook returns `DENY` or `HALT`, all subsequent pre-hooks in the chain MUST be skipped, and the denying response MUST be returned immediately.
- **FR-007**: Post-hooks MUST all execute regardless of individual failures. Errors from individual post-hooks MUST be caught and logged, not propagated to the caller.
- **FR-008**: The system MUST provide `executePre(req: ToolRequest): Promise<HookResponse>` to run all registered pre-hooks in order.
- **FR-009**: The system MUST provide `executePost(result: ToolResult, requestId?: string): Promise<void>` to run all registered post-hooks.
- **FR-010**: The system MUST provide a `getRegisteredHooks(phase: "PRE" | "POST")` method that returns descriptors of all registered hooks for the given phase, in execution order.
- **FR-011**: `HookEngine.preToolUse()` MUST delegate to `hookRegistry.executePre(req)` instead of containing inline hook calls.
- **FR-012**: `HookEngine.postToolUse()` MUST delegate to `hookRegistry.executePost(result, requestId)` instead of containing inline hook calls.
- **FR-013**: All existing pre-hooks and post-hooks MUST be registered in the HookRegistry during HookEngine construction, preserving their current execution order exactly.
- **FR-014**: Every registered hook MUST have a unique string identifier (hookId) within its phase. Re-registering with the same id replaces the previous hook (upsert semantics).
- **FR-015**: When no pre-hooks are registered, `executePre()` MUST return a default `{ action: "CONTINUE" }` response.
- **FR-016**: When no post-hooks are registered, `executePost()` MUST complete silently.
- **FR-017**: All existing HookEngine tests MUST continue to pass without modification after the refactor.
- **FR-018**: The system MUST conform to the Open/Closed Principle — adding a new hook MUST require only registering it with the registry, not modifying HookEngine.

### Key Entities

- **HookRegistry**: The central registry that holds and manages all pre-hooks and post-hooks. Supports registration, deregistration, ordered execution, and inspection. Located at `src/hooks/engine/HookRegistry.ts`.
- **IHook**: The interface every hook must implement, providing a unique `id`, an `execute` method, and optional metadata. Pre-hooks return a `HookResponse`; post-hooks return `void` (or `Promise<void>`).
- **HookDescriptor**: A lightweight representation of a registered hook used for inspection, containing the hook's id, phase, and priority (for pre-hooks).
- **Phase**: An enum-like discriminator (`PRE` | `POST`) that determines execution semantics (ordered vs. fire-and-forget).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All existing HookEngine tests pass without any modifications after the refactor, proving behavioral equivalence.
- **SC-002**: Adding a new pre-hook or post-hook requires registering it in exactly one location and zero modifications to HookEngine.ts.
- **SC-003**: HookEngine.ts line count decreases by at least 40% from the current 553 lines, with hook logic extracted to the registry and individual hook modules.
- **SC-004**: 100% of pre-hooks execute in their configured priority order, verified by new unit tests with at least 5 hooks at varied priorities.
- **SC-005**: 100% of post-hook failures are isolated — a failing post-hook never prevents other post-hooks from executing, verified by tests that inject deliberate failures.
- **SC-006**: The registry inspection feature (`getRegisteredHooks`) correctly returns all registered hooks in execution order, verified by tests covering both phases and empty states.
- **SC-007**: New tests achieve at least 90% code coverage on `HookRegistry.ts`, covering registration, deregistration, ordering, short-circuiting, error isolation, and inspection.
- **SC-008**: Integration tests verify that mock hooks can be registered and executed in place of real hooks, enabling clean test isolation.

## Assumptions

- The existing `HookResponse` type (with `action: "CONTINUE" | "DENY" | "HALT"`) is preserved as-is and reused by the registry.
- The existing `ToolRequest` and `ToolResult` interfaces are preserved as-is and passed through the registry to individual hooks.
- Each pre-hook will be refactored into its own function or class implementing `IHook`, but the internal logic of each hook remains unchanged.
- Post-hooks that are currently inline in `postToolUse()` (e.g., mutation logging, trace logging) will be extracted into individual hook implementations.
- The registry is instantiated per HookEngine instance (not a global singleton), preserving the current per-session lifecycle.
- Priority numbers for pre-hooks follow ascending order: lower number = runs first. The default priority for hooks without an explicit priority is 100.
- The `IHook` interface is a new abstraction introduced by this feature; no existing interface exists that serves this purpose.
