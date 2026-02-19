# Data Model: Post-Write Trace Hook

## Core Entities

### 1. `TraceObject`

This is the root schema injected into the `agent_trace.jsonl` audit log. It represents a single mutation action linked to a cryptographic content structure.

**Fields**:

- `id` (String): A globally unique identifier for the trace event (UUID).
- `timestamp` (Number): Epoch timestamp of the mutation.
- `agent` (String): The acting agent executing the mutation.
- `target_artifact` (String): The absolute file path of the mutation target.
- `mutation_class` (String): The category of mutation (e.g., `write`, `delete`, `rename`).
- `related` (Array of RelationalObjects): Array of connections tying the trace back to causal intents and requests.
- `content_hash` (String): The SHA-256 cryptographic signature of the file post-mutation.

### 2. `RelationalObject` (Nested within `related`)

Links the independent trace back to external factors.

**Fields**:

- `type` (Enum): e.g., `"intent"`, `"request"`.
- `id` (String): e.g., `intent_id` (the intent currently registered during the reasoning cycle), `request_id` (the unique identifier for the user prompt iteration).

### 3. `RangesMapping` (Nested within TraceObject / Optional based on schema evolution)

Links the hash of specific code blocks. In this specific scope, the `content_hash` refers to the entire file artifact length unless differential hunk logging is explicitly supported.

**State Transitions**:

- Traces are append-only. They are instantiated after a success event and can never be modified. They only transition from transient memory to a permanent serialized disk state inside the `.orchestration/agent_trace.jsonl` ledger.
