import { OrchestrationService } from "../services/orchestration/OrchestrationService"
import { StateMachine } from "../core/state/StateMachine"
import { HookResponse } from "../services/orchestration/types"

/**
 * Hook Engine - The Sole Execution Gateway (T007)
 *
 * Central dispatcher for all governance checks.
 * Implements the middleware pattern for:
 *   - PreToolUse: Scope enforcement, budget checking, loop detection
 *   - PostToolUse: SHA-256 hashing, audit logging, intent_map updates
 *   - PreLLMRequest: Context compaction
 *
 * Enforces Invariant 2: All operations pass through this engine.
 */

export interface ToolRequest {
	toolName: string
	params: Record<string, any>
	intentId?: string
}

export interface ToolResult {
	toolName: string
	params: Record<string, any>
	intentId?: string
	success: boolean
	output?: string
	filePath?: string
	fileContent?: string
}

/** Tracks consecutive identical tool calls for circuit breaking */
interface ToolCallRecord {
	toolName: string
	paramsHash: string
	count: number
}

const CIRCUIT_BREAKER_THRESHOLD = 3

export class HookEngine {
	private orchestrationService: OrchestrationService
	private stateMachine: StateMachine
	private lastToolCalls: ToolCallRecord[] = []

	constructor(orchestrationService: OrchestrationService, stateMachine: StateMachine) {
		this.orchestrationService = orchestrationService
		this.stateMachine = stateMachine
	}

	/**
	 * Get the current execution state from the state machine.
	 */
	getCurrentState() {
		return this.stateMachine.getCurrentState()
	}

	/**
	 * Transition the state machine to a new state.
	 */
	async transitionTo(state: "REQUEST" | "REASONING" | "ACTION", intentId?: string) {
		return this.stateMachine.transitionTo(state, intentId)
	}

	// ── PreToolUse Hook ──

	/**
	 * Pre-tool-use validation. Returns CONTINUE to allow, DENY to block.
	 *
	 * Checks performed:
	 * 1. Fail-Safe Default (Invariant 8): Blocks all if orchestration missing
	 * 2. State-based tool filtering (Invariant 9)
	 * 3. Scope enforcement (Law 3.2.1)
	 * 4. Budget checking (Law 3.1.5)
	 * 5. Circuit breaker / loop detection (Law 4.6)
	 * 6. File ownership contention
	 */
	async preToolUse(req: ToolRequest): Promise<HookResponse> {
		// 1. Fail-Safe Default (T029): Deny all mutations if orchestration is unhealthy
		const isHealthy = await this.orchestrationService.isOrchestrationHealthy()
		if (!isHealthy) {
			// Allow select_active_intent to potentially re-initialize
			if (req.toolName === "select_active_intent") {
				return { action: "CONTINUE" }
			}
			return {
				action: "DENY",
				reason: "Fail-Safe Default: .orchestration/ directory is missing or corrupted. All mutating actions are blocked until orchestration state is restored.",
			}
		}

		// 2. State-based tool filtering
		const stateCheck = this.stateMachine.isToolAllowed(req.toolName)
		if (!stateCheck.allowed) {
			return { action: "DENY", reason: stateCheck.reason }
		}

		// select_active_intent is always allowed past this point
		if (req.toolName === "select_active_intent") {
			return { action: "CONTINUE" }
		}

		// 3. Scope enforcement for mutating tools
		if (req.intentId && this.isMutatingTool(req.toolName)) {
			const filePath = req.params.path || req.params.file_path || req.params.cwd
			if (filePath) {
				const scopeResult = await this.orchestrationService.validateScope(req.intentId, filePath)
				if (!scopeResult.allowed) {
					// Log scope violation
					await this.orchestrationService
						.logTrace({
							timestamp: new Date().toISOString(),
							agent_id: "roo-code-agent",
							intent_id: req.intentId,
							state: this.stateMachine.getCurrentState(),
							action_type: "SCOPE_VIOLATION",
							payload: {
								tool_name: req.toolName,
								target_files: [filePath],
							},
							result: {
								status: "DENIED",
								output_summary: scopeResult.reason || "Scope violation",
							},
							related: [req.intentId],
							metadata: { session_id: "current" },
						})
						.catch(() => {})

					return { action: "DENY", reason: scopeResult.reason }
				}

				// Check file ownership contention
				const owningIntent = await this.orchestrationService.checkFileOwnership(filePath, req.intentId)
				if (owningIntent) {
					return {
						action: "DENY",
						reason: `Governance Violation: File owned by Intent [${owningIntent}]. Cannot mutate files locked by another active intent.`,
					}
				}
			}
		}

		// 4. Budget checking
		if (req.intentId) {
			const budgetResult = await this.orchestrationService.updateBudget(req.intentId)
			if (!budgetResult.withinBudget) {
				await this.orchestrationService
					.logTrace({
						timestamp: new Date().toISOString(),
						agent_id: "roo-code-agent",
						intent_id: req.intentId,
						state: this.stateMachine.getCurrentState(),
						action_type: "BUDGET_EXHAUSTED",
						payload: { tool_name: req.toolName },
						result: {
							status: "DENIED",
							output_summary: budgetResult.reason || "Budget exceeded",
						},
						related: [req.intentId],
						metadata: { session_id: "current" },
					})
					.catch(() => {})

				return {
					action: "HALT",
					reason: budgetResult.reason || "Execution budget exceeded. Intent marked BLOCKED.",
				}
			}
		}

		// 5. Circuit breaker (T026): Detect identical tool call loops
		const circuitResult = this.checkCircuitBreaker(req)
		if (!circuitResult.allowed) {
			return { action: "HALT", reason: circuitResult.reason }
		}

		return { action: "CONTINUE" }
	}

