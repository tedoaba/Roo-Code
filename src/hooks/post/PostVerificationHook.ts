import { ToolResult } from "../HookEngine"

/**
 * Hook that runs after verification tools (tests, linter) to detect failures.
 * If a failure is detected, it returns a suggestion for the agent to record a lesson learned.
 */
export class PostVerificationHook {
	/**
	 * Analyzes the result of a tool execution.
	 * If it looks like a verification failure, returns a reasoning block or suggestion.
	 */
	static async execute(result: ToolResult): Promise<{ suggestRecording: boolean; message?: string }> {
		// Identify if this was a verification tool.
		// Usually 'execute_command' is used for npm test, eslint, etc.
		const isVerificationTool = result.toolName === "execute_command"

		// If the tool failed, we should suggest recording a lesson.
		if (isVerificationTool && !result.success) {
			const output = result.output || ""

			// Detect type of failure from output
			let type = "OTHER"
			if (output.toLowerCase().includes("lint") || output.toLowerCase().includes("eslint")) {
				type = "LINT"
			} else if (output.toLowerCase().includes("test") || output.toLowerCase().includes("fail")) {
				type = "TEST"
			}

			return {
				suggestRecording: true,
				message: `[PostVerificationHook] Detected a ${type} failure. 
Please analyze the root cause, fix it, and then RECORD this lesson learned using:
\`record-lesson --type ${type} --file <involved_file> --error "${output.substring(0, 100).replace(/"/g, "'")}..." --cause "..." --resolution "..." --rule "..." --intent-id "${result.intentId || "REQ-ID"}"\``,
			}
		}

		return { suggestRecording: false }
	}
}
