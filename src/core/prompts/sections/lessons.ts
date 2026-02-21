import { LessonRetriever } from "../../lessons/LessonRetriever"

/**
 * Generates the "Lessons Learned" section for the system prompt.
 * This section provides the agent with context about previous mistakes and their corrections.
 */
export async function getLessonsLearnedSection(): Promise<string> {
	const retriever = new LessonRetriever()
	const lessons = await retriever.getRecentLessonsForInjection()

	if (!lessons) {
		return ""
	}

	return `
# PREVIOUS LESSONS LEARNED
The following is a list of mistakes you have made in the past and the rules you established to avoid them. You MUST follow these rules strictly to ensure high-quality output.

${lessons}
`
}
