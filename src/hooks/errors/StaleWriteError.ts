/**
 * Structured error thrown when a file write is rejected due to a hash mismatch
 * between the expected (baseline) hash and the actual (current) disk hash.
 *
 * This error encapsulates all fields necessary for deterministic machine-readable
 * JSON serialization as defined in the StaleFileErrorPayload contract.
 *
 * Lifecycle:
 *   1. Constructed by OptimisticGuard when mismatch is detected.
 *   2. Caught by HookEngine, which logs the conflict to the Agent Trace Ledger.
 *   3. Serialized to pure JSON (StaleFileErrorPayload) and returned to the Agent Controller.
 */
export interface StaleFileErrorPayload {
	error_type: "STALE_FILE"
	file_path: string
	expected_hash: string
	actual_hash: string
	resolution: "RE_READ_REQUIRED"
}

export class StaleWriteError extends Error {
	public readonly error_type = "STALE_FILE" as const
	public readonly file_path: string
	public readonly expected_hash: string
	public readonly actual_hash: string
	public readonly resolution = "RE_READ_REQUIRED" as const

	constructor(filePath: string, expectedHash: string, actualHash: string) {
		super(
			`Stale write rejected for "${filePath}": expected hash "${expectedHash}" but found "${actualHash}". A re-read is required.`,
		)
		this.name = "StaleWriteError"
		this.file_path = filePath
		this.expected_hash = expectedHash
		this.actual_hash = actualHash

		// Maintains proper prototype chain for instanceof checks in TypeScript
		Object.setPrototypeOf(this, StaleWriteError.prototype)
	}

	/**
	 * Serialize this error to the canonical StaleFileErrorPayload JSON object.
	 * The resulting object strictly conforms to `contracts/stale-write-error.json`.
	 */
	toPayload(): StaleFileErrorPayload {
		return {
			error_type: this.error_type,
			file_path: this.file_path,
			expected_hash: this.expected_hash,
			actual_hash: this.actual_hash,
			resolution: this.resolution,
		}
	}
}
