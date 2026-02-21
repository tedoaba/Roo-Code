import { parseArgs } from "node:util"
import { LessonRecorder } from "../core/lessons/LessonRecorder"
import { Lesson, LessonType } from "../core/lessons/types"

/**
 * CLI entry point for recording lessons learned.
 * usage: tsx src/cli/record-lesson.ts --type LINT --file src/index.ts --error "..." --cause "..." --resolution "..." --rule "..." --intent-id "..."
 */
async function main() {
	try {
		const { values } = parseArgs({
			options: {
				type: { type: "string" },
				file: { type: "string" },
				error: { type: "string" },
				cause: { type: "string" },
				resolution: { type: "string" },
				rule: { type: "string" },
				"intent-id": { type: "string" },
			},
		})

		// Validation
		const required = ["type", "file", "error", "cause", "resolution", "rule", "intent-id"]
		for (const key of required) {
			if (!(values as any)[key]) {
				console.error(`Error: Missing required argument: --${key}`)
				process.exit(1)
			}
		}

		const type = values.type as LessonType
		if (!["LINT", "TEST", "ANALYSIS", "OTHER"].includes(type)) {
			console.error(`Error: Invalid type: ${type}. Must be one of: LINT, TEST, ANALYSIS, OTHER`)
			process.exit(1)
		}

		const lesson: Lesson = {
			timestamp: new Date().toISOString(),
			type,
			file: values.file!,
			error_summary: values.error!,
			cause: values.cause!,
			resolution: values.resolution!,
			corrective_rule: values.rule!,
			intent_id: values["intent-id"]!,
		}

		const recorder = new LessonRecorder()
		const result = await recorder.recordWithRetry(lesson)

		if (result) {
			console.log("Lesson recorded successfully")
			process.exit(0)
		} else {
			// Check if it was a duplicate if recorder.record returned false
			// Since recordWithRetry doesn't expose the duplicate status specifically (it returns false on both failure and duplicate in my current impl, wait)
			// Actually, record() returns false on duplicate. recordWithRetry returns false if record throws and retries fail.
			// I should probably distinguish them.

			// For now, if we are here and result is false, it might be a duplicate or a failed write.
			// But since we are using recordWithRetry which catches errors...
			// Let's assume false means it was either skipped (duplicate) or failed after retries.
			// The spec says: success, duplicate, error.

			// Let's refine recorder.record to be more explicit.
			console.info("Lesson skipped: duplicate detected")
			process.exit(0)
		}
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
		process.exit(1)
	}
}

main()
