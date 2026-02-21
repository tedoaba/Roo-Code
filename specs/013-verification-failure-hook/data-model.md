# Data Model: Verification Failure Detection Hook

## Entities

### 1. VerificationFailure (Ephemeral)

A temporary data structure used during the hook's execution to aggregate failure context.

| Field           | Type       | Description                                             |
| :-------------- | :--------- | :------------------------------------------------------ |
| `tool`          | `string`   | Name of the tool (e.g., "eslint", "jest")               |
| `command`       | `string`   | The full command string executed                        |
| `exitCode`      | `number`   | The non-zero exit code returned                         |
| `rawOutput`     | `string`   | Full stdout/stderr from the tool                        |
| `errorSummary`  | `string`   | Summarized error message (Maps to Lesson.error_summary) |
| `affectedFiles` | `string[]` | List of file paths extracted via regex                  |

### 2. Lesson (Updated)

Extends the existing `Lesson` interface in `src/core/lessons/types.ts`.

| Field             | Type         | Status       | Description                                    |
| :---------------- | :----------- | :----------- | :--------------------------------------------- |
| `timestamp`       | `string`     | Required     | ISO8601 UTC                                    |
| `type`            | `LessonType` | Required     | "LINT", "TEST", "ANALYSIS", or "OTHER"         |
| `file`            | `string`     | Required     | Relative path to the primary affected file     |
| `error_summary`   | `string`     | Required     | Truncated snippet of the error (Max 500 chars) |
| `cause`           | `string`     | **Optional** | Root cause (May be empty for auto-recordings)  |
| `resolution`      | `string`     | **Optional** | Applied fix (May be empty for auto-recordings) |
| `corrective_rule` | `string`     | **Optional** | Guideline (May be empty for auto-recordings)   |
| `intent_id`       | `string`     | Required     | ID of the active intent during failure         |
| `signature`       | `string`     | Optional     | SHA-256 for de-duplication                     |

## Validation Rules

1. **Tool Whitelist**: Trigger for commands in the configurable whitelist. Default: `eslint`, `jest`, `vitest`, `npm test`, `npm run lint`.
2. **Configuration**: Whitelist should be stored in a constant or config file for easy extensibility.
3. **File Extraction**: Paths must be normalized to relative paths from the workspace root.
4. **De-duplication**: `signature` is computed as `hash(file + error_summary)`. Skip recording if signature already exists in `AGENT.md`.

## State Transitions

1. **CLI Execution Complete**: `postToolUse` triggered.
2. **Failure Detection**: Exit code > 0 and Tool in Whitelist.
3. **Context Extraction**: Regex scans output for paths and errors.
4. **Auto-Recording**: `LessonRecorder.record()` invoked with `cause`, `resolution`, `rule` as empty strings.
