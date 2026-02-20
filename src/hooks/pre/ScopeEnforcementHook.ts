import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { HookResponse } from "../../services/orchestration/types"

/**
 * Scope Enforcement Hook (T018) — Pre-tool-use hook.
 *
 * Blocks mutations outside the active intent's owned_scope.
 * Also checks for file ownership contention against intent_map.md.
 *
 * Implements:
 *   - FR-005: Scope Enforcement (Law 3.2.1)
 *   - Edge Case: Scope Leakage prevention
 *   - Edge Case: Ownership Contention blocking
 */
export class ScopeEnforcementHook {
	private orchestrationService: OrchestrationService

	constructor(orchestrationService: OrchestrationService) {
		this.orchestrationService = orchestrationService
	}

	/**
	 * Validate that a file mutation is within the active intent's scope.
	 *
	 * @param intentId - The currently active intent ID
	 * @param toolName - The tool being used
	 * @param filePath - The target file path
	 * @returns HookResponse indicating whether to CONTINUE or DENY
	 */
	async validate(intentId: string, toolName: string, filePath: string): Promise<HookResponse> {
		if (!this.isMutatingTool(toolName)) {
			return { action: "CONTINUE" }
		}

		if (!filePath) {
			return { action: "CONTINUE" }
		}

		const { randomUUID } = await import("crypto")
		// Check scope
		const scopeResult = await this.orchestrationService.validateScope(intentId, filePath)
		if (!scopeResult.allowed) {
			// Log scope violation
			await this.orchestrationService
				.logTrace({
					trace_id: randomUUID(),
					timestamp: new Date().toISOString(),
					actor: "roo-code-agent",
					intent_id: intentId,
					mutation_class: "N/A",
					related: [intentId],
					ranges: { file: filePath, content_hash: "n/a", start_line: 0, end_line: 0 },
					summary: scopeResult.reason || "Scope violation",
					contributor: { entity_type: "AI", model_identifier: "roo-code" },
					state: "ACTION",
					action_type: "SCOPE_VIOLATION",
					payload: {
						tool_name: toolName,
						target_files: [filePath],
					},
					result: {
						status: "DENIED",
						output_summary: scopeResult.reason || "Scope violation",
					},
					metadata: { session_id: "current" },
				})
				.catch(() => {})

			return {
				action: "DENY",
				reason: scopeResult.reason || `File '${filePath}' is outside the active intent's scope.`,
			}
		}

		// Check ownership contention
		const owningIntent = await this.orchestrationService.checkFileOwnership(filePath, intentId)
		if (owningIntent) {
			return {
				action: "DENY",
				reason: `Governance Violation: File owned by Intent [${owningIntent}]. Cannot mutate files locked by another active intent.`,
			}
		}

		return { action: "CONTINUE" }
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
			"delete_file",
		]
		return mutatingTools.includes(toolName)
	}
}
