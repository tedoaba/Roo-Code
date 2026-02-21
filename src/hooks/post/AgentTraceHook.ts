import { AgentTraceEntry } from "../../contracts/AgentTrace"
import { LedgerManager } from "../../utils/orchestration/LedgerManager"
import * as path from "path"

/**
 * Hook interface for the Agent Trace Ledger.
 */
export interface IAgentTraceHook {
	execute(intentId: string, filePath: string, requestId: string): Promise<void>
}

/**
 * Post-tool-use hook that records mutations to the audit ledger.
 * Satisfies Invariant 3 of the System Constitution.
 */
export class AgentTraceHook implements IAgentTraceHook {
	private ledgerManager: LedgerManager
	private static readonly processedEvents = new Set<string>()

	constructor(ledgerPath?: string) {
		this.ledgerManager = new LedgerManager(ledgerPath)
	}

	/**
	 * Asynchronous executor for tracing mutations.
	 *
	 * @param intentId - The user's active intent
	 * @param filePath - The mutated file
	 * @param requestId - Request origin/context
	 */
	async execute(intentId: string, filePath: string, requestId: string): Promise<void> {
		const eventKey = `${intentId}:${filePath}:${requestId}`

		if (AgentTraceHook.processedEvents.has(eventKey)) {
			console.warn(`[AgentTraceHook] Skipping duplicate trace entry for ${eventKey}`)
			return
		}

		try {
			// Record the mutation using LedgerManager's helper
			await this.ledgerManager.recordMutation({
				agentId: "roo-code",
				intentId: intentId,
				type: "write",
				target: filePath,
				vcsRevision: "main@latest",
				attribution: "agent",
				metadata: { requestId },
			})

			// Mark as processed
			AgentTraceHook.processedEvents.add(eventKey)
		} catch (error) {
			// Fail-safe: prevent disrupting the main extension execution flow
			// Consistency with HookEngine's "fail-safe" philosophy
			console.error(`[AgentTraceHook] Failed to record trace for ${filePath}:`, error)
		}
	}
}
