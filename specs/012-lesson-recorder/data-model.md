# Data Model: Automated Lessons Learned Recorder

## Entities

### Lesson

Represents a single failure incident and its subsequent resolution.

| Field             | Type            | Description                                           | Validation                          |
| :---------------- | :-------------- | :---------------------------------------------------- | :---------------------------------- |
| `timestamp`       | UTC ISO8601     | When the failure occurred.                            | Required                            |
| `type`            | Enum            | Category of failure.                                  | `LINT`, `TEST`, `ANALYSIS`, `OTHER` |
| `file`            | String          | Relative path to the primary file involved.           | Required                            |
| `error_summary`   | String          | Concise description of the error output.              | Required; Max 500 chars             |
| `cause`           | String          | Root cause analyzed by the agent.                     | Required                            |
| `resolution`      | String          | The specific fix applied.                             | Required                            |
| `corrective_rule` | String          | General guideline for preventing recurrence.          | Required                            |
| `intent_id`       | String          | ID of the active intent during failure.               | Required                            |
| `signature`       | String (SHA256) | `hash(file + error_summary)` used for de-duplication. | Generated                           |

## Persistence

- **Target**: `AGENT.md`
- **Section**: `## Lessons Learned`
- **Storage Format**: Append-only list of Markdown blocks.

### Record Template

```markdown
- [{{timestamp}}] **Failure Type:** {{type}}
    - **File:** `{{file}}`
    - **Error Summary:** {{error_summary}}
    - **Cause:** {{cause}}
    - **Resolution:** {{resolution}}
    - **Corrective Rule:** {{corrective_rule}}
```

## State Transitions

1. **Detected**: Verification tool returns non-zero code (Agent state).
2. **Analyzed**: Agent identifies cause and fix (Agent state).
3. **Pending**: Agent prepares the `record-lesson` command.
4. **Persisted**: Tool validates signature and appends to `AGENT.md`.
5. **Deduplicated**: If signature exists, tool exits with "Duplicate detected" (no-op).
