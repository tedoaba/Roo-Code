import { ToolResult } from "../HookEngine"
import { LessonRecorder } from "../../core/lessons/LessonRecorder"
import { Lesson } from "../../core/lessons/types"

/**
 * SharedBrainHook - User Story 3
 *
 * Records comprehensive lessons to the shared knowledge base (AGENTS.md)
 * for governance violations (DENY responses) and scope conflicts.
 *
 * This hook complements VerificationFailureHook (which handles test/lint),
 * by covering broader orchestration-level violations:
 *   - Scope Violations (file outside active intent's scope)
 *   - Stale File Errors (concurrent modification conflicts)
 *   - Budget Exceeded
 *   - Traceability Violations
 *
 * Constraints:
 *   - Must not block or crash the agent loop.
 *   - Must only execute if result.intentId exists.
 *   - Uses LessonRecorder.recordWithRetry for atomic, retry-safe appends.
 */
export class SharedBrainHook {
	private readonly lessonRecorder: LessonRecorder

	constructor(lessonRecorder?: LessonRecorder) {
		this.lessonRecorder = lessonRecorder || new LessonRecorder()
	}

	/**
	 * Executes the hook logic on a ToolResult.
	 * Only triggers for failed tool results that contain governance-related
	 * error indicators.
	 */
	async execute(result: ToolResult): Promise<void> {
		try {
			// Only process failures — successful results have no governance lesson
			if (result.success) return

			const lesson = this.synthesizeGovernanceLesson(result)
			if (!lesson) return

			await this.lessonRecorder.recordWithRetry(lesson).catch((err) => {
				console.error("[SharedBrainHook] Failed to record governance lesson:", err)
			})
		} catch (error) {
			// Graceful degradation: never crash the agent loop
			console.error("[SharedBrainHook] Internal error:", error)
		}
	}

	/**
	 * Synthesizes a Lesson from a governance-related tool failure.
	 * Returns null if the result does not match any known governance pattern.
	 */
	private synthesizeGovernanceLesson(result: ToolResult): Lesson | null {
		const output = (result.output || "").toLowerCase()

		// Pattern 1: Scope Violation
		if (output.includes("scope violation")) {
			return {
				timestamp: new Date().toISOString(),
				type: "OTHER",
				file: result.filePath || "unknown",
				error_summary: `Governance: Tool '${result.toolName}' was denied because the target file is outside the active intent scope. Ensure the file is within owned_scope before writing.`,
				cause: "Attempted to mutate a file not covered by the active intent's owned_scope.",
				corrective_rule:
					"Always verify file paths against the intent's owned_scope before mutation. Use select_active_intent to expand scope if needed.",
				intent_id: result.intentId || "N/A",
			}
		}

		// Pattern 2: Stale File / Concurrent Modification
		if (output.includes("stale_file") || output.includes("stale write")) {
			return {
				timestamp: new Date().toISOString(),
				type: "OTHER",
				file: result.filePath || "unknown",
				error_summary: `Governance: Stale write conflict on '${result.filePath || "unknown"}'. The file was modified externally since last read. Must re-read the file before retrying.`,
				cause: "File content changed between read and write (optimistic lock conflict).",
				corrective_rule:
					"Always re-read the file immediately before writing to obtain the latest hash baseline.",
				intent_id: result.intentId || "N/A",
			}
		}

		// Pattern 3: Budget Exceeded
		if (output.includes("budget exceeded") || output.includes("budget exhausted")) {
			return {
				timestamp: new Date().toISOString(),
				type: "OTHER",
				file: result.filePath || "unknown",
				error_summary: `Governance: Intent budget exhausted. The active intent has used all allocated turns or tokens.`,
				cause: "Execution exceeded the intent's budget allocation.",
				corrective_rule:
					"Break large tasks into smaller intents with focused scopes to stay within budget. Request budget expansion if the task genuinely requires more resources.",
				intent_id: result.intentId || "N/A",
			}
		}

		// Pattern 4: Traceability Violation
		if (output.includes("traceability") || output.includes("intentid")) {
			return {
				timestamp: new Date().toISOString(),
				type: "OTHER",
				file: result.filePath || "unknown",
				error_summary: `Governance: Traceability violation. A destructive tool was invoked without a valid intent identifier.`,
				cause: "Missing or malformed intentId on a destructive tool call.",
				corrective_rule: "Ensure every destructive tool call has a valid REQ-ID format intentId attached.",
				intent_id: result.intentId || "N/A",
			}
		}

		// Pattern 5: File Ownership Contention
		if (output.includes("file ownership contention") || output.includes("locked by another")) {
			return {
				timestamp: new Date().toISOString(),
				type: "OTHER",
				file: result.filePath || "unknown",
				error_summary: `Governance: File ownership contention. The target file is locked by another active intent.`,
				cause: "Attempted to mutate a file provisionally locked by a different intent.",
				corrective_rule:
					"Wait for the owning intent to release the file, or switch to the owning intent before making changes.",
				intent_id: result.intentId || "N/A",
			}
		}

		// No governance pattern matched
		return null
	}
}
