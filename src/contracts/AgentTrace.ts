/**
 * Represents a single mutation record in the agent trace ledger.
 * Follows Invariant 3 of the System Constitution.
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

	state?: string
	action_type?: string
	payload?: any
	result?: any

	/** Optional extra metadata */
	metadata?: Record<string, any>
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
