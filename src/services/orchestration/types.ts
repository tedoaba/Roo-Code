export interface IntentBudget {
	max_turns?: number
	max_tokens?: number
	consumed_turns: number
	consumed_tokens: number
}

export interface ActiveIntent {
	id: string
	name: string
	description: string
	status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "BLOCKED"
	constraints: string[]
	owned_scope: string[]
	acceptance_criteria: string[]
	related_specs: string[]
	assigned_agent: string
	budget?: IntentBudget
	created_at: string
	updated_at: string
}

export type IntentStatus = ActiveIntent["status"]

export type ExecutionState = "REQUEST" | "REASONING" | "ACTION"

export interface AgentTraceEntry {
	timestamp: string
	agent_id: string
	intent_id: string | null
	state?: ExecutionState
	action_type:
		| "TOOL_EXECUTION"
		| "CONTEXT_LOAD"
		| "INTENT_SELECTION"
		| "SCOPE_VIOLATION"
		| "BUDGET_EXHAUSTED"
		| "STATE_TRANSITION"
		| "ERROR"
	payload: {
		tool_name?: string
		tool_input?: any
		target_files?: string[]
		command?: string
		reasoning?: string
		hash?: string
		symbols?: string[]
	}
	result: {
		status: "SUCCESS" | "FAILURE" | "DENIED"
		output_summary: string
		content_hash?: string
		error_message?: string
	}
	related?: string[]
	metadata: {
		vcs_ref?: string
		session_id: string
		contributor?: string
	}
}

export interface IntentContextBlock {
	intent: ActiveIntent
	history: AgentTraceEntry[]
	related_files: string[]
	shared_brain?: string | null
}

export interface ScopeValidationResult {
	allowed: boolean
	reason?: string
}

export type CommandClassification = "SAFE" | "DESTRUCTIVE"

export interface HookResponse {
	action: "CONTINUE" | "DENY" | "HALT"
	classification?: CommandClassification
	reason?: string
	details?: string
	recovery_hint?: string
}
