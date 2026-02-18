# Implementation Plan: 001-intent-handshake (Reasoning Loop)

**Branch**: `001-intent-handshake` | **Date**: 2026-02-18 | **Spec**: [specs/001-intent-handshake/spec.md](./spec.md)

## Summary

This feature implements the **Three-State Execution Flow** for agent governance. It replaces the simple handshake with a robust **Hook Engine** that enforces state transitions from **State 1 (Request)** to **State 2 (Reasoning Intercept)** and finally **State 3 (Contextualized Action)**. It ensures zero-bypass execution, cryptographic auditability via SHA-256 hashes, and continuous context health through PreCompact hooks.

## Technical Context

- **Language**: TypeScript 5.8+
- **Core Component**: `src/hooks/HookEngine.ts` (The central middleware).
- **Storage**: `.orchestration/` (Sidecar directory).
    - `active_intents.yaml`: Registry of active mandates.
    - `agent_trace.jsonl`: Cryptographic audit ledger.
    - `intent_map.md`: Spatial intent-to-file mapping.
- **Security**: SHA-256 content hashing for mutation verification.
- **Constraints**: 100% bypass blocking; Turn/Token execution budgets.

## Constitution Check

- **Invariant 9 (Execution Flow)**: ✅ Enforced by the State Machine in `HookEngine`.
- **Invariant 2 (Hook Engine)**: ✅ All tool calls and LLM requests must pass through `HookEngine`.
- **Invariant 3 (Immutable Audit)**: ✅ Every mutation recorded with SHA-256.
- **Law 3.1.6 (Context Compaction)**: ✅ Implemented via `PreCompact` hook.
- **Law 4.1 (Least Privilege)**: ✅ During State 2, only `select_active_intent` tool is available.

## Design Architecture

### Phase 1: Hook Engine & State Machine

Implement the central `HookEngine` class using the Middleware pattern. It will manage the transition from State 1 -> 2 -> 3.

- **PreToolUse Hook**: Validates state and scope.
- **PostToolUse Hook**: Records mutation and computes SHA-256 hashes.
- **PreLLMRequest Hook**: Performs context compaction and prompt assembly.

### Phase 2: Orchestration & Audit Ledger

Enhance `OrchestrationService` to support:

- Cryptographic logging to `agent_trace.jsonl`.
- Managing execution budgets (turn counts).
- Shared Brain (`AGENT.md`) synchronization.

### Phase 3: State-Aware Prompt Engineering

Update the prompt construction pipeline to dynamically restrict toolsets and inject intent/scope context based on the current execution state.

## Project Structure

```text
src/
├── hooks/
│   ├── HookEngine.ts         # Central Dispatcher
│   ├── lifecycle/
│   │   ├── PreToolUse.ts     # Scope/State validation
│   │   ├── PostToolUse.ts    # Audit/SHA-256/Trace
│   │   └── PreCompact.ts     # Context Compaction
├── core/
│   ├── state/
│   │   └── StateMachine.ts   # States: REQUEST, REASONING, ACTION
│   ├── tools/
│   │   └── SelectActiveIntent.ts
├── services/
│   └── orchestration/
│       ├── OrchestrationService.ts
│       └── AuditLedger.ts    # SHA-256 hash logic
└── prompts/
    └── sections/
        └── Governance.ts     # State-aware instructions
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :-------- | :--------- | :----------------------------------- |
| N/A       |            |                                      |
