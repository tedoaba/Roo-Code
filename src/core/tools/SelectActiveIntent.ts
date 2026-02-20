import { BaseTool, ToolCallbacks } from "./BaseTool"
import { Task } from "../task/Task"
import { AgentTraceEntry, ExecutionState } from "../../contracts/AgentTrace"

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
			// T013: Validate intent scope before selection
			const scopeValidation = await service.validateIntentScope(intent_id)
			if (!scopeValidation.allowed) {
				pushToolResult(
					`Intent scope validation failed: ${scopeValidation.reason}\n\nPlease select an intent with a more focused scope (max 20 files, no root-level recursive globs).`,
				)
				return
			}

			const context = await service.getIntentContext(intent_id)
			if (!context) {
				const available = await service.getActiveIntents()
				const list = available.map((i) => `- ${i.name} (${i.id})`).join("\n")
				pushToolResult(`Intent '${intent_id}' not found. Available intents:\n${list}`)
				return
			}

			// Check if intent is in a valid status
			if (context.intent.status === "COMPLETED" || context.intent.status === "ABANDONED") {
				pushToolResult(
					`Intent '${intent_id}' has status '${context.intent.status}'. Only PENDING or IN_PROGRESS intents can be selected.`,
				)
				return
			}

			if (context.intent.status === "BLOCKED") {
				pushToolResult(
					`Intent '${intent_id}' is BLOCKED. Human intervention required: manually reset the status to 'IN_PROGRESS' in .orchestration/active_intents.yaml to resume.`,
				)
				return
			}

			// Set active intent on task
			task.activeIntentId = intent_id

			const { randomUUID } = await import("crypto")
			// Log this selection to trace
			await service.logTrace({
				trace_id: randomUUID(),
				timestamp: new Date().toISOString(),
				mutation_class: "N/A",
				intent_id: intent_id,
				related: [intent_id],
				ranges: {
					file: "n/a",
					content_hash: "n/a",
					start_line: 0,
					end_line: 0,
				},
				actor: "roo-code-agent",
				summary: `Selected intent ${intent_id}`,
				contributor: { entity_type: "AI", model_identifier: "roo-code" },
				state: "REASONING",
				action_type: "INTENT_SELECTION",
				payload: { tool_name: "select_active_intent", tool_input: params },
				result: { status: "SUCCESS", output_summary: `Selected intent ${intent_id}` },
				metadata: { session_id: task.taskId },
			})

			// T017: Load Shared Brain content
			const sharedBrain = await service.loadSharedBrain()

			// Format enriched output
			const output = [
				`<intent_context>`,
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
				`## Acceptance Criteria`,
				...context.intent.acceptance_criteria.map((a: string) => `- ${a}`),
				``,
				`## Recent History`,
				...context.history
					.slice(-5)
					.map((h: AgentTraceEntry) => `- [${h.timestamp}] ${h.result.output_summary}`),
				``,
				...(sharedBrain ? [`## Shared Brain (Project Guidelines)`, sharedBrain.slice(0, 1500), ``] : []),
				`You are now working within this intent. Adhere strictly to the constraints and scope.`,
				`</intent_context>`,
			].join("\n")

			pushToolResult(output)
		} catch (error) {
			await handleError("selecting intent", error as Error)
		}
	}
}

export const selectActiveIntentTool = new SelectActiveIntentTool()
