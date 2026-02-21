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

	/**
	 * Clear all stored hashes. Called at the start of every turn.
	 * @deprecated Use startTurn() instead.
	 */
	reset(): void
}
