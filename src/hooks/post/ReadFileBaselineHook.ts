import { HookEngine, ToolResult } from "../HookEngine"
import { IPostHook } from "../engine/types"

/**
 * Read-File Baseline Hook
 * Captures baseline from successful read_file results for optimistic locking.
 */
export class ReadFileBaselineHook implements IPostHook {
	id = "read-file-baseline"

	async execute(result: ToolResult, engine: HookEngine): Promise<void> {
		if (
			result.intentId &&
			result.success &&
			result.toolName === "read_file" &&
			result.filePath &&
			result.fileContent
		) {
			engine.turnContext.recordRead(result.filePath, result.fileContent)
		}
	}
}
