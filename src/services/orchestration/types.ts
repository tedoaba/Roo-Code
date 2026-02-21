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
	trace_id: string
	timestamp: string
	mutation_class: string
	intent_id: string | null
	related: string[]
	ranges: {
		file: string
		content_hash: string
		start_line: number
		end_line: number
	}
	actor: string
	summary: string
	// Existing fields for orchestration
	state?: ExecutionState
	action_type?: string
	payload?: any
	result?: any
	metadata: {
		vcs_ref?: string
		session_id: string
		contributor?: string
		[key: string]: any
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
