export type LessonType = "LINT" | "TEST" | "ANALYSIS" | "OTHER"

export interface Lesson {
	/** When the failure occurred (UTC ISO8601) */
	timestamp: string
	/** Category of failure */
	type: LessonType
	/** Relative path to the primary file involved */
	file: string
	/** Concise description of the error output (Max 500 chars) */
	error_summary: string
	/** Root cause analyzed by the agent */
	cause: string
	/** The specific fix applied */
	resolution: string
	/** General guideline for preventing recurrence */
	corrective_rule: string
	/** ID of the active intent during failure */
	intent_id: string
	/** hash(file + error_summary) used for de-duplication */
	signature?: string
}
