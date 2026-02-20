# Data Model & Components: Proactive Tool Filtering

## Entities

### `ExecutionState` (Existing)

Represents the current conversational phase of the agent.

- `REQUEST`: The user has provided an implicit prompt, and the agent has not yet generated a response.
- `REASONING`: The agent is exploring, planning, or selecting an intent but has not committed to one yet.
- `ACTION`: The agent has declared and validated an explicit intent.

### `ToolClassification` (Existing)

A mapping found in `src/services/orchestration/types.ts`.

- `SAFE`: Tools meant for analysis, exploration, and context gathering (e.g. `read_file`, `search_files`, `list_files`).
- `DESTRUCTIVE`: Tools meant to modify the file system or run executable side-effects (e.g. `write_to_file`, `execute_command`).

## Components / Services

### `buildNativeToolsArray()`

Location: `src/core/task/build-tools.ts`
Responsibility: Builds the final list of JSON Schema tool definitions passed to the LLM.

**Modifications needed:**

1. Update signature to accept a filtering parameter. Following the decorator pattern, `build-tools.ts` should not be tightly coupled to `HookEngine`, but rather accept raw state (e.g., `currentState: "REQUEST" | "REASONING" | "ACTION"` or a lambda).
2. Internally, when state is `REQUEST` or `REASONING`, evaluate the mapped string-names of all built tools against `COMMAND_CLASSIFICATION`. Any tool falling under the `DESTRUCTIVE` banner must be dropped from the returned array.
3. Keep `select_active_intent` explicitly permitted.
4. When `ACTION`, restore the standard mode-based filtering mechanism.

### `Task` Class

Location: `src/core/task/Task.ts`
Responsibility: The orchestration controller handling the prompt loop and holding reference to the `HookEngine`.

**Modifications needed:**

1. Before invoking `buildNativeToolsArray`, query `this.hookEngine.getCurrentState()`.
2. Evaluate `isHandshakeActive` depending on how the execution state propagates.
3. Pass the fetched state parameter alongside the existing mode.
