import { ToolRequest, HookEngine } from "../HookEngine"
import { HookResponse } from "../../services/orchestration/types"
import { verifyOptimisticLock } from "../../core/concurrency/OptimisticGuard"
import { generate_content_hash } from "../../utils/hashing"
import { StaleWriteError } from "../errors/StaleWriteError"

/**
 * ConcurrencyHook - Enforces optimistic locking before any mutation.
 *
 * FR-003: System MUST compare initial_content_hash with current_disk_hash before every file modification.
 *
 * When a StaleWriteError is thrown by OptimisticGuard, it is re-thrown to the caller
 * (HookEngine.preToolUse) so that HookEngine can catch it, log it, and serialize it
 * as a machine-readable JSON payload.
 */
export async function executeConcurrencyHook(req: ToolRequest, hookEngine: HookEngine): Promise<HookResponse> {
	// Only run for file-based destructive tools
	if (!hookEngine.isFileDestructiveTool(req.toolName)) {
		return { action: "CONTINUE" }
	}

	const filePath: string = req.params.path || req.params.file_path || req.params.cwd
	if (!filePath) {
		return { action: "CONTINUE" }
	}

	try {
		const result = await verifyOptimisticLock(filePath, hookEngine.turnContext, generate_content_hash)

		if (!result.allowed) {
			return {
				action: "DENY",
				reason: result.reason || "Concurrency conflict",
				error_type: result.error_type,
				details: result.details,
				recovery_hint: "Perform a new 'read_file' to see the latest changes before attempting to write again.",
			}
		}

		return { action: "CONTINUE" }
	} catch (error) {
		// Re-throw StaleWriteError to the HookEngine for structured handling
		if (error instanceof StaleWriteError) {
			throw error
		}
		// For other unexpected errors, return a generic DENY response
		return {
			action: "DENY",
			reason: `Concurrency check failed: ${error instanceof Error ? error.message : String(error)}`,
			recovery_hint: "Perform a new 'read_file' to see the latest changes before attempting to write again.",
		}
	}
}
