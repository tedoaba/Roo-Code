import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest } from "../HookEngine"
import { IPreHook } from "../engine/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * Fail-Safe Default Hook (Invariant 8)
 * Blocks all mutating actions if orchestration state is unhealthy.
 */
export class FailSafeHook implements IPreHook {
	id = "fail-safe"
	priority = 1

	constructor(private orchestrationService: OrchestrationService) {}

	async execute(req: ToolRequest, _engine: HookEngine): Promise<HookResponse> {
		const isHealthy = await this.orchestrationService.isOrchestrationHealthy()
		if (!isHealthy) {
			// Allow select_active_intent to potentially re-initialize
			if (req.toolName === "select_active_intent") {
				return { action: "CONTINUE" }
			}
			return {
				action: "DENY",
				reason: "Fail-Safe Default: .orchestration/ directory is missing or corrupted. All mutating actions are blocked until orchestration state is restored.",
			}
		}
		return { action: "CONTINUE" }
	}
}
