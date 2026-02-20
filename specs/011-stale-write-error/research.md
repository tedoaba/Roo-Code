# Research: Stale File Error Protocol

**Date**: 2026-02-20

## Unknowns Evaluated

There were no `[NEEDS CLARIFICATION]` tags required in the feature spec. However, we evaluated best practices for error output and audit logging integration.

## Decisions

### 1. Error Representation Format

- **Decision**: Establish a dedicated Custom Error class, `StaleWriteError`, extending `Error`. It will encapsulate the `error_type`, `file_path`, `expected_hash`, and `actual_hash`. The `HookEngine` will serialize this specific error class to raw JSON before throwing/returning it to the Agent Controller, rather than outputting a generic `Error: STALE_FILE ...` stack trace.
- **Rationale**: The Agent Controller (often an LLM itself) hallucinates less and recovers faster if presented with deterministic JSON. A formal class within our TS system allows hooks to specifically catch, log, and re-throw without loss of structure.
- **Alternatives Considered**: Modifying the existing `OptimisticLockError` string payload, but that risks the controller misinterpreting the natural language description.

### 2. Audit Trail Integration Strategy

- **Decision**: Intercept `StaleWriteError` in `HookEngine` before returning to the Controller and write an explicitly typed conflict event to the `AgentTraceLedger` (using `LedgerManager.appendEntry`).
- **Rationale**: Fits explicitly within the "Every mutation is evidence" (Invariant 2) Constitution constraint, treating blocked writes securely as notable forensic events.
- **Alternatives Considered**: Making the `OptimisticGuard` log it. Rejected, because `HookEngine` is the central orchestration hub that knows _both_ that the operation failed and _who_ attempted it, unifying logging.

## Summary

The design resolves any operational ambiguities securely. The system will create a new Custom Error, propagate it precisely as JSON to the host, and serialize the conflict strictly into the trace ledger.
