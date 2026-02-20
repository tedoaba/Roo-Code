# Research: Optimistic Locking Guard

## Decision: Hook Engine Integration Point

- **Decision**: Integrate optimistic locking verification into `HookEngine.preToolUse`.
- **Rationale**: `HookEngine` is the mandated governance gateway (Invariant 2). `preToolUse` is the correct phase to block actions before they reach the tool executor. It already has access to `req.params` (containing file paths) and the active `intentId`.
- **Alternatives Considered**:
    - Individual tool wrappers: Rejected as it bypasses central governance and increases maintenance debt.
    - `OrchestrationService` internal checks: Rejected as the service should manage state, while the `HookEngine` manages policy enforcement.

## Decision: Baseline Hash Tracking

- **Decision**: Capture baseline hashes from `read_file` success results in `HookEngine.postToolUse`.
- **Rationale**: When an agent reads a file, the system must record that state as the "baseline". Since `read_file` is classified as `SAFE`, it passes through `postToolUse` where the resulting content is available for hashing and storage in the `TurnContext`.
- **Alternatives Considered**:
    - Hashing in `preToolUse` of `read_file`: Rejected because the file content isn't available until _after_ the tool executes.
    - Manual agent reporting: Rejected as it's not enforceable and prone to agent error/omission.

## Decision: Turn Context Lifecycle

- **Decision**: Use a singleton-managed in-memory `Map<filePath, sha256>` for the duration of the agent's turn.
- **Rationale**: Optimistic locking only needs to span the "read-modify-write" cycle of a single turn. In-memory storage provides the lowest latency and zero persistence overhead.
- **Alternatives Considered**:
    - `intent_map.md`: Rejected. The intent map tracks the _last known good mutation_, but optimistic locking requires the _baseline read_ of the current turn, which might differ if an external editor modified the file between turns.
    - Persistent KV store: Rejected as unnecessary for transient turn-based state.

## Decision: Conflict Ledger Entry

- **Decision**: Log conflicts using `action_type: "MUTATION_CONFLICT"`.
- **Rationale**: Distinguishing conflicts from scope violations or budget exhaustion in the ledger is critical for auditability and debugging high-concurrency environments.
- **Schema**:
    ```json
    {
    	"action_type": "MUTATION_CONFLICT",
    	"payload": {
    		"tool_name": "write_to_file",
    		"target_file": "src/app.ts",
    		"baseline_hash": "sha256:abc...",
    		"current_hash": "sha256:xyz..."
    	},
    	"result": {
    		"status": "DENIED",
    		"error_type": "STALE_FILE"
    	}
    }
    ```
