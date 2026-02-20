# Research Artifact: Verification Failure Detection Hook

## Decision: Post-Tool Hook Implementation

We will implement the verification failure detection as a new post-tool hook within the `HookEngine`.

### Rationale

- **Architectural Alignment**: The `HookEngine` is the "Sole Execution Gateway" (Invariant 2). Implementing the hook here ensures that every `execute_command` invocation is monitored without modifying the core tool logic.
- **Data Availability**: The `postToolUse` method already receives the command parameters (containing the command string) and the tool output (containing the exit code and error messages).
- **Separation of Concerns**: Keeping the detection logic in the `hooks/` directory separates governance/learning logic from the execution mechanics in `core/tools/`.

### Alternatives Considered

- **Modifying `ExecuteCommandTool.ts`**: Rejected because it mixes tool execution with high-level learning logic, violating the principle of the Hook Engine being the governance layer.
- **Monitoring Shell directly**: Rejected as it would be platform-dependent and bypass the existing tool-response abstraction used by the AI.

## Technical Findings

### 1. Intercepting Tool Execution

The `presentAssistantMessage.ts` caller already delegates to `HookEngine.postToolUse` after every tool execution.

- **Success Case**: `postToolUse` is called with `success: true` and the tool's output.
- **Failure Case**: `postToolUse` is called with `success: false` and the error message.
  _Note: For `execute_command`, a non-zero exit code is still considered a "successful tool execution" (the tool ran the command), so we must parse the `output` string._

### 2. Failure Detection Logic

We will use regex to parse the tool output:

- **Exit Code**: `Exit code: ([1-9]\d*)`
- **Tool Whitelist**: `npm (run )?(test|lint)`, `jest`, `vitest`, `eslint`.
- **Affected Files**:
    - Pattern 1 (ESlint/General): `(?:[a-zA-Z]:\\|[./])[\w\-\.\\\/]+\.(?:ts|js|tsx|jsx|json)`
    - Pattern 2 (Stack Traces): `at .* \((.*):(\d+):(\d+)\)`

### 3. Smart Filtering

To minimize token usage and noise:

- Keep lines containing "Error", "Fail", "Exception".
- Keep lines identifying files/lines.
- Keep the last 10 lines of output if non-zero exit code is detected.

## Integration Patterns

- **LessonRecorder**: Use the existing `LessonRecorder` class.
- **Async Execution**: The hook will be executed asynchronously within `postToolUse` to avoid blocking the main turn.

## Best Practices

- **Failsafe**: Wrap the entire hook logic in a try/catch. Log errors to the extension's output channel but never block the user.
- **Deduplication**: Use the existing `Deduplicator` logic within `LessonRecorder` to prevent multiple lessons for the same recurring failure.
