import { BaseTool, ToolCallbacks } from "./BaseTool"
import { Task } from "../task/Task"
import { AgentTraceEntry } from "../../services/orchestration/types"

export class SelectActiveIntentTool extends BaseTool<"select_active_intent"> {
	readonly name = "select_active_intent" as const

	async execute(params: { intent_id: string }, task: Task, callbacks: ToolCallbacks): Promise<void> {
		const { intent_id } = params
		const { pushToolResult, handleError } = callbacks

		const service = task.orchestrationService
		if (!service) {
			await handleError("selecting intent", new Error("OrchestrationService not initialized"))
			return
		}

		try {
			const context = await service.getIntentContext(intent_id)
			if (!context) {
				const available = await service.getActiveIntents()
				const list = available.map((i) => `- ${i.name} (${i.id})`).join("\n")
				pushToolResult(`Intent '${intent_id}' not found. Available intents:\n${list}`)
				return
			}

			// Set active intent on task
			task.activeIntentId = intent_id

			// Log this selection to trace
			await service.logTrace({
				timestamp: new Date().toISOString(),
				agent_id: "roo-code-agent",
				intent_id: intent_id,
				action_type: "INTENT_SELECTION",
				payload: { tool_name: "select_active_intent", tool_input: params },
				result: { status: "SUCCESS", output_summary: `Selected intent ${intent_id}` },
				metadata: { session_id: task.taskId },
			})

			// Format enriched output
			const output = [
				`# Selected Intent: ${context.intent.name} (${context.intent.id})`,
				`> ${context.intent.description}`,
				``,
				`## Status`,
				`${context.intent.status}`,
				``,
				`## Constraints`,
				...context.intent.constraints.map((c: string) => `- ${c}`),
				``,
				`## Scope (Allowed Files)`,
				...context.intent.owned_scope.map((s: string) => `- ${s}`),
				``,
				`## Recent History`,
				...context.history
					.slice(-5)
					.map((h: AgentTraceEntry) => `- [${h.timestamp}] ${h.result.output_summary}`),
				``,
				`You are now working within this intent. Adhere strictly to the constraints and scope.`,
			].join("\n")

			pushToolResult(output)
		} catch (error) {
			await handleError("selecting intent", error as Error)
		}
	}
}

export const selectActiveIntentTool = new SelectActiveIntentTool()
