import { ITurnContext } from "./types"
import { generate_content_hash } from "../../utils/hashing"
import * as fs from "fs/promises"

/**
 * Implementation of the transient turn-based state manager.
 */
export class TurnContext implements ITurnContext {
	private baselineHashes: Map<string, string> = new Map()
	private initialHashes: Map<string, Promise<string | null>> = new Map()

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
	 * Initializes a new turn. Clears any existing snapshot data.
	 */
	public startTurn(): void {
		this.reset()
	}

	/**
	 * Ends the current turn. Clears snapshot data and releases resources.
	 */
	public endTurn(): void {
		this.reset()
	}

	/**
	 * Capture and retrieve the initial hash of a file for the current turn.
	 * Implements the "Compute-If-Absent" pattern for atomic concurrent access.
	 */
	public async get_initial_hash(filePath: string): Promise<string | null> {
		const existingPromise = this.initialHashes.get(filePath)
		if (existingPromise) {
			return existingPromise
		}

		const promise = (async () => {
			try {
				const content = await fs.readFile(filePath, "utf8")
				return generate_content_hash(content)
			} catch (error) {
				return null
			}
		})()

		this.initialHashes.set(filePath, promise)
		return promise
	}

	/**
	 * Clear all stored hashes.
	 */
	public reset(): void {
		this.baselineHashes.clear()
		this.initialHashes.clear()
	}
}