	// ── PostToolUse Hook ──

	/**
	 * Post-tool-use processing.
	 *
	 * Actions performed:
	 * 1. SHA-256 content hashing for mutations (T021)
	 * 2. Audit ledger logging (T020)
	 * 3. Intent map updates (T022)
	 */
	async postToolUse(result: ToolResult): Promise<void> {
		if (!result.intentId) return

		// For file-mutating tools, compute hash and update intent map
		if (result.success && result.filePath && result.fileContent && this.isMutatingTool(result.toolName)) {
			await this.orchestrationService.logMutation(result.intentId, result.filePath, result.fileContent)
		}

		// Log general tool execution trace
		await this.orchestrationService
			.logTrace({
				timestamp: new Date().toISOString(),
				agent_id: "roo-code-agent",
				intent_id: result.intentId,
				state: this.stateMachine.getCurrentState(),
				action_type: "TOOL_EXECUTION",
				payload: {
					tool_name: result.toolName,
					tool_input: result.params,
					target_files: result.filePath ? [result.filePath] : undefined,
				},
				result: {
					status: result.success ? "SUCCESS" : "FAILURE",
					output_summary: result.output?.slice(0, 200) || "(no output)",
				},
				related: [result.intentId],
				metadata: { session_id: "current" },
			})
			.catch((err) => console.error("Failed to log post-tool trace:", err))
	}

	// ── PreLLMRequest Hook (T027) ──

	/**
	 * Context compaction before LLM request.
	 * Summarizes tool history to prevent context window exhaustion.
	 */
	async preLLMRequest(intentId: string | undefined): Promise<string | null> {
		if (!intentId) return null

		try {
			const context = await this.orchestrationService.getIntentContext(intentId)
			if (!context || context.history.length < 20) return null

			// Compact history into a summary
			const recentHistory = context.history.slice(-20)
			const summary = recentHistory
				.map(
					(h) =>
						`[${h.timestamp}] ${h.action_type}: ${h.payload.tool_name || "unknown"} → ${h.result.status}`,
				)
				.join("\n")

			return `## Context Summary (last ${recentHistory.length} actions)\n\n${summary}`
		} catch {
			return null
		}
	}

	// ── Circuit Breaker (T026) ──

	private checkCircuitBreaker(req: ToolRequest): { allowed: boolean; reason?: string } {
		const paramsHash = this.hashParams(req.params)
		const existing = this.lastToolCalls.find((r) => r.toolName === req.toolName && r.paramsHash === paramsHash)

		if (existing) {
			existing.count++
			if (existing.count >= CIRCUIT_BREAKER_THRESHOLD) {
				return {
					allowed: false,
					reason: `Circuit Breaker Tripped: Tool '${req.toolName}' called ${existing.count} times with identical parameters. Execution halted to prevent infinite loops. Intent will be marked BLOCKED.`,
				}
			}
		} else {
			// Reset tracking when a different tool/params combo is used
			this.lastToolCalls = [{ toolName: req.toolName, paramsHash, count: 1 }]
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

	private isMutatingTool(toolName: string): boolean {
		const mutatingTools = [
			"write_to_file",
			"apply_diff",
			"edit",
			"search_and_replace",
			"search_replace",
			"edit_file",
			"apply_patch",
			"execute_command",
			"delete_file",
			"new_task",
		]
		return mutatingTools.includes(toolName)
	}

	/**
	 * Reset the circuit breaker tracking.
	 */
	resetCircuitBreaker(): void {
		this.lastToolCalls = []
	}
}
