import { OrchestrationService } from "../services/orchestration/OrchestrationService"
import { StateMachine } from "../core/state/StateMachine"
import { HookResponse, CommandClassification } from "../services/orchestration/types"
import { TraceabilityError } from "../errors/TraceabilityError"
import { TurnContext } from "../core/concurrency/TurnContext"
import { ITurnContext } from "../core/concurrency/types"
import { executeConcurrencyHook } from "./pre/ConcurrencyHook"

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
	mutationClass?: string
	summary?: string
}

/** Tracks consecutive identical tool calls for circuit breaking */
interface ToolCallRecord {
	toolName: string
	paramsHash: string
	count: number
}

const CIRCUIT_BREAKER_THRESHOLD = 3

/**
 * Command Classification Mapping (data-model.md §3)
 * Defines which tools are DESTRUCTIVE (require approval + scope check)
 * and which are SAFE (read-only, no approval needed).
 */
export const COMMAND_CLASSIFICATION: Record<string, CommandClassification> = {
	// Destructive (file-mutating, require scope check)
	write_to_file: "DESTRUCTIVE",
	apply_diff: "DESTRUCTIVE",
	edit: "DESTRUCTIVE",
	search_and_replace: "DESTRUCTIVE",
	search_replace: "DESTRUCTIVE",
	edit_file: "DESTRUCTIVE",
	apply_patch: "DESTRUCTIVE",
	delete_file: "DESTRUCTIVE",
	// Destructive (non-file, user approval only)
	execute_command: "DESTRUCTIVE",
	new_task: "DESTRUCTIVE",
	// Safe (read-only)
	read_file: "SAFE",
	list_files: "SAFE",
	list_code_definition_names: "SAFE",
	search_files: "SAFE",
	codebase_search: "SAFE",
	ask_followup_question: "SAFE",
	select_active_intent: "SAFE",
	switch_mode: "SAFE",
	update_todo_list: "SAFE",
	read_command_output: "SAFE",
	access_mcp_resource: "SAFE",
	attempt_completion: "SAFE",
}

export class HookEngine {
	private orchestrationService: OrchestrationService
	private stateMachine: StateMachine
	private lastToolCalls: ToolCallRecord[] = []
	public readonly turnContext: ITurnContext

