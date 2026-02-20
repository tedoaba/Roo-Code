import { ExecutionState, AgentTraceEntry, COMMAND_CLASSIFICATION } from "../../services/orchestration/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * Three-State Execution Flow State Machine (T006)
 *
 * Manages the mandatory flow:
 *   State 1: REQUEST  → User prompt received
 *   State 2: REASONING → Allows analysis via SAFE tools
 *   State 3: ACTION    → Full tool access constrained by intent scope
 *
 * Enforces Invariant 9 (Three-State Execution Flow) and
 * Law 4.1 (Least Privilege).
 */
export class StateMachine {
	private currentState: ExecutionState = "REQUEST"
	private sessionId: string
	private orchestrationService: OrchestrationService

	constructor(sessionId: string, orchestrationService: OrchestrationService) {
		this.sessionId = sessionId
		this.orchestrationService = orchestrationService
	}

	/**
	 * Get the current execution state.
	 */
	getCurrentState(): ExecutionState {
		return this.currentState
	}

	/**
	 * Transition to a new state with validation and audit logging.
	 * Only allows valid transitions:
	 *   REQUEST → REASONING
	 *   REASONING → ACTION (requires valid intent)
	 *   ACTION → REQUEST (on task completion or forced reset)
	 */
	async transitionTo(newState: ExecutionState, intentId?: string): Promise<{ success: boolean; reason?: string }> {
		const validTransitions: Record<ExecutionState, ExecutionState[]> = {
			REQUEST: ["REASONING"],
			REASONING: ["ACTION", "REQUEST"],
			ACTION: ["REQUEST", "REASONING"],
		}

		const allowed = validTransitions[this.currentState]
		if (!allowed || !allowed.includes(newState)) {
			return {
				success: false,
				reason: `Invalid state transition: ${this.currentState} → ${newState}. Allowed: ${allowed?.join(", ") || "none"}`,
			}
		}

		// REASONING → ACTION requires a valid intent ID
		if (this.currentState === "REASONING" && newState === "ACTION" && !intentId) {
			return {
				success: false,
				reason: "Cannot transition to ACTION without a valid intent ID. Call select_active_intent first.",
			}
		}

		const previousState = this.currentState
		this.currentState = newState

		const { randomUUID } = await import("crypto")
		// Log the state transition
		await this.orchestrationService
			.logTrace({
				trace_id: randomUUID(),
				timestamp: new Date().toISOString(),
				mutation_class: "N/A",
				intent_id: intentId || null,
				related: intentId ? [intentId] : [],
				ranges: {
					file: "n/a",
					content_hash: "n/a",
					start_line: 0,
					end_line: 0,
				},
				actor: "roo-code-agent",
				summary: `Transitioned from ${previousState} to ${newState}`,
				state: newState,
				action_type: "STATE_TRANSITION",
				payload: {
					reasoning: `Transitioned from ${previousState} to ${newState}`,
				},
				result: {
					status: "SUCCESS",
					output_summary: `State: ${previousState} → ${newState}`,
				},
				metadata: {
					session_id: this.sessionId,
				},
			} as any)
			.catch((err) => console.error("Failed to log state transition:", err))

		return { success: true }
	}

	/**
	 * Check if a tool is allowed in the current state.
	 *
	 * Relaxed Handshake Analysis (FR-009):
	 * Allows SAFE tools (read-only) in any state to facilitate analysis.
	 * DESTRUCTIVE tools are strictly blocked in REQUEST and REASONING.
	 */
	isToolAllowed(toolName: string): { allowed: boolean; reason?: string } {
		const classification = COMMAND_CLASSIFICATION[toolName] || "DESTRUCTIVE"

		// SAFE tools are always allowed to facilitate analysis and informational tasks
		if (classification === "SAFE") {
			return { allowed: true }
		}

		switch (this.currentState) {
			case "REQUEST":
			case "REASONING":
				// Non-SAFE tools are blocked in handshake states
				return {
					allowed: false,
					reason: `State Violation: Intent Handshake required for DESTRUCTIVE actions. Call 'select_active_intent' first.`,
				}

			case "ACTION":
				// In ACTION state, all tools are allowed (scope enforcement is handled separately)
				return { allowed: true }

			default:
				return { allowed: false, reason: `Unknown state: ${this.currentState}` }
		}
	}

	/**
	 * Reset the state machine to REQUEST state (e.g., on task completion or abort).
	 */
	reset(): void {
		this.currentState = "REQUEST"
	}

	/**
	 * Enter the REASONING state when a new user request is received.
	 */
	async onUserRequest(): Promise<void> {
		if (this.currentState === "REQUEST" || this.currentState === "ACTION") {
			await this.transitionTo("REASONING")
		}
	}

	/**
	 * Transition to ACTION state after a valid intent selection.
	 */
	async onIntentSelected(intentId: string): Promise<{ success: boolean; reason?: string }> {
		if (this.currentState !== "REASONING") {
			return {
				success: false,
				reason: `Cannot select intent in state ${this.currentState}. Must be in REASONING state.`,
			}
		}
		return this.transitionTo("ACTION", intentId)
	}
}
