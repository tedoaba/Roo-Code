import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { IntentContextBlock } from "../../services/orchestration/types"

/**
 * Context Enrichment Hook (T015) — Pre-hook for intent context loading.
 *
 * Upon intent selection, enriches the agent's context window with:
 *   - Intent's owned_scope and constraints
 *   - Recent history from agent_trace.jsonl
 *   - Shared Brain (AGENT.md/CLAUDE.md) guidelines
 *
 * Implements:
 *   - FR-007: State-Aware System Prompts
 *   - US2: Context Enrichment & Shared Brain Integration
 */
export class ContextEnrichmentHook {
	private orchestrationService: OrchestrationService

	constructor(orchestrationService: OrchestrationService) {
		this.orchestrationService = orchestrationService
	}

	/**
	 * Load enriched context for a selected intent.
	 * Combines intent constraints, scope, history, and Shared Brain data.
	 */
	async enrichContext(intentId: string): Promise<IntentContextBlock | null> {
		const context = await this.orchestrationService.getIntentContext(intentId)
		if (!context) return null

		// Load Shared Brain content
		const sharedBrain = await this.orchestrationService.loadSharedBrain()
		context.shared_brain = sharedBrain

		const { randomUUID } = await import("crypto")
		// Log context enrichment to the trace
		await this.orchestrationService
			.logTrace({
				trace_id: randomUUID(),
				timestamp: new Date().toISOString(),
				actor: "roo-code-agent",
				intent_id: intentId,
				mutation_class: "N/A",
				ranges: { file: "n/a", content_hash: "n/a", start_line: 0, end_line: 0 },
				summary: `Loaded context for intent ${intentId}`,
				contributor: { entity_type: "AI", model_identifier: "roo-code" },
				state: "REASONING",
				action_type: "CONTEXT_LOAD",
				payload: {
					reasoning: "Context enrichment with intent scope, constraints, history, and Shared Brain",
				},
				result: {
					status: "SUCCESS",
					output_summary: `Loaded context for intent ${intentId}: ${context.intent.constraints.length} constraints, ${context.intent.owned_scope.length} scope patterns, ${context.history.length} history entries`,
				},
				related: [intentId],
				metadata: { session_id: "current" },
			})
			.catch(() => {})

		return context
	}

	/**
	 * Format the enriched context as a system prompt section.
	 */
	formatContextForPrompt(context: IntentContextBlock): string {
		const sections: string[] = []

		sections.push(`# Active Intent: ${context.intent.name} (${context.intent.id})`)
		sections.push(`> ${context.intent.description}`)
		sections.push("")

		sections.push("## Constraints")
		if (context.intent.constraints.length > 0) {
			context.intent.constraints.forEach((c) => sections.push(`- ${c}`))
		} else {
			sections.push("None specified.")
		}
		sections.push("")

		sections.push("## Scope (Allowed Files)")
		if (context.intent.owned_scope.length > 0) {
			context.intent.owned_scope.forEach((s) => sections.push(`- ${s}`))
		} else {
			sections.push("No scope restrictions.")
		}
		sections.push("")

		if (context.history.length > 0) {
			sections.push("## Recent History")
			context.history.slice(-5).forEach((h) => {
				sections.push(`- [${h.timestamp}] ${h.action_type}: ${h.result.output_summary}`)
			})
			sections.push("")
		}

		if (context.shared_brain) {
			sections.push("## Shared Brain (Project Guidelines)")
			sections.push(context.shared_brain.slice(0, 2000))
			sections.push("")
		}

		return sections.join("\n")
	}
}
