# Data Model: Agent Trace Ledger

## Entities

### TraceEntry

Represents a single mutation event in the system.

| Field             | Type     | Description                             | Validation |
| :---------------- | :------- | :-------------------------------------- | :--------- |
| `timestamp`       | `string` | ISO-8601 creation time                  | Required   |
| `agentId`         | `string` | Identifier of the acting agent          | Required   |
| `intentId`        | `string` | Foreign key to `active_intents.yaml`    | Required   |
| `mutation`        | `object` | Details of the mutation                 | Required   |
| `mutation.type`   | `string` | e.g., "write", "delete", "rename"       | Enum       |
| `mutation.target` | `string` | Relative path to the target artifact    | Required   |
| `mutation.hash`   | `string` | SHA-256 content hash of the mutation    | Required   |
| `vcsRevision`     | `string` | Git commit hash or internal revision ID | Required   |
| `metadata`        | `object` | Additional context (e.g., token usage)  | Optional   |

## State Transitions

Not applicable. Trace entries are immutable and append-only.

## Uniqueness Rules

- Each `TraceEntry` is unique by combination of `timestamp` and `intentId` for a specific mutation event. Duplicate entries per mutation are strictly prohibited (FR-005).
