import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest } from "../HookEngine"
import { IPreHook } from "../engine/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * Budget Check Hook (Law 3.1.5)
 * Ensures execution stays within the allocated budget for the active intent.
 */
export class BudgetHook implements IPreHook {
	id = "budget"
	priority = 40

	constructor(private orchestrationService: OrchestrationService) {}

	async execute(req: ToolRequest, _engine: HookEngine): Promise<HookResponse> {
		if (req.intentId) {
			const budgetResult = await this.orchestrationService.updateBudget(req.intentId)
			if (!budgetResult.withinBudget) {
				const { randomUUID } = await import("crypto")
				await this.orchestrationService
					.logTrace({
						trace_id: randomUUID(),
						timestamp: new Date().toISOString(),
						mutation_class: "N/A",
						intent_id: req.intentId,
						related: [req.intentId],
						ranges: {
							file: "n/a",
							content_hash: "n/a",
							start_line: 0,
							end_line: 0,
						},
						actor: "roo-code-agent",
						summary: budgetResult.reason || "Budget exceeded",
						contributor: { entity_type: "AI", model_identifier: "roo-code" },
						metadata: {
							session_id: "current",
						},
						action_type: "BUDGET_EXHAUSTED",
						payload: { tool_name: req.toolName },
						result: {
							status: "DENIED",
							output_summary: budgetResult.reason || "Budget exceeded",
						},
					})
					.catch(() => {})

				return {
					action: "HALT",
					reason: "Budget Exceeded",
					details: budgetResult.reason || "Execution budget exceeded. Intent marked BLOCKED.",
					recovery_hint:
						"Select a different intent with remaining budget, or request budget expansion for this intent.",
				}
			}
		}
		return { action: "CONTINUE" }
	}
}
