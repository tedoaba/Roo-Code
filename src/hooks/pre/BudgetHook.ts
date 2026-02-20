import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { HookResponse } from "../../services/orchestration/types"

/**
 * Budget Hook (T025) — Pre-tool-use hook.
 *
 * Tracks turn and token consumption per intent.
 * Implements circuit breaker logic for budget exhaustion.
 *
 * Implements:
 *   - FR-011: Execution Budgets (Law 3.1.5)
 *   - FR-009: Circuit Breakers (Law 4.6)
 *   - T026: Circuit breaker trips after 3 identical tool calls
 *   - T028: Manual Reset for BLOCKED intents
 */

/** Tracks consecutive identical tool calls */
interface ToolCallRecord {
	toolName: string
	paramsKey: string
	count: number
}

const CIRCUIT_BREAKER_THRESHOLD = 3

export class BudgetHook {
	private orchestrationService: OrchestrationService
	private toolCallHistory: ToolCallRecord[] = []

	constructor(orchestrationService: OrchestrationService) {
		this.orchestrationService = orchestrationService
	}

	/**
	 * Check budget before allowing tool execution.
	 *
	 * @param intentId - The active intent ID
	 * @param toolName - The tool being invoked
	 * @param params - The tool parameters (used for loop detection)
	 */
	async checkBudget(intentId: string, toolName: string, params: Record<string, any>): Promise<HookResponse> {
		// Check if intent is BLOCKED (requires manual reset)
		const intent = await this.orchestrationService.getIntent(intentId)
		if (!intent) {
			return { action: "DENY", reason: `Intent ${intentId} not found.` }
		}

		if (intent.status === "BLOCKED") {
			return {
				action: "HALT",
				reason: `Intent '${intentId}' is BLOCKED. Human intervention required: manually reset the status to 'IN_PROGRESS' in .orchestration/active_intents.yaml to resume.`,
			}
		}

		// Check budget limits
		const budgetResult = await this.orchestrationService.updateBudget(intentId)
		if (!budgetResult.withinBudget) {
			await this.orchestrationService
				.logTrace({
					timestamp: new Date().toISOString(),
					agent_id: "roo-code-agent",
					intent_id: intentId,
					state: "ACTION",
					action_type: "BUDGET_EXHAUSTED",
					payload: { tool_name: toolName },
					result: {
						status: "DENIED",
						output_summary: budgetResult.reason || "Budget exhausted",
					},
					related: [intentId],
					metadata: { session_id: "current" },
				})
				.catch(() => {})

			return {
				action: "HALT",
				reason: budgetResult.reason || "Execution budget exceeded.",
			}
		}

		// Circuit breaker: detect identical consecutive tool calls
		const circuitResult = this.checkCircuitBreaker(toolName, params)
		if (!circuitResult.allowed) {
			return {
				action: "HALT",
				reason: circuitResult.reason || "Circuit breaker tripped.",
			}
		}

		return { action: "CONTINUE" }
	}

	/**
	 * Circuit Breaker (T026): Detects identical tool calls repeated N times.
	 */
	private checkCircuitBreaker(toolName: string, params: Record<string, any>): { allowed: boolean; reason?: string } {
		const paramsKey = this.hashParams(params)
		const existing = this.toolCallHistory.find((r) => r.toolName === toolName && r.paramsKey === paramsKey)

		if (existing) {
			existing.count++
			if (existing.count >= CIRCUIT_BREAKER_THRESHOLD) {
				return {
					allowed: false,
					reason: `Circuit Breaker Tripped: Tool '${toolName}' called ${existing.count} times with identical parameters. This looks like an infinite loop. Execution halted — intent will be marked BLOCKED. To resume, manually set the intent status to 'IN_PROGRESS' in active_intents.yaml.`,
				}
			}
		} else {
			// Different tool/params: reset tracking
			this.toolCallHistory = [{ toolName, paramsKey, count: 1 }]
		}

		return { allowed: true }
	}

	private hashParams(params: any): string {
		try {
			return JSON.stringify(params)
		} catch {
			return ""
		}
	}

	/**
	 * Reset the circuit breaker tracking.
	 */
	reset(): void {
		this.toolCallHistory = []
	}
}
