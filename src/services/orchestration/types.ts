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

export interface HookResponse {
	action: "CONTINUE" | "DENY" | "HALT"
	classification?: CommandClassification
	reason?: string
	error_type?: string
	details?: any
	recovery_hint?: string
}
