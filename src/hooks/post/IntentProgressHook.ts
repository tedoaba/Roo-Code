import { ToolResult } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { AgentTraceEntry } from "../../services/orchestration/types"
import * as crypto from "crypto"

export class IntentProgressHook {
	constructor(private orchestrationService: OrchestrationService) {}

	async execute(result: ToolResult): Promise<void> {
		if (!result.intentId || !result.success) return

		try {
			const context = await this.orchestrationService.getIntentContext(result.intentId)
			if (!context || !context.intent.acceptance_criteria || context.intent.acceptance_criteria.length === 0) {
				return
			}

			if (context.intent.status === "COMPLETED") {
				return
			}

			const areMet = this.areAllCriteriaMet(context.intent.acceptance_criteria, context.history, result)

			if (areMet) {
				await this.orchestrationService.updateIntentStatus(result.intentId, "COMPLETED")

				await this.orchestrationService.logTrace({
					trace_id: crypto.randomUUID(),
					timestamp: new Date().toISOString(),
					actor: "roo-code-agent",
					intent_id: result.intentId,
					mutation_class: "INTENT_EVOLUTION",
					action_type: "INTENT_COMPLETED",
					payload: {
						tool_name: "IntentProgressHook",
						criteria_met: context.intent.acceptance_criteria,
					},
					result: { status: "SUCCESS", output_summary: "All acceptance criteria met. Intent completed." },
					related: [result.intentId],
					summary: `Automatically marked Intent ${result.intentId} as COMPLETED`,
					contributor: { entity_type: "AI", model_identifier: "roo-code" },
					metadata: { session_id: "current" },
					ranges: {
						file: "n/a",
						content_hash: "n/a",
						start_line: 0,
						end_line: 0,
					},
				})
			}
		} catch (error) {
			console.error("[IntentProgressHook] Failed to evaluate progress:", error)
		}
	}

	private areAllCriteriaMet(criteria: string[], traceEntries: AgentTraceEntry[], result: ToolResult): boolean {
		// Combine recent execution result with trace history for matching
		const contentSources = [
			result.output || "",
			result.summary || "",
			result.fileContent || "",
			...traceEntries.map((entry) => entry.result.output_summary || ""),
			...traceEntries.map((entry) => {
				const params = entry.payload?.tool_input as any
				return typeof params === "object" ? JSON.stringify(params) : String(params || "")
			}),
		]
			.join(" ")
			.toLowerCase()

		for (const criterion of criteria) {
			if (!contentSources.includes(criterion.toLowerCase())) {
				return false
			}
		}

		return true
	}
}
