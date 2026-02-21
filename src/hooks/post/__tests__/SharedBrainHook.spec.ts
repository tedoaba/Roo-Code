import { SharedBrainHook } from "../SharedBrainHook"
import { LessonRecorder } from "../../../core/lessons/LessonRecorder"
import { ToolResult } from "../../HookEngine"
import { describe, it, expect, beforeEach, vi, Mocked } from "vitest"

describe("SharedBrainHook", () => {
	let hook: SharedBrainHook
	let mockLessonRecorder: Mocked<LessonRecorder>

	beforeEach(() => {
		mockLessonRecorder = {
			recordWithRetry: vi.fn(),
		} as unknown as Mocked<LessonRecorder>

		hook = new SharedBrainHook(mockLessonRecorder)
	})

	it("should do nothing on successful tool result", async () => {
		const result: ToolResult = { toolName: "write_to_file", success: true, params: {} }
		await hook.execute(result)
		expect(mockLessonRecorder.recordWithRetry).not.toHaveBeenCalled()
	})

	it("should do nothing on unrecognized error", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: false,
			params: {},
			output: "SyntaxError: Unexpected token",
		}
		await hook.execute(result)
		expect(mockLessonRecorder.recordWithRetry).not.toHaveBeenCalled()
	})

	it("should synthesize and record a scope violation lesson", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: false,
			params: {},
			output: "Scope Violation: File is outside the active intent's scope.",
			filePath: "src/unauthorized.ts",
			intentId: "REQ-1",
		}

		await hook.execute(result)

		expect(mockLessonRecorder.recordWithRetry).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "OTHER",
				file: "src/unauthorized.ts",
				intent_id: "REQ-1",
				error_summary: expect.stringContaining("outside the active intent scope"),
			}),
		)
	})

	it("should synthesize and record a stale write lesson", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: false,
			params: {},
			output: "STALE_FILE error: expected sha256 to match...",
			filePath: "src/data.ts",
			intentId: "REQ-2",
		}

		await hook.execute(result)

		expect(mockLessonRecorder.recordWithRetry).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "OTHER",
				error_summary: expect.stringContaining("re-read the file"),
			}),
		)
	})

	it("should gracefully degrade if lesson recorder throws", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: false,
			params: {},
			output: "Scope Violation",
			filePath: "src/unauthorized.ts",
			intentId: "REQ-1",
		}

		mockLessonRecorder.recordWithRetry.mockRejectedValue(new Error("Disk full"))

		await expect(hook.execute(result)).resolves.not.toThrow()
	})
})
