import { LedgerManager } from "../../utils/orchestration/LedgerManager"
import { HookEngine, ToolResult } from "../HookEngine"
import { IPostHook } from "../engine/types"

/**
 * Post-tool-use hook that records mutations to the audit ledger.
 * Satisfies Invariant 3 of the System Constitution.
 */
export class AgentTraceHook implements IPostHook {
	id = "agent-trace"
	private ledgerManager: LedgerManager
	private static readonly processedEvents = new Set<string>()

	constructor(ledgerPath?: string) {
		this.ledgerManager = new LedgerManager(ledgerPath)
	}

	/**
	 * Executes the hook for tool results.
	 */
	async execute(result: ToolResult, engine: HookEngine, requestId?: string): Promise<void> {
		if (
			result.success &&
			result.filePath &&
			result.intentId &&
			(result.toolName === "write_to_file" || engine.isFileDestructiveTool(result.toolName))
		) {
			const mutationClass = result.mutationClass || result.params?.mutation_class || "INTENT_EVOLUTION"
			const summary = result.summary || `Agent mutation via ${result.toolName}`

			await this.recordTrace({
				intentId: result.intentId,
				filePath: result.filePath,
				requestId: requestId || result.intentId,
				mutationClass,
				summary,
			})
		}
	}

	/**
	 * Internal executor for tracing mutations.
	 */
	private async recordTrace(params: {
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
				contributor: { entity_type: "AI", model_identifier: "roo-code" },
				metadata: { requestId },
			})

			// Mark as processed
			AgentTraceHook.processedEvents.add(eventKey)
		} catch (error) {
			console.error(`[AgentTraceHook] Failed to record trace for ${filePath}:`, error)
		}
	}
}
