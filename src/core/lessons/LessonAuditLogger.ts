import { LedgerManager } from "../../utils/orchestration/LedgerManager"
import { Lesson } from "./types"

/**
 * Handles recording lesson mutations to the centralized audit ledger.
 */
export class LessonAuditLogger {
	private ledgerManager: LedgerManager

	constructor() {
		this.ledgerManager = new LedgerManager()
	}

	/**
	 * Logs the recording of a new lesson to the audit trail.
	 *
	 * @param lesson The lesson being recorded.
	 * @param actor The actor performing the recording (e.g., 'lesson-recorder-cli').
	 */
	async logLessonRecorded(lesson: Lesson, actor: string = "lesson-recorder"): Promise<void> {
		await this.ledgerManager.recordMutation({
			actor,
			intentId: lesson.intent_id,
			mutationClass: "lesson_learned",
			type: "create",
			target: "AGENT.md",
			summary: `Recorded lesson learned for failure in ${lesson.file}: ${lesson.type}`,
			contributor: { entity_type: "AI", model_identifier: "roo-code" },
			metadata: {
				session_id: "current",
				failure_type: lesson.type,
				file: lesson.file,
				signature: lesson.signature,
				intent_id: lesson.intent_id,
			},
		})
	}

	/**
	 * Logs a duplicate lesson detection event.
	 */
	async logDuplicateDetected(lesson: Lesson, actor: string = "lesson-recorder"): Promise<void> {
		await this.ledgerManager.append({
			trace_id: (await import("crypto")).randomUUID(),
			timestamp: new Date().toISOString(),
			mutation_class: "lesson_learned",
			intent_id: lesson.intent_id,
			related: [lesson.intent_id],
			ranges: {
				file: "AGENT.md",
				content_hash: "n/a",
				start_line: 0,
				end_line: 0,
			},
			actor,
			summary: `Duplicate lesson detected for ${lesson.file}. No write performed.`,
			contributor: { entity_type: "AI", model_identifier: "roo-code" },
			metadata: {
				session_id: "current",
				signature: lesson.signature,
				intent_id: lesson.intent_id,
				is_duplicate: true,
			},
		})
	}
}
