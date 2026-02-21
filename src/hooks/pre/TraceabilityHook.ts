import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest } from "../HookEngine"
import { IPreHook } from "../engine/types"
import { TraceabilityError } from "../../errors/TraceabilityError"

/**
 * Traceability Enforcement Hook (Law 3.3.1).
 * Ensures all destructive tools have a valid REQ-ID intent identifier.
 */
export class TraceabilityHook implements IPreHook {
	id = "traceability"
	priority = 10

	async execute(req: ToolRequest, engine: HookEngine): Promise<HookResponse> {
		if (engine.isDestructiveTool(req.toolName)) {
			if (req.intentId === undefined || req.intentId === null) {
				throw new TraceabilityError(
					`[Traceability Requirement Violation] Tool '${req.toolName}' is classified as DESTRUCTIVE and requires an active traceability identifier (intentId), but none was provided.`,
				)
			}

			// Validate REQ-ID format (US2)
			const reqIdRegex = /^REQ-[a-zA-Z0-9\-]+$/
			if (!reqIdRegex.test(req.intentId)) {
				throw new TraceabilityError(
					`[Invalid Traceability Identifier Format] The provided intentId '${req.intentId}' does not follow the required project standard (must match /^REQ-[a-zA-Z0-9\-]+$/).`,
				)
			}
		}
		return { action: "CONTINUE" }
	}
}
