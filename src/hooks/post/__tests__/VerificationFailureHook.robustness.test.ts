import { VerificationFailureHook } from "../VerificationFailureHook"
import { LessonRecorder } from "../../../core/lessons/LessonRecorder"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock LessonRecorder
vi.mock("../../../core/lessons/LessonRecorder", () => {
	return {
		LessonRecorder: vi.fn().mockImplementation(() => {
			return {
				recordWithRetry: vi.fn().mockRejectedValue(new Error("Storage full")),
			}
		}),
	}
})

describe("VerificationFailureHook - Robustness", () => {
	let hook: VerificationFailureHook
	let mockRecorder: any

	beforeEach(() => {
		vi.clearAllMocks()
		mockRecorder = new LessonRecorder()
		hook = new VerificationFailureHook(mockRecorder)
	})

	it("should not throw if LessonRecorder fails", async () => {
		const result = {
			toolName: "execute_command",
			params: { command: "npm test" },
			success: true,
			output: "FAIL src/app.test.ts\nExit code: 1",
			intentId: "REQ-003",
		}

		// This should not throw
		await expect(hook.execute(result)).resolves.not.toThrow()

		expect(mockRecorder.recordWithRetry).toHaveBeenCalled()
	})

	it("should handle missing output or params safely", async () => {
		const result: any = {
			toolName: "execute_command",
			params: {},
			success: true,
		}

		await expect(hook.execute(result)).resolves.not.toThrow()
	})
})
