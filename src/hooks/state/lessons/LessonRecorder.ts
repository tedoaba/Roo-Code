import * as fs from "node:fs/promises"
import { existsSync } from "node:fs"
import * as path from "node:path"
import { Lesson } from "./types"
import { LockManager } from "./LockManager"
import { Deduplicator } from "./Deduplicator"
import { LessonAuditLogger } from "./LessonAuditLogger"

/**
 * Handles recording lessons to AGENT.md with atomicity and de-duplication.
 */
export class LessonRecorder {
	private readonly agentMdPath: string
	private readonly auditLogger: LessonAuditLogger
	private readonly SECTION_HEADER = "## Lessons Learned"

	constructor(agentMdPath?: string) {
		this.agentMdPath = agentMdPath || process.env.AGENT_MD_PATH || path.join(process.cwd(), "AGENT.md")
		this.auditLogger = new LessonAuditLogger()
	}

	/**
	 * Records a lesson to the ledger.
	 *
	 * @param lesson The lesson to record.
	 * @returns Promise that resolves to true if recorded, false if it was a duplicate.
	 */
	async record(lesson: Lesson): Promise<boolean> {
		// 1. Generate signature and truncate error summary
		lesson.error_summary = this.truncateErrorSummary(lesson.error_summary)
		lesson.signature = Deduplicator.generateSignature(lesson.file, lesson.error_summary)

		return await LockManager.withLock(this.agentMdPath, async () => {
			// 2. Check for duplicates
			const content = await this.ensureFileAndSection()
			if (this.isDuplicate(content, lesson.signature!)) {
				await this.auditLogger.logDuplicateDetected(lesson)
				return false
			}

			// 3. Format and append
			const formattedLesson = this.formatLesson(lesson)
			await fs.appendFile(this.agentMdPath, formattedLesson, "utf8")

			// 4. Audit log
			await this.auditLogger.logLessonRecorded(lesson)
			return true
		})
	}

	/**
	 * Ensures AGENT.md and the Lessons Learned section exist.
	 * Returns the current content of the file.
	 */
	private async ensureFileAndSection(): Promise<string> {
		if (!existsSync(this.agentMdPath)) {
			const initialContent = `${this.SECTION_HEADER}\n\n`
			await fs.writeFile(this.agentMdPath, initialContent, "utf8")
			return initialContent
		}

		let content = await fs.readFile(this.agentMdPath, "utf8")
		if (!content.includes(this.SECTION_HEADER)) {
			const appendix = content.endsWith("\n") ? `\n${this.SECTION_HEADER}\n\n` : `\n\n${this.SECTION_HEADER}\n\n`
			await fs.appendFile(this.agentMdPath, appendix, "utf8")
			content += appendix
		}
		return content
	}

	/**
	 * Checks if the signature already exists in the file content.
	 * We embed the signature as a hidden comment in the markdown for high-fidelity de-duplication.
	 */
	private isDuplicate(content: string, signature: string): boolean {
		return content.includes(`<!-- sig: ${signature} -->`)
	}

	/**
	 * Formats the lesson into a Markdown block.
	 */
	private formatLesson(lesson: Lesson): string {
		return `- [${lesson.timestamp}] **Failure Type:** ${lesson.type} <!-- sig: ${lesson.signature} -->
    - **File:** \`${lesson.file}\`
    - **Error Summary:** ${lesson.error_summary}
    - **Cause:** ${lesson.cause ?? ""}
    - **Resolution:** ${lesson.resolution ?? ""}
    - **Corrective Rule:** ${lesson.corrective_rule ?? ""}
`
	}

	/**
	 * Truncates error summary to 500 characters and appends "..." if needed.
	 */
	private truncateErrorSummary(summary: string): string {
		if (summary.length <= 500) return summary
		return summary.substring(0, 497) + "..."
	}

	/**
	 * Records with retry logic as per spec.
	 */
	async recordWithRetry(lesson: Lesson, retries: number = 1): Promise<boolean> {
		try {
			return await this.record(lesson)
		} catch (error) {
			if (retries > 0) {
				await new Promise((resolve) => setTimeout(resolve, 100))
				return await this.recordWithRetry(lesson, retries - 1)
			}
			// Fail silently to main process but log to console/audit if possible
			console.error(`[LessonRecorder] Failed to record lesson after retries: ${error}`)
			return false
		}
	}
}
