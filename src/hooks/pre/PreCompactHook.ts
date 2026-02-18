import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * PreCompact Hook (T027) — Pre-LLM request hook.
 *
 * Summarizes tool history before LLM requests to prevent
 * context window overflow ("Context Rot").
 *
 * Implements:
 *   - FR-008: Context Compaction (Law 3.1.6)
 *   - Prevents context limit exhaustion by summarizing trace data
 */
export class PreCompactHook {
	private orchestrationService: OrchestrationService
	private readonly maxHistoryBeforeCompaction = 20

	constructor(orchestrationService: OrchestrationService) {
		this.orchestrationService = orchestrationService
	}

	/**
	 * Check if compaction is needed and return a summary if so.
	 *
	 * @param intentId - The active intent ID
	 * @returns A compacted summary string, or null if compaction is not needed
	 */
	async compact(intentId: string): Promise<string | null> {
		try {
			const context = await this.orchestrationService.getIntentContext(intentId)
			if (!context || context.history.length < this.maxHistoryBeforeCompaction) {
				return null
			}

			// Summarize the history
			const recentHistory = context.history.slice(-this.maxHistoryBeforeCompaction)

			const toolCounts = new Map<string, number>()
			const filesMutated = new Set<string>()
			let successCount = 0
			let failureCount = 0

			for (const entry of recentHistory) {
				const toolName = entry.payload.tool_name || "unknown"
				toolCounts.set(toolName, (toolCounts.get(toolName) || 0) + 1)

				if (entry.payload.target_files) {
					entry.payload.target_files.forEach((f) => filesMutated.add(f))
				}

				if (entry.result.status === "SUCCESS") successCount++
				if (entry.result.status === "FAILURE") failureCount++
			}

			const toolSummary = Array.from(toolCounts.entries())
				.map(([tool, count]) => `  - ${tool}: ${count} calls`)
				.join("\n")

			const summary = [
				`## Context Compaction Summary`,
				``,
				`**Intent**: ${context.intent.name} (${context.intent.id})`,
				`**Last ${recentHistory.length} actions**:`,
				`- Successes: ${successCount}`,
				`- Failures: ${failureCount}`,
				``,
				`**Tool Usage:**`,
				toolSummary,
				``,
				`**Files Touched:** ${filesMutated.size > 0 ? Array.from(filesMutated).join(", ") : "none"}`,
				``,
				`*This summary replaces detailed history to conserve context window space.*`,
			].join("\n")

			return summary
		} catch {
			return null
		}
	}
}
