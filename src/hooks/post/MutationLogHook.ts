import { HookEngine, ToolResult } from "../HookEngine"
import { IPostHook } from "../engine/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * Mutation Logging Hook
 * SHA-256 hashing and intent map updates for file mutations (T021, T022).
 */
export class MutationLogHook implements IPostHook {
	id = "mutation-log"

	constructor(private orchestrationService: OrchestrationService) {}

	async execute(result: ToolResult, engine: HookEngine): Promise<void> {
		if (
			result.intentId &&
			result.success &&
			result.filePath &&
			result.fileContent &&
			engine.isDestructiveTool(result.toolName)
		) {
			await this.orchestrationService.logMutation(result.intentId, result.filePath, result.fileContent)
		}
	}
}
