import { ITurnContext } from "./types"
import { generate_content_hash } from "../../utils/hashing"

/**
 * Implementation of the transient turn-based state manager.
 */
export class TurnContext implements ITurnContext {
	private baselineHashes: Map<string, string> = new Map()

	/**
	 * Record a file read event.
	 * Updates the baseline hash for the given path.
	 */
	public recordRead(filePath: string, content: string): void {
		const hash = generate_content_hash(content)
		this.baselineHashes.set(filePath, hash)
	}

	/**
	 * Record a successful file write event.
	 * Updates the baseline hash to match the new content.
	 */
	public recordWrite(filePath: string, content: string): void {
		const hash = generate_content_hash(content)
		this.baselineHashes.set(filePath, hash)
	}

	/**
	 * Get the stored baseline hash for a file.
	 */
	public getBaseline(filePath: string): string | undefined {
		return this.baselineHashes.get(filePath)
	}

	/**
	 * Clear all stored hashes.
	 */
	public reset(): void {
		this.baselineHashes.clear()
	}
}
