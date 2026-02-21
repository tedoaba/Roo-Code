/**
 * Error thrown when a destructive tool execution is blocked due to missing or invalid traceability identifiers.
 * This is used to enforce accountability invariants (e.g., Law 3.3.1) in the orchestration layer.
 */
export class TraceabilityError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "TraceabilityError"
		// Maintains proper prototype chain for instanceof checks in TypeScript
		Object.setPrototypeOf(this, TraceabilityError.prototype)
	}
}
