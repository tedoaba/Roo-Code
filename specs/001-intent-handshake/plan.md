# Implementation Plan: 001-intent-handshake (Reasoning Loop)

**Branch**: `001-intent-handshake` | **Date**: 2026-02-18 | **Spec**: [specs/001-intent-handshake/spec.md](./spec.md)

## Summary

This feature implements the **Three-State Execution Flow** for agent governance. It replaces the basic handshake with a robust **Hook Engine** that enforces state transitions from **State 1 (Request)** to **State 2 (Reasoning Intercept)** and finally **State 3 (Contextualized Action)**. It ensures zero-bypass execution, cryptographic auditability via SHA-256 hashes, and continuous context health through PreCompact hooks.

## Technical Context

- **System Constitution Compliance**: Invariants 1, 2, 3, 4, 8, 9, 11 and Laws 3.1.1, 3.1.3, 3.1.5, 3.1.6, 3.2.1, 3.3.1, 4.1, 4.6.
- **Orchestration Layer**: Uses `.orchestration/` sidecar directory for immutable state.
- **State Machine**:
    - `REQUEST`: User prompt received.
    - `REASONING`: Restricted to `select_active_intent` tool only.
    - `ACTION`: Full tool access constrained by intent scope.
- **Hook Lifecycle**:
    - `PreRequest`: Context compaction and budget checking.
    - `PreToolUse`: Scope enforcement and loop detection.
    - `PostToolUse`: SHA-256 hashing and audit logging.

## Constitution Check

| Invariant   | Requirement                           | Status               |
| :---------- | :------------------------------------ | :------------------- |
| Invariant 2 | Hook Engine as sole execution gateway | **Aligned** (FR-001) |
| Invariant 3 | Immutable Audit Trail with SHA-256    | **Aligned** (FR-006) |
| Invariant 4 | Single Source of Orchestration Truth  | **Aligned** (FR-004) |
| Invariant 9 | Three-State Execution Flow            | **Aligned** (FR-002) |
| Law 3.1.5   | Execution Budgets                     | **Aligned** (FR-011) |
| Law 4.6     | Circuit Breakers (Loop Detection)     | **Aligned** (FR-009) |

## Design Architecture

### 1. Hook Engine Middleware (`src/hooks/HookEngine.ts`)

The central dispatcher for all governance checks. Injected into `Task.ts` for zero-bypass enforcement.

### 2. Orchestration Service (`src/services/orchestration/OrchestrationService.ts`)

Handles file I/O for the `.orchestration/` directory, SHA-256 computation, and scope validation.

### 3. State Machine (`src/core/state/StateMachine.ts`)

Manages the `REQUEST -> REASONING -> ACTION` transitions.

### 4. Audit Ledger (`.orchestration/agent_trace.jsonl`)

A high-frequency, append-only log of every mutation and state transition.

## Project Structure

```text
src/
├── hooks/
│   ├── HookEngine.ts         # Main dispatcher
│   ├── pre/
│   │   ├── ScopeHook.ts      # Enforces owned_scope
│   │   ├── BudgetHook.ts     # Enforces turns/tokens
│   │   └── CompactHook.ts    # Summarizes context
│   └── post/
│       └── AuditHook.ts      # Computes SHA-256 and logs trace
├── services/
│   └── orchestration/
│       └── OrchestrationService.ts
└── core/
    └── task/
        └── Task.ts           # Integrated with HookEngine
```

## Phase 0: Outline & Research (Complete)

- [x] Research Hook Engine architecture vs inline logic (Decision: Middleware Pattern).
- [x] Verify SHA-256 performance for real-time hashing (Decision: Native Node `crypto`).
- [x] Analyze VS Code tool filtering mechanisms (Decision: Dynamic tool array modification).

## Phase 1: Design & Contracts (In Progress)

- [x] Finalize `data-model.md` (ActiveIntent format, Trace format).
- [ ] Implement `HookEngine` contract/interface.
- [ ] Create `quickstart.md` for developer orientation.

## Phase 2: Foundation (Next)

- [ ] Initialize `.orchestration/` directory.
- [ ] Build key Orchestration Service methods (readActiveIntents, logTrace).
- [ ] Implement Hook Engine backbone.
