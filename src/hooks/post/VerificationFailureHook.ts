import { ToolResult, HookEngine } from "../HookEngine"
import { LessonRecorder } from "../../core/lessons/LessonRecorder"
import { Lesson } from "../../core/lessons/types"
import { IPostHook } from "../engine/types"

/**
 * VerificationFailureHook - User Story 1 & 2
 *
 * Automatically detects linter and test failures from tool output
 * and records them as lessons in the ledger.
 */
export class VerificationFailureHook implements IPostHook {
	id = "verification-failure"
	private readonly lessonRecorder: LessonRecorder
	private readonly WHITELISTED_TOOLS = [
		"eslint",
		"jest",
		"vitest",
		"npm test",
		"npm run lint",
		"pnpm test",
		"pnpm lint",
		"yarn test",
		"yarn lint",
	]

	constructor(lessonRecorder?: LessonRecorder) {
		this.lessonRecorder = lessonRecorder || new LessonRecorder()
	}

	/**
	 * Executes the hook logic.
	 *
	 * @param result The result of the tool execution.
	 * @param engine The HookEngine instance.
	 */
	async execute(result: ToolResult, _engine: HookEngine): Promise<void> {
		// Only monitor execute_command
		if (result.toolName !== "execute_command") {
			return
		}

		const command = result.params.command as string
		if (!command) {
			return
		}

		// Check if command is in whitelist
		if (!this.isWhitelisted(command)) {
			return
		}

		const output = result.output || ""

		// Check for non-zero exit code in output
		// Format: "Exit code: X"
		const exitCodeMatch = output.match(/Exit code: ([1-9]\d*)/)
		if (!exitCodeMatch) {
			return
		}

		const exitCode = parseInt(exitCodeMatch[1], 10)

		// Perform smart filtering and extraction
		const affectedFiles = this.extractAffectedFiles(output)
		const errorSummary = this.generateErrorSummary(output, command)

		// Record lesson (asynchronous side-effect)
		const lesson: Lesson = {
			timestamp: new Date().toISOString(),
			type: this.determineLessonType(command),
			file: affectedFiles[0] || "unknown",
			error_summary: errorSummary,
			intent_id: result.intentId || "N/A",
		}

		// Use recordWithRetry for robustness
		this.lessonRecorder.recordWithRetry(lesson).catch((err) => {
			console.error("[VerificationFailureHook] Failed to record lesson:", err)
		})
	}

	/**
	 * Checks if a command starts with or contains a whitelisted tool.
	 */
	private isWhitelisted(command: string): boolean {
		return this.WHITELISTED_TOOLS.some((tool) => command.includes(tool))
	}

	/**
	 * Extracts primary affected files from tool output using regex.
	 */
	private extractAffectedFiles(output: string): string[] {
		const files = new Set<string>()

		// Pattern 0: Test runner "FAIL" or "FAILED" lines
		const testFailRegex = /(?:FAIL|FAILED)\s+([^\s:]+)/g
		let match
		while ((match = testFailRegex.exec(output)) !== null) {
			files.add(match[1])
		}

		// Pattern 1: General file paths (absolute or relative)
		// Matches: /path/to/file.ts, .\path\to\file.ts, path/to/file.ts
		const generalPathRegex = /(?:[a-zA-Z]:\\|[./\\])?[\w\-]+(?:[./\\][\w\-]+)+\.(?:ts|js|tsx|jsx|json|css|md)/g
		while ((match = generalPathRegex.exec(output)) !== null) {
			files.add(match[0])
		}

		// Pattern 2: Stack traces (at ... (path:line:col))
		const stackTraceRegex = /at .* \((.*):(\d+):(\d+)\)/g
		while ((match = stackTraceRegex.exec(output)) !== null) {
			files.add(match[1])
		}

		// Convert back to array and filter out noise (node_modules, etc.)
		return Array.from(files).filter((f) => {
			const lower = f.toLowerCase()
			return !lower.includes("node_modules") && !lower.includes(".git") && !lower.includes("dist")
		})
	}

	/**
	 * Generates a concise error summary.
	 */
	private generateErrorSummary(output: string, command: string): string {
		const lines = output.split("\n")
		const relevantLines: string[] = []

		// 1. Find lines with keywords
		const keywords = ["Error", "FAIL", "Exception", "failed"]
		for (const line of lines) {
			if (keywords.some((k) => line.toUpperCase().includes(k.toUpperCase()))) {
				relevantLines.push(line.trim())
			}
			if (relevantLines.length >= 5) break
		}

		// 2. Fallback to last 5 lines if no keywords found
		if (relevantLines.length === 0) {
			relevantLines.push(...lines.slice(-5).map((l) => l.trim()))
		}

		return `Command '${command}' failed. ${relevantLines.join(" | ")}`
	}

	/**
	 * Determines lesson type based on command.
	 */
	private determineLessonType(command: string): "LINT" | "TEST" | "OTHER" {
		if (command.includes("lint") || command.includes("eslint")) {
			return "LINT"
		}
		if (command.includes("test") || command.includes("jest") || command.includes("vitest")) {
			return "TEST"
		}
		return "OTHER"
	}
}
