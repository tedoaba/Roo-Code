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
	created_at: string
	updated_at: string
}

export type IntentStatus = ActiveIntent["status"]

export interface AgentTraceEntry {
	timestamp: string
	agent_id: string
	intent_id: string | null
	action_type: "TOOL_EXECUTION" | "CONTEXT_LOAD" | "INTENT_SELECTION" | "SCOPE_VIOLATION" | "ERROR"
	payload: {
		tool_name?: string
		tool_input?: any
		target_files?: string[]
		command?: string
	}
	result: {
		status: "SUCCESS" | "FAILURE" | "DENIED"
		output_summary: string
		content_hash?: string
		error_message?: string
	}
	metadata: {
		vcs_ref?: string
		session_id: string
	}
}

export interface IntentContextBlock {
	intent: ActiveIntent
	history: AgentTraceEntry[]
	related_files: string[]
}

export interface ScopeValidationResult {
	allowed: boolean
	reason?: string
}
