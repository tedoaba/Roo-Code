# Implementation Plan: Optimistic Locking Guard

**Branch**: `009-optimistic-locking-guard` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-optimistic-locking-guard/spec.md`

## Summary

Implement file-level optimistic concurrency control to prevent stale write conflicts. The system will capture a SHA-256 hash when an agent reads a file and verify it hasn't changed immediately before any subsequent write attempt. Conflicts will be blocked, returned as structured errors, and recorded in the audit ledger.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: `crypto` (standard library), `HookEngine`, `LedgerManager`.  
**Storage**: In-memory `TurnContext` (transient) for baseline hashes; `.orchestration/agent_trace.jsonl` (persistent) for audit records.  
**Testing**: Vitest  
**Target Platform**: Node.js / VS Code Extension Host  
**Project Type**: VS Code Extension  
**Performance Goals**: <50ms verification overhead for files <1MB.  
**Constraints**: Zero silent overwrites; SHA-256 mandatory.  
**Scale/Scope**: All files accessed via governed agent tools.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Law                                   | Status | Rationale                                                             |
| :------------------------------------ | :----- | :-------------------------------------------------------------------- |
| **Invariant 2** (Hook Guarantee)      | PASS   | Implementation will be integrated into the `HookEngine` pipeline.     |
| **Invariant 3** (Audit Trail)         | PASS   | Blocked writes will be recorded in `agent_trace.jsonl`.               |
| **Invariant 6** (Conflict Resolution) | PASS   | Enforces "no silent overwrite" policy via structured error feedback.  |
| **Invariant 7** (Crypto Integrity)    | PASS   | Uses mandated SHA-256 algorithm.                                      |
| **Law 5.2** (Atomic Transitions)      | PASS   | Uses optimistic locking (CAS pattern) to guarantee state consistency. |

## Project Structure

### Documentation (this feature)

```text
specs/009-optimistic-locking-guard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── core/
│   └── concurrency/
│       ├── OptimisticGuard.ts    # Core verification logic
│       └── TurnContext.ts         # Transient hash storage
├── hooks/
│   └── pre/
│       └── ConcurrencyHook.ts      # Hook integration
└── utils/
    └── hashing.ts                 # SHA-256 utility (existing)
```

**Structure Decision**: New logic will be housed in `src/core/concurrency` to separate state management from the hook invocation layer.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :-------- | :--------- | :----------------------------------- |
| N/A       |            |                                      |
