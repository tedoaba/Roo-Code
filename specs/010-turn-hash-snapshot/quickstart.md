# Quickstart: Using Turn Hash Snapshot

## Developer Usage

The `TurnContext` now manages file hash snapshots automatically. To consume this in a tool or hook:

### 1. Initialize the Turn

Ensure the turn is started before any tool execution (usually handled by `HookEngine`).

```typescript
const turn = new TurnContext()
turn.startTurn()
```

### 2. Retrieve Initial Hash

When performing validation (e.g., in `OptimisticGuard`), use `get_initial_hash`.

```typescript
const initialHash = await turn.get_initial_hash(absolutePath)
if (initialHash === null) {
	// Handle file not found or permission error
}
```

### 3. Verification

Compare with the current disk state.

```typescript
const currentDiskHash = generate_content_hash(await fs.readFile(path, "utf8"))
if (initialHash !== currentDiskHash) {
	throw new Error("Stale file detected!")
}
```

### 4. End the Turn

Cleanup memory.

```typescript
turn.endTurn()
```

## Benefits

- **Atomic Concurrency**: Safe to call from multiple async hooks simultaneously.
- **Immuntability**: Guaranteed to return the same hash regardless of disk changes mid-turn.
- **Efficiency**: Disk I/O only happens on the _first_ request per file path.
