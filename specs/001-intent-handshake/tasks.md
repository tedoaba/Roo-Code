# Implementation Tasks: The Handshake (Reasoning Loop Implementation)

**Feature**: The Handshake (Reasoning Loop Implementation)
**Branch**: `001-intent-handshake`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Phase 1: Foundation (Setup)

Goal: Initialize the orchestration environment and install necessary dependencies.

- [ ] T001 [Setup] Install `js-yaml` dependency for parsing active_intents.yaml
- [ ] T002 [Setup] Install `@types/js-yaml` dev dependency
- [ ] T003 [Setup] Create `.orchestration/` directory structure in workspace root (if not exists)
- [ ] T004 [Setup] Create dummy `.orchestration/active_intents.yaml` with test intents for development

## Phase 2: Orchestration Service (Data Layer)

Goal: Implement the service layer to manage `active_intents.yaml` and `agent_trace.jsonl`.

- [ ] T005 [P] Create `OrchestrationService` types in `src/services/orchestration/types.ts` (ActiveIntent, IntentStatus, etc.)
- [ ] T006 [P] Implement `OrchestrationService` class in `src/services/orchestration/OrchestrationService.ts`
- [ ] T007 [P] Implement `getActiveIntents()` method in `OrchestrationService` to read and parse YAML
- [ ] T008 [P] Implement `getIntent(id)` method in `OrchestrationService`
- [ ] T009 [P] Implement `logTrace(entry)` method in `OrchestrationService` to append to JSONL
- [ ] T010 [P] Implement `validateScope(intentId, path)` method in `OrchestrationService` (using minimatch/glob)

## Phase 3: The Handshake Tool (User Story 1 & 2)

Goal: Implement the `select_active_intent` tool that allows the agent to opt-in to an intent.

- [ ] T011 [US1] Create `SelectActiveIntent` tool class in `src/core/tools/SelectActiveIntent.ts` implementing `BaseTool`
- [ ] T012 [US2] Implement `run()` method in `SelectActiveIntent` to update session state
- [ ] T013 [US2] update `SelectActiveIntent` to return enriched context (constraints, scope, history) from `OrchestrationService`
- [ ] T014 [US1] Register `SelectActiveIntent` in `src/core/tools/index.ts` (or equivalent tool registry)
- [ ] T015 [US1] Update `Task.ts` to instantiate and hold reference to `OrchestrationService`

## Phase 4: Reasoning Loop Enforcement (User Story 1 & 5)

Goal: Enforce the mandatory handshake by modifying the `Task.ts` execution loop.

- [ ] T016 [US1] Modify `Task.ts` to track `activeIntentId` in session state
- [ ] T017 [US1] Implement `isIntentActive()` check in `Task.ts`
- [ ] T018 [US5] Modify `buildNativeToolsArray` (or specific tool builder) to filter OUT all tools EXCEPT `select_active_intent` when `activeIntentId` is null
- [ ] T019 [US5] Modify `executeTool` in `Task.ts` to hard-block any tool execution (except `select_active_intent`) if `activeIntentId` is null
- [ ] T020 [US5] Implement informative error message "You must cite a valid active Intent ID" when blocked

## Phase 5: Prompt Governance (User Story 3 & 4)

Goal: Update system prompt and inject context into LLM payload.

- [ ] T021 [US3] Create `generateGovernancePrompt` helper in `src/core/prompts/sections/governance.ts`
- [ ] T022 [US3] Modify `SYSTEM_PROMPT` construction in `src/core/prompts/system.ts` to include governance section
- [ ] T023 [US3] Logic to list available intents in system prompt when no intent is active
- [ ] T024 [US4] Logic to show ONLY active intent scope/constraints in system prompt when intent IS active
- [ ] T025 [US4] Pre-load `OrchestrationService` data before generating prompt in `Task.ts`

## Phase 6: Edge Cases & Polish

Goal: Handle edge cases (missing files, invalid IDs) and final verification.

- [ ] T026 [Edge] Implement graceful error handling in `OrchestrationService` for missing `.orchestration` folders
- [ ] T027 [Edge] Add validation for 'Lock Session' rule (FR-013) - prevent switching intents mid-session
- [ ] T028 [Edge] Implement 'Strict Scope' validation (FR-014) in `validateScope` (using glob patterns)
- [ ] T029 [Verification] Manual test: Verify agent is blocked without intent
- [ ] T030 [Verification] Manual test: Verify agent can select intent and then use tools
- [ ] T031 [Verification] Manual test: Verify out-of-scope edits are blocked
