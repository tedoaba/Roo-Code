# Quickstart: Intent Handshake (Reasoning Loop)

Welcome to the **Intent Handshake** development environment. This feature enforces a mandatory reasoning loop before any code mutation occurs.

## 1. The Three-State Flow

Every interaction follows this strict sequence:

1.  **State 1: The Request**: The user submits a prompt.
2.  **State 2: Reasoning Intercept**: The agent's tools are stripped down to only `select_active_intent`. The agent must analyze the request and declare which **Intent ID** it will fulfill.
3.  **State 3: Contextualized Action**: Once an intent is selected, the agent's full toolset is restored, but all mutations are validated against the intent's `owned_scope` and `constraints`.

## 2. Core Components

### Hook Engine (`src/hooks/HookEngine.ts`)

The "Sole Execution Gateway." Every tool call and LLM request passes through here. It enforces:

- **Scope**: Rejects writes outside the intent's glob patterns.
- **Auditing**: Records every mutation with a SHA-256 hash in `agent_trace.jsonl`.
- **Budgets**: Tracks turn/token consumption and halts if exceeded.

### Orchestration Service (`src/services/orchestration/OrchestrationService.ts`)

Manages the `.orchestration/` sidecar directory:

- `active_intents.yaml`: The source of truth for active mandates.
- `agent_trace.jsonl`: The append-only audit ledger.
- `intent_map.md`: Tracks file ownership and provenance.

## 3. Developer Workflow

### Adding a New Hook

1.  Create your hook in `src/hooks/pre/` or `src/hooks/post/`.
2.  Register it in the `HookEngine` dispatcher.
3.  Hooks must return a `HookResponse` declaring whether to `CONTINUE`, `DENY`, or `HALT`.

### Local Testing

When running the extension in debug mode:

1.  Initiate a task.
2.  Observe the agent enter the **Reasoning Intercept**.
3.  Check `.orchestration/agent_trace.jsonl` to see the state transitions and mutation hashes.

## 4. Governance Rules to Remember

- **Law 3.2.1 (Scope as Hard Boundary)**: If you haven't declared it in your intent's `owned_scope`, you can't write to it.
- **Law 3.1.5 (Budgets)**: Long-running agents will be throttled if they exceed their turn or token limits.
- **Invariant 8 (Fail-Safe)**: If in doubt (e.g., missing orchestration state), the system will block all mutations.
