# Internal Contracts: Concurrency Management

## TurnContext Interface

```typescript
interface ITurnContext {
	/**
	 * Record a file read event.
	 * Updates the baseline hash for the given path.
	 */
	recordRead(filePath: string, content: string): void

	/**
	 * Record a successful file write event.
	 * Updates the baseline hash to match the new content.
	 */
	recordWrite(filePath: string, content: string): void

	/**
	 * Get the stored baseline hash for a file.
	 * Returns undefined if the file has not been read/written this turn.
	 */
	getBaseline(filePath: string): string | undefined

	/**
	 * Clear all stored hashes. Called at the start of every turn.
	 */
	reset(): void
}
```

## Hook Integration Contract

```typescript
/**
 * Verification logic called by HookEngine.preToolUse before any destructive action.
 */
async function verifyOptimisticLock(
	filePath: string,
	turnContext: ITurnContext,
	hasher: (content: string) => string,
): Promise<{
	allowed: boolean
	reason?: string
	error_type?: "STALE_FILE"
	details?: any
}>
```
