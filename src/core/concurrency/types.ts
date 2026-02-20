/**
 * Result of an optimistic lock verification check.
 */
export interface OptimisticLockResult {
	allowed: boolean
	reason?: string
	error_type?: "STALE_FILE"
	details?: {
		path: string
		baseline_hash: string
		current_disk_hash: string
	}
}

/**
 * Interface for the transient turn-based state manager.
 */
export interface ITurnContext {
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
