import { ToolResult } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import * as path from "path"
import * as crypto from "crypto"

export class ScopeDriftDetectionHook {
	constructor(private orchestrationService: OrchestrationService) {}

	async execute(result: ToolResult): Promise<void> {
		if (!result.intentId || !result.success || !result.filePath) return

		// Only process file mutations
		const destructiveTools = ["write_to_file", "replace_file_content", "multi_replace_file_content"]
		if (!destructiveTools.includes(result.toolName)) return

		try {
			const context = await this.orchestrationService.getIntentContext(result.intentId)
			if (!context || !context.intent.owned_scope || context.intent.owned_scope.length === 0) return

			const mappedPaths = await this.orchestrationService.getMappedPaths()
			if (mappedPaths.length === 0) return // If nothing is mapped, everything is an expansion but we skip to avoid noise on first run

			let isExpansion = this.isScopeExpansion(result.filePath, mappedPaths)

			if (!isExpansion) return

			let isNearBoundary = this.isNearBoundary(result.filePath, mappedPaths)

			const actionType = "SCOPE_WARNING"
			const summary = isNearBoundary
				? `Boundary Warning: File ${result.filePath} is near mapped boundary.`
				: `Scope Expansion: New file ${result.filePath} modified.`

			await this.orchestrationService.logTrace({
				trace_id: crypto.randomUUID(),
				timestamp: new Date().toISOString(),
				actor: "roo-code-agent",
				intent_id: result.intentId,
				mutation_class: "OBSERVATIONAL",
				action_type: actionType,
				payload: {
					tool_name: "ScopeDriftDetectionHook",
					file: result.filePath,
					is_expansion: isExpansion,
					is_boundary_drift: isNearBoundary,
				},
				result: { status: "WARNING", output_summary: summary },
				related: [result.intentId],
				summary,
				contributor: { entity_type: "AI", model_identifier: "roo-code" },
				metadata: { session_id: "current" },
				ranges: {
					file: result.filePath,
					content_hash: "n/a",
					start_line: 0,
					end_line: 0,
				},
			})
		} catch (error) {
			console.error("[ScopeDriftDetectionHook] Failed to evaluate scope drift:", error)
		}
	}

	private isScopeExpansion(filePath: string, mappedPaths: string[]): boolean {
		const normalizedFile = path.normalize(filePath)
		for (const mapped of mappedPaths) {
			if (path.normalize(mapped) === normalizedFile) {
				return false
			}
		}
		return true
	}

	private isNearBoundary(filePath: string, mappedPaths: string[]): boolean {
		const fileDir = path.dirname(path.normalize(filePath))

		for (const mapped of mappedPaths) {
			const mappedDir = path.dirname(path.normalize(mapped))
			if (mappedDir === fileDir) {
				return true
			}
		}
		return false
	}
}
