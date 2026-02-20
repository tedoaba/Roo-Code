# Data Model: Stale File Error Protocol

## Entities

### `StaleFileErrorPayload`

Represents the strict JSON-encoded payload output to the Agent Controller when a file write is rejected.

| Field           | Type     | Description                                                       |
| --------------- | -------- | ----------------------------------------------------------------- |
| `error_type`    | `string` | **Must be exact constant:** `"STALE_FILE"`                        |
| `file_path`     | `string` | The absolute path of the file that suffered the conflict.         |
| `expected_hash` | `string` | The hash value the agent expected to overwrite.                   |
| `actual_hash`   | `string` | The current real hash value of the file on disk (or `"DELETED"`). |
| `resolution`    | `string` | **Must be exact constant:** `"RE_READ_REQUIRED"`                  |

### `AgentTraceEntry` (Log extension)

Refining the existing `AgentTraceEntry` to legally support the logging of rejected mutations.

| Field                    | Type     | Description                                                                        |
| ------------------------ | -------- | ---------------------------------------------------------------------------------- |
| `action`                 | `string` | E.g., `"write_to_file_rejected"` or `"replace_file_content_rejected"`              |
| `status`                 | `string` | Represented as `"BLOCKED"` or `"REJECTED"` under our execution state schema.       |
| `metadata.expected_hash` | `string` | Embedded in the metadata.                                                          |
| `metadata.actual_hash`   | `string` | Embedded in the metadata.                                                          |
| `content_hash`           | `string` | The hash it attempted to write, or `null`/`none` if stopped prior to hash capture. |

## Lifecycle Variations

1. **Detection**: `OptimisticGuard` identifies mismatch.
2. **Construction**: Instantiates `StaleWriteError`.
3. **Logging**: `HookEngine` catches it, records the conflict trace to `LedgerManager`.
4. **Serialization**: `HookEngine` yields the pure `StaleFileErrorPayload` stringified representation back to the Controller tool-call response.
5. **Recovery**: The Controller parses `"RE_READ_REQUIRED"` and executes a `view_file` command.
