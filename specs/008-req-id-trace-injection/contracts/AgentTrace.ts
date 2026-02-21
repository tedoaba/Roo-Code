/**
 * Represents a single mutation record in the agent trace ledger.
 * Follows Invariant 3 of the System Constitution.
 */
export interface AgentTraceEntry {
	/** ISO-8601 timestamp of the mutation */
	timestamp: string

	/** Identity string of the agent that performed the mutation */
	agentId: string

	/** The identifier of the intent that authorized this mutation */
	intentId: string

	/** The related requirements (REQ-ID) to explicitly satisfy Law 3.3.1 */
	related: string[]

	/** Mutation details */
	mutation: {
		/** Type of operation performed (e.g., 'write', 'delete') */
		type: "write" | "delete" | "rename" | "create"
		/** Path to the file or artifact modified, relative to project root */
		target: string
		/** Cryptographic hash (SHA-256) of the resulting content */
		hash: string
	}

	/** The Git revision ID or internal system revision at the time of mutation */
	vcsRevision: string

	/** Identity of the contributor (human or system process) - Invariant 3 */
	attribution: string

	/** Optional metadata, such as tool names or execution stats */
	metadata?: Record<string, any>
}

/**
 * Service interface for managing the append-only ledger.
 */
export interface ILedgerManager {
	/**
	 * Appends a trace entry to the ledger file.
	 */
	append(entry: AgentTraceEntry): Promise<void>
}
