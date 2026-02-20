import * as fs from "fs/promises"
import { ITurnContext, OptimisticLockResult } from "./types"
import { StaleWriteError } from "../../hooks/errors/StaleWriteError"

/**
 * Verification logic called by HookEngine.preToolUse before any destructive action.
 *
 * FR-004: Block the write execution if initial_content_hash does not match current_disk_hash.
 *
 * On hash mismatch (or concurrent deletion), this function THROWS a StaleWriteError
 * instead of returning a result object. This enables the HookEngine to catch the
 * structured error, log the conflict to the Agent Trace Ledger, and serialize
 * it as a pure JSON StaleFileErrorPayload to the Agent Controller.
 */
export async function verifyOptimisticLock(
	filePath: string,
	turnContext: ITurnContext,
	hasher: (content: string) => string,
): Promise<OptimisticLockResult> {
	const baselineHash = turnContext.getBaseline(filePath)

	// FR-001/Assumption: If no baseline exists, we don't have a read to compare against.
	// We allow the write in this case (either first-ever write or optimistic locking is not being used for this file yet).
	if (!baselineHash) {
		return { allowed: true }
	}

	let currentContent: string
	try {
		currentContent = await fs.readFile(filePath, "utf8")
	} catch (error: any) {
		// Edge Case: File Deletion.
		// If a file is deleted after the agent reads it but before it writes, it's a conflict.
		if (error.code === "ENOENT") {
			throw new StaleWriteError(filePath, baselineHash, "DELETED")
		}
		// Other filesystem errors (permission, etc.) — we cannot verify, so we should stay safe.
		return {
			allowed: false,
			reason: `Filesystem error during verification: ${error.message}`,
		}
	}

	const currentDiskHash = hasher(currentContent)

	if (baselineHash !== currentDiskHash) {
		throw new StaleWriteError(filePath, baselineHash, currentDiskHash)
	}

	return { allowed: true }
}
