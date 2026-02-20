import { AgentTraceEntry } from "../../contracts/AgentTrace"
import { LedgerManager } from "../../utils/orchestration/LedgerManager"
import * as path from "path"

/**
 * Hook interface for the Agent Trace Ledger.
 */
export interface IAgentTraceHook {
	execute(params: {
		intentId: string
		filePath: string
		requestId: string
		mutationClass: string
		summary: string
	}): Promise<void>
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
	 */
	async execute(params: {
		intentId: string
		filePath: string
		requestId: string
		mutationClass: string
		summary: string
	}): Promise<void> {
		const { intentId, filePath, requestId, mutationClass, summary } = params
		const eventKey = `${intentId}:${filePath}:${requestId}:${mutationClass}`

		if (AgentTraceHook.processedEvents.has(eventKey)) {
			return
		}

		try {
			// Record the mutation using LedgerManager's helper
			await this.ledgerManager.recordMutation({
				actor: "roo-code",
				intentId: intentId,
				mutationClass: mutationClass,
				type: "write",
				target: filePath,
				summary: summary,
				metadata: { requestId },
			})

			// Mark as processed
			AgentTraceHook.processedEvents.add(eventKey)
		} catch (error) {
			console.error(`[AgentTraceHook] Failed to record trace for ${filePath}:`, error)
		}
	}
}
