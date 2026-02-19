# Research Report: REQ-ID Injection Enforcement

## Custom Exceptions (`TraceabilityError`)

**Decision**: Create a dedicated `TraceabilityError` class that extends the standard `Error` class and is exported from a new `src/errors/TraceabilityError.ts` file or an existing error module.
**Rationale**: Using a custom exception strictly differentiates missing traceability metadata from other operational errors (e.g., missing specific file, timeout). It explicitly signals to the tool caller (or the orchestration layer acting as the supervisor agent) that the governance boundaries enforced by the Constitution have blocked the request.
**Alternatives considered**:

- Generic `Error` string (too fragile for robust catch checks).
- Returning a successful response with an `error` field (violates fail-safe and fail-close philosophy).

## REQ-ID Extraction and Validation

**Decision**: Validate `req.intentId` against the flexible regex pattern `/^REQ-[a-zA-Z0-9\-]+$/` directly within `HookEngine.preToolUse()`.
**Rationale**: `intentId` acts as the primary requirement tracker in the current orchestration context. Running the Regex early in `preToolUse` provides the <50ms pre-execution block requirement.
**Alternatives considered**:

- Pushing the validation to `AgentTraceHook` (would fail the pre-execution block requirement).
- Using a more complex NLP extraction (adds latency, risks false positives/negatives).

## Trace Object Injection

**Decision**: Update `AgentTraceEntry` interface to mandate a `related` array containing the `REQ-ID`. Map this within the `LedgerManager.recordMutation` convenience method to automatically inject `[params.intentId]` into the trace ledger object.
**Rationale**: Satisfies Law 3.3.1 (Mutation-Intent Link). Centralizing this in `LedgerManager` ensures any future hooks calling `recordMutation` automatically inherit the requirement without code duplication.
**Alternatives considered**:

- Forcing `AgentTraceHook` to stringify the array, but modifying `LedgerManager` represents a cleaner abstraction that honors the Single Source of Orchestration Truth.
