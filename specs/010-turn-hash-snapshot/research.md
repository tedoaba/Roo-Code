# Research: Agent Turn Hash Snapshot

## Phase 0: Outline & Research

### Decisions

- **Decision 1: Atomic Snapshot Pattern**

    - **Decision**: Use a "Compute-If-Absent" pattern with a `Map<string, Promise<string | null>>`.
    - **Rationale**: This handles concurrent read requests for the same file path atomically. The first request creates the promise that performs the disk read/hash; subsequent requests await the same promise. This satisfies FR-007.
    - **Alternatives considered**: Locking the entire `TurnContext` (too slow), or simple check-then-set (prone to race conditions).

- **Decision 2: Lifecycle Management**

    - **Decision**: `TurnContext` will implement explicit `startTurn()` and `endTurn()` methods.
    - **Rationale**: Aligns with the clarification that lifecycle events are explicit. `endTurn()` will clear the internal map to prevent memory leakage (SC-003).
    - **Alternatives considered**: Automatic garbage collection or timeout-based expiry (unreliable for strict turn boundaries).

- **Decision 3: Error Snapshotting**
    - **Decision**: If `fs.readFile` fails, the error/null state is snapshotted.
    - **Rationale**: Prevents expensive and inconsistent "retry" behavior mid-turn. If the file was unreadable at the start of the turn, it remains unreadable for the baseline.
    - **Alternatives considered**: Retrying on every call (violates immutability principle).

### Best Practices

- **FS Efficiency**: Use `fs.readFile` with UTF-8 encoding as the standard for hash computation in this project.
- **SHA-256 Utility**: Reuse the existing `generate_content_hash` from `src/utils/hashing.ts` to ensure algorithm consistency (Invariant 7).
- **Vitest Testing**: Use `vi.mock('fs/promises')` and `vi.advanceTimersByTime` (if applicable) to simulate disk changes and concurrent execution in tests.
