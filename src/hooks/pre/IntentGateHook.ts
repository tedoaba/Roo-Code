import { Task } from "../core/task/Task"
import { ToolName } from "@roo-code/types"
import { OrchestrationService } from "../services/orchestration/OrchestrationService"

export class IntentGateHook {
	private orchestrationService: OrchestrationService

	constructor(orchestrationService: OrchestrationService) {
		this.orchestrationService = orchestrationService
	}

	isIntentActive(task: Task): boolean {
		return !!task.activeIntentId
	}

	async validateToolCall(task: Task, toolName: string, params: any): Promise<{ allowed: boolean; reason?: string }> {
		// select_active_intent is always allowed (it's the gate opener)
		if (toolName === "select_active_intent") {
			return { allowed: true }
		}

		// Other tools are blocked if no intent is active
		if (!this.isIntentActive(task)) {
			return {
				allowed: false,
				reason: "You MUST cite a valid active Intent ID using the 'select_active_intent' tool before performing any other actions. This is mandatory to ensure state consistency and context awareness.",
			}
		}

		// If intent is active, validate scope for file-mutating tools
		const intentId = task.activeIntentId!

		// tools that have a 'path' or 'file_path' or 'cwd'
		const filePath = params.path || params.file_path || params.cwd

		if (filePath && this.isMutatingTool(toolName)) {
			return await this.orchestrationService.validateScope(intentId, filePath)
		}

		return { allowed: true }
	}

	private isMutatingTool(toolName: string): boolean {
		const mutatingTools = [
			"write_to_file",
			"apply_diff",
			"edit",
			"search_and_replace",
			"search_replace",
			"edit_file",
			"apply_patch",
			"execute_command",
			"delete_file", // if it exists
			"new_task",
		]
		return mutatingTools.includes(toolName)
	}
}
