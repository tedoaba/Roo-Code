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

describe("VerificationFailureHook - Test Runner", () => {
	let hook: VerificationFailureHook
	let mockRecorder: any

	beforeEach(() => {
		vi.clearAllMocks()
		mockRecorder = new LessonRecorder()
		hook = new VerificationFailureHook(mockRecorder)
	})

	it("should detect vitest failure and record a lesson", async () => {
		const output = `
 FAIL  hooks/post/__tests__/VerificationFailureHook.linter.test.ts
  VerificationFailureHook - Linter > should detect eslint failure and record a lesson
    Assertion error: expected ...

Exit code: 1
`
		const result = {
			toolName: "execute_command",
			params: { command: "npx vitest run" },
			success: true,
			output: output,
			intentId: "REQ-002",
		}

		await hook.execute(result)

		expect(mockRecorder.recordWithRetry).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "TEST",
				file: "hooks/post/__tests__/VerificationFailureHook.linter.test.ts",
				intent_id: "REQ-002",
			}),
		)
	})

	it("should detect jest failure and record a lesson", async () => {
		const output = `
FAIL src/utils/math.test.ts
  ● addition > should add two numbers
    Expected: 5
    Received: 4

Exit code: 1
`
		const result = {
			toolName: "execute_command",
			params: { command: "npm test" },
			success: true,
			output: output,
			intentId: "REQ-002",
		}

		await hook.execute(result)

		expect(mockRecorder.recordWithRetry).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "TEST",
				file: "src/utils/math.test.ts",
			}),
		)
	})

	it("should extract error details in summary", async () => {
		const output = `
FAIL src/app.test.ts
  Error: something went wrong
    at Object.<anonymous> (src/app.test.ts:10:5)

Exit code: 1
`
		const result = {
			toolName: "execute_command",
			params: { command: "vitest" },
			success: true,
			output: output,
			intentId: "REQ-002",
		}

		await hook.execute(result)

		expect(mockRecorder.recordWithRetry).toHaveBeenCalledWith(
			expect.objectContaining({
				error_summary: expect.stringContaining("Error: something went wrong"),
			}),
		)
	})
})
