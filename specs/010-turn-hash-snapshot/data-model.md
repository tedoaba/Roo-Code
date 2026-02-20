# Data Model: Agent Turn Hash Snapshot

## Entities

### `TurnSnapshot` (In-Memory)

Represents the transient collection of file states captured during a single agent turn.

- **`entries`**: `Map<AbsolutePath, HashPromise>`
    - Key: `string` (Absolute file path)
    - Value: `Promise<string | null>` (The SHA-256 hash or null on error)
- **`lifecycle`**: `PENDING | IN_PROGRESS | COMPLETED`
    - Refined by `TurnContext` state.

### `HashEntry`

The result of a snapshot operation.

- **`filePath`**: `string` (Absolute path)
- **`hash`**: `string | null` (The SHA-256 hex string or null if unreadable)
- **`timestamp`**: `number` (When the first read occurred)

## Validation Rules

- **Uniqueness**: A file path can have exactly one entry per turn.
- **Immutability**: Once the `Promise` for a path is resolved, the resulting hash MUST NOT be modified or replaced until `reset()` or `endTurn()` is called.
- **Scope**: Keys MUST be absolute paths to prevent aliasing.

## State Transitions

1. **`UNTRACKED`**: File has not been read this turn.
2. **`SNAPSHOT_PENDING`**: First read initiated; `Promise` created and stored.
3. **`SNAPSHOTTED`**: `Promise` resolved; hash available in memory.
4. **`CLEARED`**: `endTurn()` called; all entries removed.
