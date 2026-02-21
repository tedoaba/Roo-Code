import { OrchestrationService } from "../state/OrchestrationService"
import { AgentTraceEntry } from "../contracts/AgentTrace"

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
		const constraints = (intent.constraints || []).map((c: string) => `- ${c}`).join("\n")
		const scope = (intent.owned_scope || []).map((s: string) => `- ${s}`).join("\n")
		const acceptance = (intent.acceptance_criteria || []).map((a: string) => `- ${a}`).join("\n")

		const historyText = (history || [])
			.slice(-5)
			.map((t: AgentTraceEntry) => {
				const details =
					t.action_type === "TOOL_EXECUTION" ? `${t.payload?.tool_name || "unknown tool"}` : t.action_type
				return `[${t.timestamp}] ${details}: ${t.result?.output_summary || "No summary available"}`
			})
			.join("\n")

		// T017: Load Shared Brain content
		const sharedBrain = await orchestrationService.loadSharedBrain()
		const sharedBrainSection = sharedBrain
			? `\n## Shared Brain (Project Guidelines):\n${sharedBrain.slice(0, 2000)}\n`
			: ""

		// Budget info
		const budgetSection = intent.budget
			? `\n## Budget:\n- Turns: ${intent.budget.consumed_turns || 0}/${intent.budget.max_turns || "∞"}\n- Tokens: ${intent.budget.consumed_tokens || 0}/${intent.budget.max_tokens || "∞"}\n`
			: ""

		return `
You are an **Intent-Driven Architect**.

# ACTIVE INTENT: ${intent.id}
**Goal:** ${intent.description}

## Constraints:
${constraints || "None specified."}

## Scope (Allowed files/folders):
${scope || "No scope restrictions."}

## Acceptance Criteria:
${acceptance || "None specified."}
${budgetSection}
## Recent History:
${historyText || "No history yet for this intent."}
${sharedBrainSection}
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
You are an **Intent-Driven Architect**.

# INTENT HANDSHAKE REQUIRED
You MUST select an active intent before performing any DESTRUCTIVE actions (e.g., writing files, executing system commands). 

HOWEVER, you are permitted (and encouraged) to use **SAFE** analysis tools to research the codebase and refine your understanding BEFORE selecting an intent.

Available SAFE tools during handshake:
- \`list_files\`, \`read_file\`, \`search_files\`, \`codebase_search\`
- \`ask_followup_question\`, \`select_active_intent\`

${recommendation}
## Available Intents:
${availableIntents || "No active intents available. Please ask the user to define an intent in .orchestration/active_intents.yaml"}

## Instructions:
1. Use **SAFE** tools to analyze the project if you need more context.
2. Examine the list of Available Intents and select the one that matches the task.
3. Call the \`select_active_intent\` tool with the desired \`intent_id\`.
4. If the task is purely informational (analysis only), you may complete the task without selecting an intent.
`
}
