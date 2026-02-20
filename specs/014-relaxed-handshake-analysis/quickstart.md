# Quickstart Guide: Relaxed Handshake Analysis

This guide explains the "Relaxed Handshake" flow, which lets the Architect use analysis tools before selecting an intent.

## How it Works

Previously, the **Reasoning Intercept** (State 2) blocked every tool except `select_active_intent`. This created a deadlock when the Architect needed to read code to define the intent's scope.

The updated flow allows any tool classified as **SAFE** to execute at any time.

### 1. Analysis Phase (REASONING state)

When you start a task, you are in the `REASONING` state. You can now use:

- `list_files`
- `read_file`
- `codebase_search`

Example Loop:

1. User: "Fix the bug in the auth service."
2. Architect: Calls `list_files` to find `authService.ts`.
3. Architect: Calls `read_file` to understand the logic.
4. Architect: Now calls `select_active_intent` with a precise scope.

### 2. Guarding Mutations

If you attempt a **DESTRUCTIVE** action (like `write_to_file`) before selecting an intent, the `HookEngine` will block the call:

```json
{
	"action": "DENY",
	"reason": "State Violation: Intent Handshake required for DESTRUCTIVE actions. Call 'select_active_intent' first."
}
```

### 3. Informational Tasks

If the user's request is purely informational (e.g., "Where is the login logic?"), you can:

1. Research using `SAFE` tools.
2. Call `attempt_completion` directly from the `REASONING` state.
3. No intent selection is required for zero-mutation tasks.

## Key Files

- `src/hooks/HookEngine.ts`: Defines `COMMAND_CLASSIFICATION`.
- `src/core/state/StateMachine.ts`: Implements state-based tool filtering.
- `src/core/task/build-tools.ts`: Filters available tools for the model.
- `src/core/prompts/sections/intent-handshake.ts`: System prompt instructions.
