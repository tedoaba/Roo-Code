import * as fs from "node:fs/promises"
import { existsSync } from "node:fs"
import * as path from "node:path"

/**
 * Handles retrieval of recorded lessons from AGENT.md for context injection.
 */
export class LessonRetriever {
	private readonly agentMdPath: string
	private readonly SECTION_HEADER = "## Lessons Learned"

	constructor(agentMdPath?: string) {
		this.agentMdPath = agentMdPath || process.env.AGENT_MD_PATH || path.join(process.cwd(), "AGENT.md")
	}

	/**
	 * Retrieves the entire Lessons Learned section as a string.
	 *
	 * @returns The section content, or empty string if not found.
	 */
	async getLessonsSection(): Promise<string> {
		if (!existsSync(this.agentMdPath)) {
			return ""
		}

		try {
			const content = await fs.readFile(this.agentMdPath, "utf8")
			const sectionStart = content.indexOf(this.SECTION_HEADER)
			if (sectionStart === -1) {
				return ""
			}

			// Capture everything from the header to the next header or end of file
			const remaining = content.substring(sectionStart)
			const nextHeaderMatch = remaining.substring(this.SECTION_HEADER.length).match(/\n#{1,3}\s/)

			if (nextHeaderMatch && nextHeaderMatch.index !== undefined) {
				return remaining.substring(0, nextHeaderMatch.index + this.SECTION_HEADER.length).trim()
			}

			return remaining.trim()
		} catch (error) {
			console.error(`[LessonRetriever] Failed to read lessons: ${error}`)
			return ""
		}
	}

	/**
	 * Returns recent lessons for prompt injection.
	 *
	 * @param limit Maximum number of characters to return (to avoid context bloat).
	 */
	async getRecentLessonsForInjection(limit: number = 2000): Promise<string> {
		const section = await this.getLessonsSection()
		if (!section) return ""

		// For now, we return the whole section if it fits, or the last 'limit' characters.
		// A more advanced implementation would parse individual items.
		if (section.length <= limit) {
			return section
		}

		return "... [truncated] ...\n" + section.substring(section.length - limit)
	}
}
