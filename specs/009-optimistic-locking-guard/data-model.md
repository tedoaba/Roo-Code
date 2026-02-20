# Data Model: Optimistic Locking Guard

## Entities

### TurnContext

The transient state manager for the current agent turn.

- `baselineHashes`: `Map<string, string>`
    - Key: Absolute file path
    - Value: SHA-256 hash of the content when last read or written in this turn.

### ConcurrencyHook

Middleware component integrated into `HookEngine.preToolUse`.

- `validate(ToolRequest)`:
    - If tool is `isFileDestructiveTool`:
        - Fetch stored `baselineHash` for the target path.
        - If no baseline exists, allow (assume first write or check-disabled).
        - If baseline exists, read current disk content and compute `currentHash`.
        - Compare `baselineHash` with `currentHash`.
        - If mismatch, block and return `STALE_FILE`.

## Error Schema: STALE_FILE

Returned when `baselineHash !== currentHash`.

```json
{
	"error_type": "STALE_FILE",
	"message": "File modified by another actor. Re-read required.",
	"details": {
		"path": "/src/main.ts",
		"baseline_hash": "sha256:...",
		"current_disk_hash": "sha256:..."
	}
}
```

## State Transitions

### Read Lifecycle

1. Agent calls `read_file(path)`.
2. `postToolUse` intercepts successful result.
3. `TurnContext.recordRead(path, content)`:
    - Calculate hash.
    - Store in `baselineHashes`.

### Write Lifecycle

1. Agent calls `write_to_file(path, content)`.
2. `preToolUse` intercepts request.
3. `ConcurrencyHook.validate(req)`:
    - Compare current disk hash against `TurnContext.baselineHashes[path]`.
    - Reject if mismatch.
4. If accepted:
5. `postToolUse` intercepts successful result.
6. `TurnContext.recordWrite(path, content)`:
    - Update `baselineHashes` with the _new_ content hash (becomes the new baseline for subsequent writes in the same turn).
    - Update `intent_map.md` (existing behavior).
7. Log "SUCCESS" mutation to ledger.
