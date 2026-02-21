import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest } from "../HookEngine"
import { IPreHook } from "../engine/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * Scope Enforcement Hook (Law 3.2.1)
 * Ensures file mutations stay within the active intent's scope.
 */
export class ScopeEnforcementHook implements IPreHook {
	id = "scope-enforcement"
	priority = 30

	constructor(private orchestrationService: OrchestrationService) {}

	async execute(req: ToolRequest, engine: HookEngine): Promise<HookResponse> {
		if (req.intentId && engine.isFileDestructiveTool(req.toolName)) {
			const filePath = req.params.path || req.params.file_path || req.params.cwd
			if (filePath) {
				// Check .intentignore first (highest precedence)
				if (this.orchestrationService.isIntentIgnored(filePath)) {
					return {
						action: "DENY",
						reason: `File '${filePath}' is excluded by .intentignore. This file is globally protected.`,
						details: `${req.intentId} attempted to modify a protected file.`,
						recovery_hint:
							"This file cannot be modified by any intent. Try a different file or update .intentignore.",
					}
				}

				const scopeResult = await this.orchestrationService.validateScope(req.intentId, filePath)
				const { randomUUID } = await import("crypto")
				if (!scopeResult.allowed) {
					// Log scope violation
					await this.orchestrationService
						.logTrace({
							trace_id: randomUUID(),
							timestamp: new Date().toISOString(),
							mutation_class: "N/A",
							intent_id: req.intentId,
							related: [req.intentId],
							ranges: {
								file: filePath,
								content_hash: "n/a",
								start_line: 0,
								end_line: 0,
							},
							actor: "roo-code-agent",
							summary: `Scope Violation for ${filePath}`,
							contributor: { entity_type: "AI", model_identifier: "roo-code" },
							metadata: {
								session_id: "current",
							},
							action_type: "SCOPE_VIOLATION",
							payload: {
								tool_name: req.toolName,
								target_files: [filePath],
							},
							result: {
								status: "DENIED",
								output_summary: scopeResult.reason || "Scope violation",
							},
						})
						.catch(() => {})

					return {
						action: "DENY",
						reason: "Scope Violation",
						details: scopeResult.reason || "File is outside the active intent's scope.",
						recovery_hint:
							"Cite a different file within the intent's owned_scope, or use 'select_active_intent' to expand scope.",
					}
				}

				// Check file ownership contention
				const owningIntent = await this.orchestrationService.checkFileOwnership(filePath, req.intentId)
				if (owningIntent) {
					return {
						action: "DENY",
						reason: "File Ownership Contention",
						details: `File owned by Intent [${owningIntent}]. Cannot mutate files locked by another active intent.`,
						recovery_hint:
							"Wait for the owning intent to release the file, or select the owning intent to make changes.",
					}
				}
			}
		}
		return { action: "CONTINUE" }
	}
}
