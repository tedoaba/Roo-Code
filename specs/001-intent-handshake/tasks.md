# Implementation Tasks: The Handshake (Reasoning Loop Implementation)

**Feature**: The Handshake (Reasoning Loop Implementation)
**Branch**: `001-intent-handshake`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Phase 1: Foundation & Hook Infrastructure (P1)

Goal: Initialize the orchestration environment and set up the Hook Engine backbone.

- [x] T001 [Setup] Create `.orchestration/` directory structure in workspace root.
- [x] T002 [Setup] Initialize `.orchestration/active_intents.yaml` and `agent_trace.jsonl`.
- [ ] T003 [P] Implement `HookEngine.ts` core middleware dispatcher in `src/hooks/`.
- [ ] T004 [P] Implement `StateMachine.ts` with states: `REQUEST`, `REASONING`, `ACTION`.
- [ ] T005 [P] Integrate `HookEngine` into the main `Task.ts` loop (replacing legacy gate logic).

## Phase 2: Orchestration & Cryptographic Audit (P1)

Goal: Implement the data layer with SHA-256 hashing and execution budgets.

- [ ] T006 [P] Implement `AuditLedger.ts` with SHA-256 content hashing logic.
- [ ] T007 [P] Enhance `OrchestrationService` to support state-specific intent retrieval.
- [ ] T008 [P] Implement `PreToolUse` hook for state-aware tool gating (Invariant 9).
- [ ] T009 [P] Implement `PostToolUse` hook for mutation recording and intent-code binding (Invariant 3).
- [ ] T010 [P] Implement turn/token budget tracking in `OrchestrationService`.

## Phase 3: The Handshake Tool (P1)

Goal: Implement the `select_active_intent` tool as the sole gateway to State 3.

- [ ] T011 [US1] Implement `SelectActiveIntent.ts` as a restricted tool for State 2.
- [ ] T012 [US2] Update `SelectActiveIntent` to trigger `HookEngine` state transition to `ACTION`.
- [ ] T013 [US2] Ensure `SelectActiveIntent` returns full intent context (scope, constraints, history).
- [ ] T014 [US3] Implement `PreCompact` hook to prevent context rot during State 3.

## Phase 4: State-Aware Prompt Governance (P2)

Goal: Build the "Three-State" prompt assembly pipeline.

- [ ] T015 [US3] Implement `Governance.ts` prompt section generator.
- [ ] T016 [US3] Update system prompt builder to dynamically filter tools based on `HookEngine` state.
- [ ] T017 [US4] Implement context enrichment during the State 2 -> State 3 transition.
- [ ] T018 [US4] Implement Shared Brain (`AGENT.md`) synchronization in `PostToolUse` hook.

## Phase 5: Verification & Fail-Safes (P2)

Goal: Ensure zero-bypass and robust error handling.

- [ ] T019 [Edge] Implement Fail-Safe Default (Invariant 8) for missing orchestration state.
- [ ] T020 [Edge] Implement Scope Leakage protection in `PreToolUse`.
- [ ] T021 [Edge] Implement Circuit Breakers for infinite loop detection (Law 4.6).
- [ ] T022 [Verification] Manual Audit: Verify SHA-256 hashes in `agent_trace.jsonl` match file content.
- [ ] T023 [Verification] Manual Audit: Verify zero-bypass of the Reasoning Intercept.
