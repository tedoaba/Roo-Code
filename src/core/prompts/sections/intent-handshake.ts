import { OrchestrationService } from "../../../services/orchestration/OrchestrationService"
import { AgentTraceEntry } from "../../../services/orchestration/types"

export async function getIntentHandshakeSection(
	orchestrationService: OrchestrationService,
	activeIntentId: string | undefined,
): Promise<string> {
	if (activeIntentId) {
		const context = await orchestrationService.getIntentContext(activeIntentId)
		if (!context) {
			return `
# ACTIVE INTENT: ${activeIntentId}
WARNING: Intent details not found. Please re-select a valid intent using 'select_active_intent'.
`
		}

		const { intent, history } = context
		const constraints = intent.constraints.map((c: string) => `- ${c}`).join("\n")
		const scope = intent.owned_scope.map((s: string) => `- ${s}`).join("\n")

		const historyText = history
			.slice(-5)
			.map((t: AgentTraceEntry) => {
				const details = t.action_type === "TOOL_EXECUTION" ? `${t.payload.tool_name}` : t.action_type
				return `[${t.timestamp}] ${details}: ${t.result.output_summary}`
			})
			.join("\n")

		return `
# ACTIVE INTENT: ${intent.id}
**Goal:** ${intent.description}

## Constraints:
${constraints || "None specified."}

## Scope (Allowed files/folders):
${scope || "No scope restrictions."}

## Recent History:
${historyText || "No history yet for this intent."}

*Note: You are currently operating within this intent's checkout. All tool calls will be validated against its scope.*
`
	}

	const intents = await orchestrationService.getActiveIntents()
	const lastActiveIntentId = await orchestrationService.getLastActiveIntentId()
	const availableIntents = intents.map((i) => `- **${i.id}**: ${i.description}`).join("\n")

	const recommendation = lastActiveIntentId
		? `\n**Recommendation:** You were recently working on intent **'${lastActiveIntentId}'**. Call \`select_active_intent(intent_id='${lastActiveIntentId}')\` to resume.\n`
		: ""

	return `
# INTENT HANDSHAKE REQUIRED
You MUST select an active intent before performing any mutating actions (e.g., writing files, executing commands). 
This ensures you have the necessary context and authorization for the task.
${recommendation}
## Available Intents:
${availableIntents || "No active intents available. Please ask the user to define an intent in .orchestration/active_intents.yaml"}

## Instructions:
1. Examine the list of Available Intents.
2. Call the 'select_active_intent' tool with the desired 'intent_id'.
3. Wait for the enriched context and confirmation before proceeding with the task.
`
}