	constructor(orchestrationService: OrchestrationService, stateMachine: StateMachine) {
		this.orchestrationService = orchestrationService
		this.stateMachine = stateMachine
		this.turnContext = new TurnContext()
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

		// Classify the tool
		const classification = this.classifyTool(req.toolName)

		// select_active_intent is always allowed past this point
		if (req.toolName === "select_active_intent") {
			return { action: "CONTINUE", classification }
		}

		// US1/US2: Traceability Enforcement (Law 3.3.1)
		// All destructive tools MUST have a valid REQ-ID intent identifier.
		if (this.isDestructiveTool(req.toolName)) {
			if (req.intentId === undefined || req.intentId === null) {
				throw new TraceabilityError(
					`[Traceability Requirement Violation] Tool '${req.toolName}' is classified as DESTRUCTIVE and requires an active traceability identifier (intentId), but none was provided.`,
				)
			}

			// Validate REQ-ID format (US2)
			const reqIdRegex = /^REQ-[a-zA-Z0-9\-]+$/
			if (!reqIdRegex.test(req.intentId)) {
				throw new TraceabilityError(
					`[Invalid Traceability Identifier Format] The provided intentId '${req.intentId}' does not follow the required project standard (must match /^REQ-[a-zA-Z0-9\-]+$/).`,
				)
			}
		}

		// Concurrency Protection: Optimistic Locking (US1)
		const concurrencyResult = await executeConcurrencyHook(req, this)
		if (concurrencyResult.action === "DENY") {
			const { randomUUID } = await import("crypto")
			await this.orchestrationService
				.logTrace({
					trace_id: randomUUID(),
					timestamp: new Date().toISOString(),
					mutation_class: "N/A",
					intent_id: req.intentId || "N/A",
					related: req.intentId ? [req.intentId] : [],
					ranges: {
						file: req.params.path || req.params.file_path || "n/a",
						content_hash: "n/a",
						start_line: 0,
						end_line: 0,
					},
					actor: "roo-code-agent",
					summary: `Mutation Conflict for ${req.params.path || req.params.file_path}`,
					metadata: {
						session_id: "current",
					},
					action_type: "MUTATION_CONFLICT",
					payload: {
						tool_name: req.toolName,
						target_file: req.params.path || req.params.file_path,
						baseline_hash: concurrencyResult.details?.baseline_hash,
						current_hash: concurrencyResult.details?.current_disk_hash,
					},
					result: {
						status: "DENIED",
						error_type: "STALE_FILE",
						output_summary: concurrencyResult.reason,
					},
				} as any)
				.catch(() => {})

			return concurrencyResult
		}

		// 3. Scope enforcement for file-based destructive tools
		if (req.intentId && this.isFileDestructiveTool(req.toolName)) {
			const filePath = req.params.path || req.params.file_path || req.params.cwd
			if (filePath) {
				// Check .intentignore first (highest precedence)
				if (this.orchestrationService.isIntentIgnored(filePath)) {
					return {
						action: "DENY",
						classification,
						reason: `File '${filePath}' is excluded by .intentignore. This file is globally protected.`,
						details: `${req.intentId} attempted to modify a protected file.`,
						recovery_hint:
							"This file cannot be modified by any intent. Try a different file or update .intentignore.",
					}
				}

				const scopeResult = await this.orchestrationService.validateScope(req.intentId, filePath)
				const { randomUUID } = await import("crypto")
				if (!scopeResult.allowed) {
					// Log scope violation
					await this.orchestrationService
						.logTrace({
							trace_id: randomUUID(),
							timestamp: new Date().toISOString(),
							mutation_class: "N/A",
							intent_id: req.intentId,
							related: [req.intentId],
							ranges: {
								file: filePath,
								content_hash: "n/a",
								start_line: 0,
								end_line: 0,
							},
							actor: "roo-code-agent",
							summary: `Scope Violation for ${filePath}`,
							metadata: {
								session_id: "current",
							},
							action_type: "SCOPE_VIOLATION",
							payload: {
								tool_name: req.toolName,
								target_files: [filePath],
							},
							result: {
								status: "DENIED",
								output_summary: scopeResult.reason || "Scope violation",
							},
						} as any)
						.catch(() => {})

					return {
						action: "DENY",
						classification,
						reason: "Scope Violation",
						details: scopeResult.reason || "File is outside the active intent's scope.",
						recovery_hint:
							"Cite a different file within the intent's owned_scope, or use 'select_active_intent' to expand scope.",
					}
				}

				// Check file ownership contention
				const owningIntent = await this.orchestrationService.checkFileOwnership(filePath, req.intentId)
				if (owningIntent) {
					return {
						action: "DENY",
						classification,
						reason: "File Ownership Contention",
						details: `File owned by Intent [${owningIntent}]. Cannot mutate files locked by another active intent.`,
						recovery_hint:
							"Wait for the owning intent to release the file, or select the owning intent to make changes.",
					}
				}
			}
		}

		// 4. Budget checking
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
						metadata: {
							session_id: "current",
						},
						action_type: "BUDGET_EXHAUSTED",
						payload: { tool_name: req.toolName },
						result: {
							status: "DENIED",
							output_summary: budgetResult.reason || "Budget exceeded",
						},
					} as any)
					.catch(() => {})

				return {
					action: "HALT",
					classification,
					reason: "Budget Exceeded",
					details: budgetResult.reason || "Execution budget exceeded. Intent marked BLOCKED.",
					recovery_hint:
						"Select a different intent with remaining budget, or request budget expansion for this intent.",
				}
			}
		}

		// 5. Circuit breaker (T026): Detect identical tool call loops
		const circuitResult = this.checkCircuitBreaker(req)
		if (!circuitResult.allowed) {
			return {
				action: "HALT",
				classification,
				reason: "Circuit Breaker Tripped",
				details: circuitResult.reason || "Identical tool calls detected in a loop.",
				recovery_hint: "Break the loop by trying a different approach or different parameters.",
			}
		}

		return { action: "CONTINUE", classification }
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
	async postToolUse(result: ToolResult, requestId?: string): Promise<void> {
		if (!result.intentId) return

		// For file-destructive tools, compute hash and update intent map
		if (result.success && result.filePath && result.fileContent && this.isDestructiveTool(result.toolName)) {
			await this.orchestrationService.logMutation(result.intentId, result.filePath, result.fileContent)

			// US1: Update TurnContext after successful write to provide new baseline for subsequent writes
			this.turnContext.recordWrite(result.filePath, result.fileContent)
		}

		// US1: Capture baseline from read_file successful result
		if (result.success && result.toolName === "read_file" && result.filePath && result.fileContent) {
			this.turnContext.recordRead(result.filePath, result.fileContent)
		}

		// Agent Trace Hook integration (US1/US2/US3)
		if (
			result.success &&
			result.filePath &&
			(result.toolName === "write_to_file" || this.isFileDestructiveTool(result.toolName))
		) {
			try {
				const { AgentTraceHook } = await import("./post/AgentTraceHook")
				const traceHook = new AgentTraceHook()

				// Extract mutation info from tool params or result
				const mutationClass = result.mutationClass || result.params.mutation_class || "INTENT_EVOLUTION"
				const summary = result.summary || `Agent mutation via ${result.toolName}`

				// We fall back to intentId if requestId is missing as a basic mapping mechanism
				await traceHook.execute({
					intentId: result.intentId,
					filePath: result.filePath,
					requestId: requestId || result.intentId,
					mutationClass,
					summary,
				})
			} catch (err) {
				console.error("[HookEngine] Failed to execute AgentTraceHook:", err)
			}
		}

		// Log general tool execution trace
		await this.orchestrationService
			.logTrace({
				trace_id: (await import("crypto")).randomUUID(),
				timestamp: new Date().toISOString(),
				actor: "roo-code-agent",
				intent_id: result.intentId,
				mutation_class: result.params.mutation_class || "N/A",
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
				summary: result.summary || `Executed tool ${result.toolName}`,
				ranges: {
					file: result.filePath || "n/a",
					content_hash: "n/a",
					start_line: 1,
					end_line: -1,
				},
				metadata: { session_id: "current" },
			} as any) // Use any temporarily as OrchestrationService.logTrace expects old schema
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

	/**
	 * Classify a tool as SAFE or DESTRUCTIVE using the COMMAND_CLASSIFICATION map.
	 * Defaults to DESTRUCTIVE for unknown tools (Fail-Close).
	 */
	classifyTool(toolName: string): CommandClassification {
		return COMMAND_CLASSIFICATION[toolName] || "DESTRUCTIVE"
	}

	/**
	 * Check if a tool is classified as DESTRUCTIVE.
	 * Uses COMMAND_CLASSIFICATION constant from data-model.md §3.
	 */
	isDestructiveTool(toolName: string): boolean {
		return this.classifyTool(toolName) === "DESTRUCTIVE"
	}

	/**
	 * Check if a destructive tool operates on files (vs non-file like execute_command).
	 * File-based destructive tools are subject to automated scope enforcement.
	 * Non-file destructive tools only require user approval.
	 */
	isFileDestructiveTool(toolName: string): boolean {
		const nonFileDestructive = ["execute_command", "new_task"]
		return this.isDestructiveTool(toolName) && !nonFileDestructive.includes(toolName)
	}

	/**
	 * Reset the circuit breaker tracking and turn context.
	 */
	resetCircuitBreaker(): void {
		this.lastToolCalls = []
		this.turnContext.reset()
	}
}
