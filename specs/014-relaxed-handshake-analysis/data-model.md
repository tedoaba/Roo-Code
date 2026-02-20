# Data Model: Tool Classification & State Governance

## Tool Classifications

The system categorizes tools into two primary classes to govern execution during the Intent Handshake phase.

| Classification  | Description                                                                                             | Permission Level                                          |
| :-------------- | :------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------- |
| **SAFE**        | Read-only tools that do not mutate files, state, or external resources.                                 | Allowed in ALL states (`REQUEST`, `REASONING`, `ACTION`). |
| **DESTRUCTIVE** | Mutating tools or commands that can change files, delete artifacts, or execute system-level operations. | Allowed ONLY in `ACTION` state with a valid intent.       |

### Classification Mapping

| Tool Name                    | Classification |
| :--------------------------- | :------------- |
| `read_file`                  | SAFE           |
| `list_files`                 | SAFE           |
| `list_code_definition_names` | SAFE           |
| `search_files`               | SAFE           |
| `codebase_search`            | SAFE           |
| `ask_followup_question`      | SAFE           |
| `select_active_intent`       | SAFE           |
| `switch_mode`                | SAFE           |
| `update_todo_list`           | SAFE           |
| `read_command_output`        | SAFE           |
| `access_mcp_resource`        | SAFE           |
| `attempt_completion`         | SAFE           |
| `write_to_file`              | DESTRUCTIVE    |
| `apply_diff`                 | DESTRUCTIVE    |
| `edit`                       | DESTRUCTIVE    |
| `search_and_replace`         | DESTRUCTIVE    |
| `search_replace`             | DESTRUCTIVE    |
| `edit_file`                  | DESTRUCTIVE    |
| `apply_patch`                | DESTRUCTIVE    |
| `delete_file`                | DESTRUCTIVE    |
| `execute_command`            | DESTRUCTIVE    |
| `new_task`                   | DESTRUCTIVE    |

_Note: Unknown tools default to DESTRUCTIVE (Fail-Close)._

## State Governance Matrix

This table defines which tool classifications are allowed in each execution state.

| State         | SAFE Tools | DESTRUCTIVE Tools         |
| :------------ | :--------- | :------------------------ |
| **REQUEST**   | ALLOWED    | BLOCKED                   |
| **REASONING** | ALLOWED    | BLOCKED                   |
| **ACTION**    | ALLOWED    | ALLOWED (via scope check) |

### Transition Logic (StateMachine)

1. **REQUEST → REASONING**: Triggered when a user prompt is received.
2. **REASONING → ACTION**: Triggered strictly via `select_active_intent` with a valid intent ID.
3. **ACTION → REQUEST**: Triggered on task completion (`attempt_completion`) or forced reset.
4. **ACTION → REASONING**: Triggered if a new request is received while an intent is active (preserving intent context but re-evaluating reasoning).
