/**
 * Execution state for the Three-State Flow (Invariant 9).
 * Moved to contracts to avoid circular dependency.
 */
export type ExecutionState = "REQUEST" | "REASONING" | "ACTION"

/**
 * Structured contributor attribution for trace entries.
 * Satisfies Invariant 3's contributor attribution requirement.
 */
export interface Contributor {
	/** Whether this action was performed by an AI agent or a human. */
	entity_type: "AI" | "HUMAN"
	/** Model identifier when entity_type is "AI" (e.g., "claude-3-5-sonnet"). */
	model_identifier?: string
}

/**
 * Represents a single mutation record in the agent trace ledger.
 * Follows Invariant 3 of the System Constitution.
 *
 * This is the CANONICAL definition. All code MUST import from this file.
 * Do NOT define AgentTraceEntry elsewhere.
 */
export interface AgentTraceEntry {
	trace_id: string
	timestamp: string
	mutation_class: string
	intent_id: string | null
	related: string[]

	/** Spatial hashing and range data */
	ranges: {
		/** Path to the file modified, relative to project root */
		file: string
		/** Cryptographic hash (SHA-256) of the resulting content */
		content_hash: string
		/** Starting line of change (1-indexed) */
		start_line: number
		/** Ending line of change (inclusive) */
		end_line: number
	}

	/** Identity of the contributor (human or system process) */
	actor: string

	/** Brief summary of the change */
	summary: string

	/**
	 * Structured contributor attribution (NEW).
	 * Identifies whether the change was made by AI (with model identifier) or human.
	 * Optional for backward compatibility with legacy entries.
	 */
	contributor?: Contributor

	/** Execution state at time of event */
	state?: ExecutionState
	action_type?: string
	payload?: any
	result?: any

	/**
	 * Optional metadata. When present, session_id is required.
	 * NOTE: metadata.contributor (string) is DEPRECATED.
	 * Use the top-level contributor object instead.
	 */
	metadata?: {
		session_id: string
		vcs_ref?: string
		[key: string]: any
	}
}

/**
 * Service interface for managing the append-only ledger.
 *
 * SECURITY NOTE: Implementations MUST ONLY be invoked by the Hook Engine
 * to satisfy Invariant 4 (Single Source of Orchestration Truth).
 */
export interface ILedgerManager {
	/**
	 * Appends a trace entry to the ledger file.
	 * MUST ensure atomicity and MUST NOT overwrite existing entries.
	 */
	append(entry: AgentTraceEntry): Promise<void>
}
