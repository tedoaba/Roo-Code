import { HookEngine, ToolResult } from "../HookEngine"
import { IPostHook } from "../engine/types"

/**
 * Turn Context Update Hook
 * Updates TurnContext after successful writes to provide new baseline for subsequent writes.
 */
export class TurnContextHook implements IPostHook {
	id = "turn-context"

	async execute(result: ToolResult, engine: HookEngine): Promise<void> {
		if (
			result.intentId &&
			result.success &&
			result.filePath &&
			result.fileContent &&
			engine.isDestructiveTool(result.toolName)
		) {
			engine.turnContext.recordWrite(result.filePath, result.fileContent)
		}
	}
}
