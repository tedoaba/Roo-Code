/**
 * Tool: select_active_intent
 * Purpose: Allows the agent to declare its intent and receive enriched context.
 */
export interface SelectActiveIntentInput {
	/**
	 * The unique ID of the intent the agent is working on.
	 */
	intent_id: string
}

export interface SelectActiveIntentOutput {
	/**
	 * The enriched context block for the selected intent.
	 */
	context: IntentContextBlock
}

export interface IntentContextBlock {
	intent: {
		id: string
		name: string
		status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "BLOCKED"
		constraints: string[]
		owned_scope: string[]
		acceptance_criteria: string[]
	}
	history: AgentTraceEntry[] // Last N entries related to this intent
	related_files: string[] // Files already modified by this intent
}

export interface AgentTraceEntry {
	timestamp: string
	action: string
	summary: string
}
