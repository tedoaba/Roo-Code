# Implementation Plan: Hook Middleware & Security Boundary

## 1. Summary

Architect and implement the Hook Engine that wraps all tool execution requests, enforcing formal boundaries based on active intent scopes and user-defined exclusions (`.intentignore`).

## 2. Technical Context

- **Core Loop**: Unified tool execution gateway in `presentAssistantMessage.ts`.
- **Classification**: Tools categorized as SAFE (read) vs DESTRUCTIVE (write, exec).
- **Scope**: `owned_scope` within the sidecar `ActiveIntent` data model.
- **Exclusion**: `.intentignore` following standard gitignore syntax.

## 3. Constitution Check

- **Invariant 2 (Sole Execution Gateway)**: All tools pass through `HookEngine`.
- **Invariant 10 (Intent Handshake)**: Intent selection required for destructive actions.
- **Fail-Safe Default**: Defaults to "Fail-Close" (Deny) if scope is ambiguous.

## 4. Phase 1: Research & Contract Generation

- **Research Artifact**: `specs/002-hook-middleware/research.md` - [COMPLETED]
- **Data Model**: `specs/002-hook-middleware/data-model.md` - [COMPLETED]
- **Quickstart**: `specs/002-hook-middleware/quickstart.md` - [COMPLETED]
- **Agent Context**: Updated `AGENTS.md` and `.roo/rules/rules.md` - [COMPLETED]

### Identified Contracts

| Module                    | Method             | Change Description                                               |
| :------------------------ | :----------------- | :--------------------------------------------------------------- |
| `OrchestrationService`    | `validateScope`    | Integrate `.intentignore` check (Precedence: High).              |
| `OrchestrationService`    | `loadIntentIgnore` | [New] Load and watch `.intentignore` file.                       |
| `HookEngine`              | `preToolUse`       | Classify tools; enforce Intent Handshake; check turn budgets.    |
| `HookEngine`              | `postToolUse`      | Log SHA-256 mutation hashes and update audit ledger.             |
| `Task`                    | `ask`              | Ensure UI blocking works consistently for Hook Engine approvals. |
| `presentAssistantMessage` | `handle`           | Wrap sequential tool execution in unified Hook Engine calls.     |
| `IntentGateHook`          | `unify`            | Deprecate and merge into HookEngine (Single Gateway).            |

## 5. Project Structure

```text
src/
  hooks/
    HookEngine.ts          # Central dispatcher
  services/
    orchestration/         # Intent & Scope management
  core/
    assistant-message/     # Primary execution loop
```

## 6. Phase 2: Implementation (Sequential Tasks)

1. [ ] **T001**: Implement `.intentignore` loading and watching in `OrchestrationService`.
2. [ ] **T002**: Update `OrchestrationService.validateScope` to enforce `.intentignore` precedence.
3. [ ] **T003**: Implement `HookEngine.isDestructiveTool` using classification from `data-model.md`.
4. [ ] **T004**: Implement turn budget enforcement (Law 3.1.5) in `HookEngine.preToolUse`.
5. [ ] **T005**: Deprecate `IntentGateHook` and unify all checks into `HookEngine` (Invariant 2).
6. [ ] **T006**: Implement JSON-formatted error responses in `HookEngine.preToolUse`.
7. [ ] **T007**: Integrate `HookEngine.preToolUse` into `presentAssistantMessage.ts`.
8. [ ] **T008**: Integrate `HookEngine.postToolUse` with SHA-256 hashing and audit logging.
9. [ ] **T009**: Implement UI-Blocking "Approve/Reject" trigger in the execution loop.
10. [ ] **T010**: Verify "No Active Intent" behavior (Block & Force Handshake).

## 7. Complexity & Technical Debt

- **Complexity Score**: 8/10 (Critical infrastructure integration).
- **Risk**: Breaking the primary tool execution loop would disable the agent. Requires careful unit and integration testing.
- **Verification**: Use mock intents to verify scope gating and `.intentignore` overrides.
