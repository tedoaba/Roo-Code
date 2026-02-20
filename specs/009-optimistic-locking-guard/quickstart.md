# Quickstart: Optimistic Locking Guard

## Overview

This feature prevents the agent from overwriting files that were modified externally during its turn. It uses a "read-validate-write" pattern.

## How it works

1. **Implicit Tracking**: Every time you use `read_file`, the system automatically captures a SHA-256 hash of the content.
2. **Pre-Write Validation**: When you call `write_to_file` or any file-mutating tool, the system re-reads the file from disk and compares it to your initial baseline.
3. **Conflict Resolution**: If the hashes differ, your write is blocked with a `STALE_FILE` error.

## Example Error Response

```json
{
	"action": "DENY",
	"reason": "STALE_FILE",
	"details": "File modified by another actor. Re-read required.",
	"recovery_hint": "Perform a new 'read_file' to see the latest changes before attempting to write again."
}
```

## Developer Notes

- Core logic: `src/core/concurrency/OptimisticGuard.ts`
- State: `src/core/concurrency/TurnContext.ts`
- Integration: `HookEngine.ts` via `ConcurrencyHook.ts`
- The `TurnContext` is cleared at the start of every user request turn.
