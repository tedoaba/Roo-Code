import { describe, it, expect, beforeEach, afterEach } from "vitest"
import * as fs from "node:fs/promises"
import { existsSync } from "node:fs"
import * as path from "node:path"
import { execSync } from "node:child_process"

describe("record-lesson CLI", () => {
	const testDir = path.join(process.cwd(), "temp_test_cli")
	const testAgentMd = path.join(testDir, "AGENT.md")

	beforeEach(async () => {
		if (existsSync(testDir)) {
			await fs.rm(testDir, { recursive: true, force: true })
		}
		await fs.mkdir(testDir, { recursive: true })
		process.env.TEST_AGENT_MD = testAgentMd // We need to tell the CLI to use this path
	})

	afterEach(async () => {
		if (existsSync(testDir)) {
			await fs.rm(testDir, { recursive: true, force: true })
		}
		delete process.env.TEST_AGENT_MD
	})

	it("should record a lesson via CLI", async () => {
		const cmd = `powershell -ExecutionPolicy Bypass -Command "$env:AGENT_MD_PATH='${testAgentMd}'; pnpm exec tsx cli/record-lesson.ts --type LINT --file test.ts --error 'Error' --cause 'Cause' --resolution 'Res' --rule 'Rule' --intent-id 'id-1'"`

		try {
			execSync(cmd, { cwd: process.cwd() })
		} catch (error: any) {
			throw new Error(`CLI execution failed: ${error.stdout?.toString() || error.message}`)
		}

		expect(existsSync(testAgentMd)).toBe(true)
		const content = await fs.readFile(testAgentMd, "utf8")
		expect(content).toContain("**Failure Type:** LINT")
		expect(content).toContain("test.ts")
	})

	it("should fail if required arguments are missing", () => {
		const cmd = `powershell -ExecutionPolicy Bypass -Command "$env:AGENT_MD_PATH='${testAgentMd}'; pnpm exec tsx cli/record-lesson.ts --type LINT"`

		expect(() => execSync(cmd, { stdio: "pipe" })).toThrow()
	})
})
