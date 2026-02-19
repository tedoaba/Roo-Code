# Implementation Plan: REQ-ID Injection Enforcement

**Branch**: `008-req-id-trace-injection` | **Date**: 2026-02-20 | **Spec**: [specs/008-req-id-trace-injection/spec.md](spec.md)
**Input**: Feature specification from `/specs/008-req-id-trace-injection/spec.md`

## Summary

Enforce strict requirement-level traceability by requiring a well-formatted REQ-ID (e.g., `REQ-123`) from the primary session intent for all destructive tool executions. Executions lacking a valid REQ-ID will be blocked pre-execution with a custom `TraceabilityError`, and successful mutations will have the REQ-ID injected into the trace ledger object's `related` array.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: None (built-in orchestration hooks)  
**Storage**: Append-only JSONL (`.orchestration/agent_trace.jsonl`)  
**Testing**: Jest (Unit & Integration tests)  
**Target Platform**: VS Code Extension / Desktop Environment  
**Project Type**: single (backend hooks / orchestration layer)  
**Performance Goals**: <50ms overhead for validation block (SC-003)  
**Constraints**: Zero impact on read-only tools  
**Scale/Scope**: Impacts all destructive mutative tools across all active agents

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Invariant 1 (Intent–Code Binding)**: Supported by enforcing the presence of the REQ-ID (intent ID) in the context.
- **Invariant 2 (Hook Execution Guarantee)**: Supported by placing the enforcement logic inside `HookEngine.ts`, the sole execution gateway.
- **Invariant 3 (Immutable Audit Trail)**: Supported by ensuring the ledger records (`AgentTraceHook`, `LedgerManager`) always contain the validated `REQ-ID`.
- **Law 3.3.1 (Mutation–Intent Link)**: Fully implements this law by mandating the `related` field in trace objects and blocking orphans.
- **Law 8.2 (Backward Compatibility)**: Existing traces remain valid, but new traces from destructive tools will strictly enforce the REQ-format.

_Result: PASSED._

## Project Structure

### Documentation (this feature)

```text
specs/008-req-id-trace-injection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── hooks/
│   ├── HookEngine.ts                # Add pre-execution block & TraceabilityError
│   └── post/
│       └── AgentTraceHook.ts        # Inject REQ-ID into trace object
└── utils/
    └── orchestration/
        └── LedgferManager.ts        # Schema/trace adjustments if necessary
```

**Structure Decision**: Modifications will primarily occur in the `src/hooks` structure, specifically extending the existing `HookEngine.ts` to perform REQ-ID format validation and handle the custom Exception.

## Complexity Tracking

_No constitution violations detected._
