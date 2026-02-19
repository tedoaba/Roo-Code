/**
 * SHA-256 Content Hashing Utility Contract
 */

export interface HashingUtility {
	/**
	 * Generates a deterministic SHA-256 hex digest for the provided string content.
	 *
	 * @param content - The UTF-8 string to hash.
	 * @returns A 64-character hexadecimal string representing the SHA-256 hash.
	 *
	 * @throws {TypeError} - If content is not a string.
	 * @throws {RangeError} - If content exceeds 1GB in length.
	 *
	 * @performance - Targeted to complete in < 50ms for 1MB content.
	 * @security - Non-blocking for small inputs, local execution only, no network.
	 */
	generate_content_hash(content: string): string
}
