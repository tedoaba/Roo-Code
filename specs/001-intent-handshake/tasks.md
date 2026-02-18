# Implementation Tasks: The Handshake (Reasoning Loop Implementation)

**Feature**: The Handshake (Reasoning Loop Implementation)
**Branch**: `001-intent-handshake`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Phase 1: Setup (P1)

Goal: Initialize the orchestration environment and sidecar data structures.

- [ ] T001 Create `.orchestration/` directory in workspace root
- [ ] T002 Initialize `.orchestration/active_intents.yaml` with schema-compliant default state
- [ ] T003 Initialize `.orchestration/agent_trace.jsonl` as an empty append-only ledger
- [ ] T004 Initialize `.orchestration/intent_map.md` with the required markdown table structure

## Phase 2: Foundational Hooks & Services (P1)

Goal: Build the core infrastructure that all user stories depend on.

- [ ] T005 [P] Create `OrchestrationService.ts` in `src/services/orchestration/` to handle sidecar file I/O
- [ ] T006 [P] Implement `StateMachine.ts` in `src/core/state/` with states: REQUEST, REASONING, ACTION
- [ ] T007 [P] Create `HookEngine.ts` dispatcher in `src/hooks/` to manage pre/post lifecycle stages
- [ ] T008 [P] Implement SHA-256 helper using Node `crypto` in `src/services/orchestration/OrchestrationService.ts`
- [ ] T009 Integrate `HookEngine` into `Task.ts` ensuring all tool calls pass through pre/post hooks

## Phase 3: User Story 1 - The Reasoning Intercept (P1)

Goal: Enforce tool restriction and transition to State 2.

- [ ] T010 [US1] Create `select_active_intent` tool definition in `src/hooks/tools/`
- [ ] T011 [US1] Implement tool filtering in `HookEngine.ts` to restrict State 2 to `select_active_intent` only
- [ ] T012 [US1] Update `StateMachine.ts` to transition to State 2 (REASONING) upon initial user request
- [ ] T013 [US1] Implement intent validation in `OrchestrationService.ts` (deny broad scopes, invalid statuses)
- [ ] T014 [US1] Update system prompts to include the list of PENDING/IN_PROGRESS intents from `active_intents.yaml`

## Phase 4: User Story 2 - Context Enrichment (P1)

Goal: Inject scope, constraints, and shared brain data into the agent's context.

- [ ] T015 [US2] Create `ContextEnrichmentHook.ts` in `src/hooks/pre/` to load intent data
- [ ] T016 [P] [US2] Implement scope glob loading from `active_intents.yaml` into Task context
- [ ] T017 [P] [US2] Implement Shared Brain (`AGENT.md`/`CLAUDE.md`) injection into LLM prompts
- [ ] T018 [US2] Implement `ScopeEnforcementHook.ts` to block mutations outside the `owned_scope`
- [ ] T019 [US2] Transition system to State 3 (ACTION) only after a valid intent ID is cited

## Phase 5: User Story 3 - Cryptographic Audit & Provenance (P2)

Goal: Immutable audit logs with spatial independence via hashing.

- [ ] T020 [US3] Create `AuditHook.ts` in `src/hooks/post/` to record tool execution results
- [ ] T021 [US3] Implement automatic SHA-256 computation for all `write_to_file` and `apply_diff` actions
- [ ] T022 [US3] Update `intent_map.md` with the latest file hashes and owning intent IDs after mutations
- [ ] T023 [US3] Ensure all `agent_trace.jsonl` entries include the `related[]` array linking to the active intent
- [ ] T024 [US3] Implement "Spatial Independence" test: verify re-linkage of a code block after it is moved

## Phase 4: User Story 4 - Resource Governance & Budgets (P3)

Goal: Enforce execution limits and prevent costly loops.

- [ ] T025 [US4] Create `BudgetHook.ts` in `src/hooks/pre/` to track turn and token consumption
- [ ] T026 [US4] Implement Circuit Breaker logic to trip (deny execution) after 3 identical tool calls
- [ ] T027 [US4] Implement `PreCompactHook.ts` to summarize tool history before context window overflow
- [ ] T028 [US4] Implement "Manual Reset" requirement: intents marked `BLOCKED` stay blocked until human intervention

## Phase 7: Polish & Verification (P2)

Goal: Ensure zero-bypass enforcement and fail-safe defaults.

- [ ] T029 Implement Invariant 8: Fail-Safe Default (deny all mutations if `.orchestration/` is missing)
- [ ] T030 Perform cross-cutting test: verify State 3 completion triggers Shared Brain lesson append
- [ ] T031 [P] Create `quickstart.md` examples for multi-intent parallel execution
- [ ] T032 Final documentation update: confirm all constitutional laws (Part III) are implemented

## Dependencies

- Phase 2 (Foundation) must be complete before any User Story tasks.
- US1 (Reasoning Intercept) must be complete to enable State transitions for US2-US4.
- US2 (Enrichment) provides the `owned_scope` required for US3 (Audit) validation.

## Parallel Execution Opportunities

- T005, T006, T007, T008 in Phase 2 can be developed simultaneously.
- T016 and T017 in US2 are independent context injection tasks.
- T031 and T032 can be finished while final tests are running.

## Implementation Strategy

- **MVP Phase**: Complete US1 (The Intercept) and US2 (Basic Enrichment). This establishes the "Think-Before-Act" flow.
- **Incremental**: Add US3 (Audit) for accountability and US4 (Budgets) for operational safety.
- **Fail-Safe**: Invariant 8 enforcement is the final gate for "Production Ready" status.
