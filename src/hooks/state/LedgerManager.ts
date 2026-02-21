import * as fs from "fs/promises"
import * as path from "path"
import { ILedgerManager, AgentTraceEntry, Contributor } from "../contracts/AgentTrace"
import { generateFileHash } from "../../utils/crypto/hashing"

/**
 * Implementation of the append-only ledger manager.
 * Ensures mutations are recorded atomically to a JSONL file.
 * Following Invariant 3 of the System Constitution.
 */
export class LedgerManager implements ILedgerManager {
	private readonly ledgerPath: string

	constructor(ledgerPath?: string) {
		this.ledgerPath = ledgerPath || path.join(process.cwd(), ".orchestration", "agent_trace.jsonl")
	}

	/**
	 * Appends a trace entry to the ledger.
	 * Uses fs.appendFile for atomic OS-level append operations (for small writes).
	 *
	 * @param entry The trace entry to record.
	 */
	async append(entry: AgentTraceEntry): Promise<void> {
		try {
			// Ensure the target directory exists
			const dir = path.dirname(this.ledgerPath)
			await fs.mkdir(dir, { recursive: true })

			// Serialize entry to JSONL format (single line + newline)
			const line = JSON.stringify(entry) + "\n"

			// Append to file. Node.js fs.appendFile is atomic for small writes
			// below the PIPE_BUF limit (4KB), which typical trace entries are (~1KB).
			await fs.appendFile(this.ledgerPath, line, "utf8")
		} catch (error) {
			// Fail-safe: log to console if ledger write fails, but don't crash
			// the agent turn. In real scenarios, this should be handled by the HookEngine.
			console.error(`[LedgerManager] Failed to append to ledger: ${error}`)
			throw error // Re-throw so the caller (HookEngine) knows it failed
		}
	}

	/**
	 * Convenience method to create and record a mutation entry.
	 * Integrates with SHA-256 hashing.
	 */
	async recordMutation(params: {
		actor: string
		intentId: string
		mutationClass: string
		type: "write" | "delete" | "rename" | "create"
		target: string
		summary: string
		contributor?: Contributor
		metadata?: any // loosened typing here as it's just a pass-through
	}): Promise<void> {
		const { randomUUID } = await import("crypto")
		let hash = "n/a"
		if (params.type !== "delete") {
			try {
				const absPath = path.isAbsolute(params.target) ? params.target : path.join(process.cwd(), params.target)
				hash = await generateFileHash(absPath)
			} catch (error) {
				console.warn(`[LedgerManager] Could not generate hash for ${params.target}: ${error}`)
			}
		}

		const entry: AgentTraceEntry = {
			trace_id: randomUUID(),
			timestamp: new Date().toISOString(),
			mutation_class: params.mutationClass,
			intent_id: params.intentId,
			related: [params.intentId],
			ranges: {
				file: params.target,
				content_hash: hash,
				start_line: 1, // Default for full file write
				end_line: -1, // -1 denotes EOF/complete file
			},
			actor: params.actor,
			summary: params.summary,
			contributor: params.contributor,
			metadata: params.metadata,
		}

		await this.append(entry)
	}

	/**
	 * Returns the path to the ledger file.
	 */
	getLedgerPath(): string {
		return this.ledgerPath
	}
}
