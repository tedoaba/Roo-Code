import { HookEngine, ToolResult } from "../HookEngine"
import { IPostHook } from "../engine/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * General Trace Hook
 * Logs general tool execution traces to the audit ledger (T020).
 */
export class GeneralTraceHook implements IPostHook {
	id = "general-trace"

	constructor(private orchestrationService: OrchestrationService) {}

	async execute(result: ToolResult, _engine: HookEngine): Promise<void> {
		await this.orchestrationService
			.logTrace({
				trace_id: (await import("crypto")).randomUUID(),
				timestamp: new Date().toISOString(),
				actor: "roo-code-agent",
				intent_id: result.intentId || null,
				mutation_class: result.params?.mutation_class || "N/A",
				contributor: { entity_type: "AI", model_identifier: "roo-code" },
				action_type: "TOOL_EXECUTION",
				payload: {
					tool_name: result.toolName,
					tool_input: result.params,
					target_files: result.filePath ? [result.filePath] : undefined,
				},
				result: {
					status: result.success ? "SUCCESS" : "FAILURE",
					output_summary: result.output?.slice(0, 200) || "(no output)",
				},
				related: result.intentId ? [result.intentId] : [],
				summary: result.summary || `Executed tool ${result.toolName}`,
				ranges: {
					file: result.filePath || "n/a",
					content_hash: "n/a",
					start_line: 1,
					end_line: -1,
				},
				metadata: { session_id: "current" },
			})
			.catch((err) => console.error("[GeneralTraceHook] Failed to log post-tool trace:", err))
	}
}
