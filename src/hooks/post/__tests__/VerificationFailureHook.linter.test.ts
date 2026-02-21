import { VerificationFailureHook } from "../VerificationFailureHook"
import { LessonRecorder } from "../../../core/lessons/LessonRecorder"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock LessonRecorder
vi.mock("../../../core/lessons/LessonRecorder", () => {
	return {
		LessonRecorder: vi.fn().mockImplementation(() => {
			return {
				recordWithRetry: vi.fn().mockResolvedValue(true),
			}
		}),
	}
})

describe("VerificationFailureHook - Linter", () => {
	let hook: VerificationFailureHook
	let mockRecorder: any

	beforeEach(() => {
		vi.clearAllMocks()
		mockRecorder = new LessonRecorder()
		hook = new VerificationFailureHook(mockRecorder)
	})

	it("should detect eslint failure and record a lesson", async () => {
		const output = `
> eslint .

/path/to/file.ts
  1:1  error  'x' is defined but never used  @typescript-eslint/no-unused-vars

✖ 1 problem (1 error, 0 warnings)

Exit code: 1
`
		const result = {
			toolName: "execute_command",
			params: { command: "npm run lint" },
			success: true,
			output: output,
			intentId: "REQ-001",
		}

		await hook.execute(result)

		expect(mockRecorder.recordWithRetry).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "LINT",
				file: "/path/to/file.ts",
				intent_id: "REQ-001",
			}),
		)
	})

	it("should not record if exit code is 0", async () => {
		const output = `
> eslint .

✔ No errors found
Exit code: 0
`
		const result = {
			toolName: "execute_command",
			params: { command: "npm run lint" },
			success: true,
			output: output,
			intentId: "REQ-001",
		}

		await hook.execute(result)

		expect(mockRecorder.recordWithRetry).not.toHaveBeenCalled()
	})

	it("should not record if command is not whitelisted", async () => {
		const output = "Exit code: 1"
		const result = {
			toolName: "execute_command",
			params: { command: "ls -la" },
			success: true,
			output: output,
			intentId: "REQ-001",
		}

		await hook.execute(result)

		expect(mockRecorder.recordWithRetry).not.toHaveBeenCalled()
	})

	it("should filter out node_modules from affected files", async () => {
		const output = `
/abs/path/node_modules/dep/lib.ts
/abs/path/src/app.ts

Exit code: 1
`
		const result = {
			toolName: "execute_command",
			params: { command: "eslint ." },
			success: true,
			output: output,
			intentId: "REQ-001",
		}

		await hook.execute(result)

		expect(mockRecorder.recordWithRetry).toHaveBeenCalledWith(
			expect.objectContaining({
				file: "/abs/path/src/app.ts",
			}),
		)
	})
})
