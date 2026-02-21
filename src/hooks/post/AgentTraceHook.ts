import { IAgentTraceHook, AgentTrace } from "../../contracts/AgentTrace"
import * as fs from "fs/promises"
import * as path from "path"
import * as crypto from "crypto"

import { generateFileHash } from "../../utils/crypto/hashing"

export class AgentTraceHook implements IAgentTraceHook {
	private ledgerPath: string = path.join(process.cwd(), ".orchestration", "agent_trace.jsonl")

	/**
	 * Asynchronous executor for tracing successful write tools.
	 * @param intent_id - The user's active intent
	 * @param target_file - The mutated file
	 * @param request_id - Request origin
	 */
	async execute(intent_id: string, target_file: string, request_id: string): Promise<void> {
		try {
			const contentHash = await generateFileHash(target_file)

			const trace: AgentTrace = {
				id: crypto.randomUUID(),
				timestamp: Date.now(),
				agent: "roo-code",
				target_artifact: target_file,
				mutation_class: "write",
				related: [
					{ type: "intent", id: intent_id },
					{ type: "request", id: request_id },
				],
				content_hash: contentHash,
			}

			// Ensure directory exists
			await fs.mkdir(path.dirname(this.ledgerPath), { recursive: true })

			// Append to ledger as JSONL
			await fs.appendFile(this.ledgerPath, JSON.stringify(trace) + "\n", "utf8")
		} catch (error) {
			// Fail silently to prevent disrupting main extension flow
			console.error("[AgentTraceHook] Failed to write trace:", error)
		}
	}
}
