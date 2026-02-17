# Implementation Tasks: The Handshake (Reasoning Loop Implementation)

**Feature**: The Handshake (Reasoning Loop Implementation)
**Branch**: `001-intent-handshake`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Phase 1: Foundation (Setup)

Goal: Initialize the orchestration environment and install necessary dependencies.

- [x] T001 [Setup] Install `js-yaml` dependency for parsing active_intents.yaml
- [x] T002 [Setup] Install `@types/js-yaml` dev dependency
- [x] T003 [Setup] Create `.orchestration/` directory structure in workspace root (if not exists)
- [x] T004 [Setup] Create dummy `.orchestration/active_intents.yaml` with test intents for development

## Phase 2: Orchestration Service (Data Layer)

Goal: Implement the service layer to manage `active_intents.yaml` and `agent_trace.jsonl`.

- [x] T005 [P] Create `OrchestrationService` types in `src/services/orchestration/types.ts` (ActiveIntent, IntentStatus, etc.)
- [x] T006 [P] Implement `OrchestrationService` class in `src/services/orchestration/OrchestrationService.ts`
- [x] T007 [P] Implement `getActiveIntents()` method in `OrchestrationService` to read and parse YAML
- [x] T008 [P] Implement `getIntent(id)` method in `OrchestrationService`
- [x] T009 [P] Implement `logTrace(entry)` method in `OrchestrationService` to append to JSONL
- [x] T010 [P] Implement `validateScope(intentId, path)` method in `OrchestrationService` (using minimatch/glob)

## Phase 3: The Handshake Tool (User Story 1 & 2)

Goal: Implement the `select_active_intent` tool that allows the agent to opt-in to an intent.

- [x] T011 [US1] Create `SelectActiveIntent` tool class in `src/core/tools/SelectActiveIntent.ts` implementing `BaseTool`
- [x] T012 [US2] Implement `run()` method in `SelectActiveIntent` to update session state
- [x] T013 [US2] update `SelectActiveIntent` to return enriched context (constraints, scope, history) from `OrchestrationService`
- [x] T014 [US1] Register `SelectActiveIntent` in `src/core/tools/index.ts` (or equivalent tool registry)
- [x] T015 [US1] Update `Task.ts` to instantiate and hold reference to `OrchestrationService`

## Phase 4: Reasoning Loop Enforcement (User Story 1 & 5)

Goal: Enforce the mandatory handshake by implementing the `IntentGateHook` and integrating it into the `Task.ts` execution loop.

- [x] T016 [US1] Create `IntentGateHook` class in `src/hooks/pre/IntentGateHook.ts`
- [x] T017 [US1] Implement `isIntentActive()` and `validateToolCall()` methods
- [x] T018 [US1] Modify `Task.ts` to instantiate `IntentGateHook`
- [x] T019 [US5] Modify `buildNativeToolsArray` filter logic to hide tools when no intent is active
- [x] T020 [US5] Modify `executeTool` (presentAssistantMessage) to block execution if no intent is active
- [x] T021 [US5] Implement informative error message for blocked tool callsid active Intent ID" in `IntentGateHook`

## Phase 5: Prompt Governance (User Story 3 & 4)

Goal: Update system prompt and inject context into LLM payload.

- [ ] T022 [US3] Create `generateGovernancePrompt` helper in `src/core/prompts/sections/governance.ts`
- [x] T023 [US3] Modify `SYSTEM_PROMPT` to include Intent Handshake instructions
- [x] T024 [US2] Implement logic to inject active intent context (constraints, history) into the prompt
- [x] T025 [US1] Update `SelectActiveIntent` tool to trigger a prompt refresh if needed
- [x] T026 [US1] Handle "no intent" state by presenting available intents in the prompt when intent IS active
- [ ] T026 [US4] Pre-load `OrchestrationService` data before generating prompt in `Task.ts`

## Phase 6: Edge Cases & Polish

Goal: Handle edge cases (missing files,- [x] T028 [US1] Handle intent switching (clear old context)

- [x] T029 [US4] Implement trace logging for all tool calls in `OrchestrationService`
- [x] T030 Ensure context is maintained across sessions (if applicable)
- [x] T031 [US5] Final verification of enforcement logic and error handling
- [x] T032 [US6] Cleanup and documentation updatefor 'Lock Session' rule (FR-013) - prevent switching intents mid-session
- [ ] T029 [Edge] Implement 'Strict Scope' validation (FR-014) in `validateScope` (using glob patterns)
- [ ] T030 [Verification] Manual test: Verify agent is blocked without intent
- [ ] T031 [Verification] Manual test: Verify agent can select intent and then use tools
- [ ] T032 [Verification] Manual test: Verify out-of-scope edits are blocked
