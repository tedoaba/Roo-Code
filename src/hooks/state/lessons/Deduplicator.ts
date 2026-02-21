import * as crypto from "node:crypto"
import * as path from "node:path"

/**
 * Handles generating signatures for failures to detect and prevent duplicate recording.
 */
export class Deduplicator {
	/**
	 * Generates a unique SHA-256 signature for a failure based on the file and error summary.
	 *
	 * @param file Relative path to the file where the failure occurred.
	 * @param errorSummary Brief description of the error (truncated to 500 characters).
	 * @returns A SHA-256 hex digest signature.
	 */
	static generateSignature(file: string, errorSummary: string): string {
		// Normalize path to ensure consistency across environments
		const normalizedPath = path.posix.normalize(file.replace(/\\/g, "/"))

		// Truncate error summary to 500 characters as per spec
		const truncatedError = errorSummary.substring(0, 500)

		// Create hash from combined data
		const input = `${normalizedPath}|${truncatedError}`
		return crypto.createHash("sha256").update(input).digest("hex")
	}

	/**
	 * Checks if a lesson is a duplicate of an existing set of signatures.
	 * (Note: Actual scanning logic will be implemented in the recorder).
	 *
	 * @param signature The signature to check.
	 * @param existingSignatures A set or array of existing signatures.
	 */
	static isDuplicate(signature: string, existingSignatures: string[] | Set<string>): boolean {
		if (existingSignatures instanceof Set) {
			return existingSignatures.has(signature)
		}
		return existingSignatures.includes(signature)
	}
}
