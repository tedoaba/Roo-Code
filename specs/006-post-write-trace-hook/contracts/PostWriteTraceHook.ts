export interface AgentTrace {
	/**
	 * Automatically generated unique identifier for the trace.
	 */
	id: string

	/**
	 * The timestamp of when the mutation was recorded. Epoch time.
	 */
	timestamp: number

	/**
	 * The identifier of the agent executing the mutation logic.
	 */
	agent: string

	/**
	 * The absolute path of the affected file.
	 */
	target_artifact: string

	/**
	 * Classification of the mutation intent. e.g., 'write', 'delete'.
	 */
	mutation_class: string

	/**
	 * Relation ties to upstream execution bounds.
	 */
	related: {
		type: "intent" | "request"
		id: string
	}[]

	/**
	 * SHA-256 cryptographic signature linking the mutation state deterministically.
	 */
	content_hash: string
}

/**
 * Interface mapping an internal hook dependency contract
 */
export interface IAgentTraceHook {
	/**
	 * Asynchronous executor for tracing successful write tools.
	 * @param intent_id - The user's active intent
	 * @param target_file - The mutated file
	 * @param request_id - Request origin
	 * @returns void - Failure must fail safely without throwing exceptions.
	 */
	execute(intent_id: string, target_file: string, request_id: string): Promise<void>
}
