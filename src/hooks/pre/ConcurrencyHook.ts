import { ToolRequest, HookEngine } from "../HookEngine"
import { HookResponse } from "../../services/orchestration/types"
import { verifyOptimisticLock } from "../../core/concurrency/OptimisticGuard"
import { generate_content_hash } from "../../utils/hashing"
import { StaleWriteError } from "../errors/StaleWriteError"
import { IPreHook } from "../engine/types"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"

/**
 * ConcurrencyHook - Enforces optimistic locking before any mutation.
 *
 * FR-003: System MUST compare initial_content_hash with current_disk_hash before every file modification.
 */
export class ConcurrencyHook implements IPreHook {
	id = "concurrency"
	priority = 20

	constructor(private orchestrationService: OrchestrationService) {}

	async execute(req: ToolRequest, engine: HookEngine): Promise<HookResponse> {
		// Only run for file-based destructive tools
		if (!engine.isFileDestructiveTool(req.toolName)) {
			return { action: "CONTINUE" }
		}

		const filePath: string = req.params.path || req.params.file_path || req.params.cwd
		if (!filePath) {
			return { action: "CONTINUE" }
		}

		try {
			const result = await verifyOptimisticLock(filePath, engine.turnContext, generate_content_hash)

			if (!result.allowed) {
				return {
					action: "DENY",
					reason: result.reason || "Concurrency conflict",
					error_type: result.error_type,
					details: result.details,
					recovery_hint:
						"Perform a new 'read_file' to see the latest changes before attempting to write again.",
				}
			}

			return { action: "CONTINUE" }
		} catch (error) {
			if (error instanceof StaleWriteError) {
				// Step 1: Log the conflict to the Agent Trace Ledger (FR-005)
				const { randomUUID } = await import("crypto")
				await this.orchestrationService
					.logTrace({
						trace_id: randomUUID(),
						timestamp: new Date().toISOString(),
						mutation_class: "STALE_FILE_CONFLICT",
						intent_id: req.intentId || "N/A",
						related: req.intentId ? [req.intentId] : [],
						ranges: {
							file: error.file_path,
							content_hash: error.actual_hash,
							start_line: 0,
							end_line: 0,
						},
						actor: "roo-code-agent",
						summary: `Stale write rejected for ${error.file_path}: expected ${error.expected_hash}, actual ${error.actual_hash}`,
						contributor: { entity_type: "AI", model_identifier: "roo-code" },
						metadata: {
							session_id: "current",
							expected_hash: error.expected_hash,
							actual_hash: error.actual_hash,
						},
						action_type: "MUTATION_CONFLICT",
						payload: {
							tool_name: req.toolName,
							target_file: error.file_path,
							baseline_hash: error.expected_hash,
							current_hash: error.actual_hash,
						},
						result: {
							status: "DENIED",
							error_type: "STALE_FILE",
							output_summary: error.message,
						},
					})
					.catch(() => {})

				// Step 2: Serialize to pure JSON StaleFileErrorPayload (FR-003/FR-004)
				const jsonPayload = JSON.stringify(error.toPayload())

				return {
					action: "DENY",
					reason: jsonPayload,
					error_type: "STALE_FILE",
					details: error.toPayload(),
					recovery_hint: "RE_READ_REQUIRED",
				}
			}
			// For other unexpected errors, return a generic DENY response
			return {
				action: "DENY",
				reason: `Concurrency check failed: ${error instanceof Error ? error.message : String(error)}`,
				recovery_hint: "Perform a new 'read_file' to see the latest changes before attempting to write again.",
			}
		}
	}
}
