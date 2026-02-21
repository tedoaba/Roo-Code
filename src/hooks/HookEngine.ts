import { OrchestrationService } from "../services/orchestration/OrchestrationService"
import { StateMachine } from "../core/state/StateMachine"
import { HookResponse, CommandClassification, COMMAND_CLASSIFICATION } from "../services/orchestration/types"
import { ITurnContext } from "../core/concurrency/types"
import { TurnContext } from "../core/concurrency/TurnContext"

import { HookRegistry } from "./engine/HookRegistry"
import { FailSafeHook } from "./pre/FailSafeHook"
import { StateCheckHook } from "./pre/StateCheckHook"
import { TraceabilityHook } from "./pre/TraceabilityHook"
import { ConcurrencyHook } from "./pre/ConcurrencyHook"
import { ScopeEnforcementHook } from "./pre/ScopeEnforcementHook"
import { BudgetHook } from "./pre/BudgetHook"
import { CircuitBreakerHook } from "./pre/CircuitBreakerHook"

import { MutationLogHook } from "./post/MutationLogHook"
import { TurnContextHook } from "./post/TurnContextHook"
import { GeneralTraceHook } from "./post/GeneralTraceHook"
import { ReadFileBaselineHook } from "./post/ReadFileBaselineHook"
import { AgentTraceHook } from "./post/AgentTraceHook"
import { VerificationFailureHook } from "./post/VerificationFailureHook"
import { IntentProgressHook } from "./post/IntentProgressHook"
import { ScopeDriftDetectionHook } from "./post/ScopeDriftDetectionHook"
import { SharedBrainHook } from "./post/SharedBrainHook"

/**
 * Hook Engine - The Sole Execution Gateway (T007)
 *
 * Orchestrates pre-tool and post-tool execution hooks through a dynamic
 * HookRegistry. This architecture follows the Open/Closed Principle,
 * allowing for modular attachment of governance, tracing, and validation
 * logic without modifying the core engine.
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

export class HookEngine {
	public readonly orchestrationService: OrchestrationService
	private stateMachine: StateMachine
	public readonly registry: HookRegistry
	public readonly circuitBreaker: CircuitBreakerHook
	public readonly turnContext: ITurnContext

	constructor(orchestrationService: OrchestrationService, stateMachine: StateMachine) {
		this.orchestrationService = orchestrationService
		this.stateMachine = stateMachine
		this.turnContext = new TurnContext()
		this.registry = new HookRegistry()

		// --- Register Pre-Hooks (Phase 3) ---
		this.registry.register("PRE", new FailSafeHook(orchestrationService))
		this.registry.register("PRE", new StateCheckHook(stateMachine))
		this.registry.register("PRE", new TraceabilityHook())
		this.registry.register("PRE", new ConcurrencyHook(orchestrationService))
		this.registry.register("PRE", new ScopeEnforcementHook(orchestrationService))
		this.registry.register("PRE", new BudgetHook(orchestrationService))

		this.circuitBreaker = new CircuitBreakerHook()
		this.registry.register("PRE", this.circuitBreaker)

		// --- Register Post-Hooks (Phase 4) ---
		this.registry.register("POST", new MutationLogHook(orchestrationService))
		this.registry.register("POST", new TurnContextHook())
		this.registry.register("POST", new GeneralTraceHook(orchestrationService))
		this.registry.register("POST", new ReadFileBaselineHook())
		this.registry.register("POST", new AgentTraceHook())
		this.registry.register("POST", new VerificationFailureHook())
		this.registry.register("POST", new IntentProgressHook(orchestrationService))
		this.registry.register("POST", new ScopeDriftDetectionHook(orchestrationService))
		this.registry.register("POST", new SharedBrainHook())
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
	 * Pre-Tool Execution Hook Gateway.
	 * Delegates validation to the HookRegistry (Law 3.1.5, 3.2.1, 4.6).
	 */
	async preToolUse(req: ToolRequest): Promise<HookResponse> {
		const classification = this.classifyTool(req.toolName)

		// select_active_intent is always allowed if health check passes
		if (req.toolName === "select_active_intent") {
			const isHealthy = await this.orchestrationService.isOrchestrationHealthy()
			if (isHealthy) {
				return { action: "CONTINUE", classification }
			}
		}

		// Delegate to registry for all other checks
		const response = await this.registry.executePre(req, this)

		// Attach classification to CONTINUE responses
		if (response.action === "CONTINUE") {
			return { ...response, classification }
		}

		return response
	}

	// ── PostToolUse Hook ──

	/**
	 * Post-Tool Execution Hook Gateway.
	 * Delegates side-effects and cleanup to the HookRegistry (Mutation logs, Tracing, Progress eval).
	 */
	async postToolUse(result: ToolResult, requestId?: string): Promise<void> {
		return this.registry.executePost(result, this, requestId)
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

	// Circuit breaker logic moved to CircuitBreakerHook (T026)

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
		this.circuitBreaker.reset()
		this.turnContext.reset()
	}
}
