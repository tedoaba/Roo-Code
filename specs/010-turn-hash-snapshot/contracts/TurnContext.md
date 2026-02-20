# API Contract: TurnContext Extensions

The following methods will be added/updated in the `ITurnContext` interface and `TurnContext` class to support the Turn Hash Snapshot functionality.

## Interface: `ITurnContext` (`src/core/concurrency/types.ts`)

```typescript
export interface ITurnContext {
	/**
	 * Initializes a new turn. Clears any existing snapshot data.
	 */
	startTurn(): void

	/**
	 * Ends the current turn. Clears snapshot data and releases resources.
	 */
	endTurn(): void

	/**
	 * Capture and retrieve the initial hash of a file for the current turn.
	 * Implements the "Compute-If-Absent" pattern for atomic concurrent access.
	 *
	 * @param filePath - Absolute path to the file.
	 * @returns Promise resolving to the SHA-256 hash or null if file is unreadable.
	 */
	get_initial_hash(filePath: string): Promise<string | null>

	// ... existing methods (recordRead, recordWrite, getBaseline, reset)
}
```

## Logic Flow: `get_initial_hash(filePath)`

1. Check internal `initialHashes` Map.
2. If path exists, return the existing `Promise`.
3. If path does NOT exist:
   a. Create a new `async` block.
   b. Read file from disk.
   c. Compute SHA-256 hash using `generate_content_hash`.
   d. Store this `Promise` in the Map.
   e. Return the `Promise`.
4. All subsequent calls for `filePath` in the same turn return the stored `Promise`.
