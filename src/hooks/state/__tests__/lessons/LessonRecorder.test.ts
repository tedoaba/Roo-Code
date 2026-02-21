import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as fs from "node:fs/promises"
import { existsSync } from "node:fs"
import * as path from "node:path"
import { LessonRecorder } from "../../lessons/LessonRecorder"
import { Lesson } from "../../lessons/types"

vi.mock("../../lessons/LessonAuditLogger")

describe("LessonRecorder", () => {
	const testDir = path.join(process.cwd(), "temp_test_lessons")
	const testAgentMd = path.join(testDir, "AGENT.md")

	beforeEach(async () => {
		if (existsSync(testDir)) {
			await fs.rm(testDir, { recursive: true, force: true })
		}
		await fs.mkdir(testDir, { recursive: true })
	})

	afterEach(async () => {
		if (existsSync(testDir)) {
			await fs.rm(testDir, { recursive: true, force: true })
		}
	})

	it("should create AGENT.md if it does not exist", async () => {
		const recorder = new LessonRecorder(testAgentMd)
		const lesson: Lesson = {
			timestamp: "2026-02-20T12:00:00Z",
			type: "LINT",
			file: "src/index.ts",
			error_summary: "Missing semicolon",
			cause: "Typo",
			resolution: "Added semicolon",
			corrective_rule: "Always use semicolons",
			intent_id: "test-intent",
		}

		const result = await recorder.record(lesson)
		expect(result).toBe(true)
		expect(existsSync(testAgentMd)).toBe(true)

		const content = await fs.readFile(testAgentMd, "utf8")
		expect(content).toContain("## Lessons Learned")
		expect(content).toContain("**Failure Type:** LINT")
		expect(content).toContain("src/index.ts")
	})

	it("should append to existing AGENT.md section", async () => {
		await fs.writeFile(testAgentMd, "## Lessons Learned\n\n- Existing lesson\n")
		const recorder = new LessonRecorder(testAgentMd)
		const lesson: Lesson = {
			timestamp: "2026-02-20T12:01:00Z",
			type: "TEST",
			file: "tests/main.test.ts",
			error_summary: "Assertion failed",
			cause: "Bad logic",
			resolution: "Fixed logic",
			corrective_rule: "Check bounds",
			intent_id: "test-intent-2",
		}

		await recorder.record(lesson)
		const content = await fs.readFile(testAgentMd, "utf8")
		expect(content).toContain("- Existing lesson")
		expect(content).toContain("**Failure Type:** TEST")
	})

	it("should prevent duplicate recording based on signature", async () => {
		const recorder = new LessonRecorder(testAgentMd)
		const lesson: Lesson = {
			timestamp: "2026-02-20T12:00:00Z",
			type: "LINT",
			file: "src/index.ts",
			error_summary: "Missing semicolon",
			cause: "Typo",
			resolution: "Added semicolon",
			corrective_rule: "Always use semicolons",
			intent_id: "test-intent",
		}

		const result1 = await recorder.record(lesson)
		const result2 = await recorder.record(lesson)

		expect(result1).toBe(true)
		expect(result2).toBe(false)

		const content = await fs.readFile(testAgentMd, "utf8")
		const matches = content.match(/\*\*Failure Type:\*\* LINT/g)
		expect(matches?.length).toBe(1)
	})

	it("should truncate long error summaries", async () => {
		const recorder = new LessonRecorder(testAgentMd)
		const longError = "A".repeat(1000)
		const lesson: Lesson = {
			timestamp: "2026-02-20T12:00:00Z",
			type: "ANALYSIS",
			file: "src/huge.ts",
			error_summary: longError,
			cause: "Too long",
			resolution: "Fixed",
			corrective_rule: "None",
			intent_id: "test-intent-3",
		}

		await recorder.record(lesson)
		const content = await fs.readFile(testAgentMd, "utf8")
		// 500 chars limit (3 chars for ...)
		expect(content.length).toBeLessThan(1000)
		expect(content).toContain("AAA...")
	})

	it('should add "## Lessons Learned" header if file exists but section is missing', async () => {
		await fs.writeFile(testAgentMd, "# Project Status\n\nAll green.")
		const recorder = new LessonRecorder(testAgentMd)
		const lesson: Lesson = {
			timestamp: "2026-02-20T12:00:00Z",
			type: "OTHER",
			file: "README.md",
			error_summary: "Broken link",
			cause: "Old URL",
			resolution: "Updated URL",
			corrective_rule: "Check links",
			intent_id: "test-intent-4",
		}

		await recorder.record(lesson)
		const content = await fs.readFile(testAgentMd, "utf8")
		expect(content).toContain("# Project Status")
		expect(content).toContain("## Lessons Learned")
	})
})
