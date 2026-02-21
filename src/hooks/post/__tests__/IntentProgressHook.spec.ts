import { IntentProgressHook } from "../IntentProgressHook"
import { OrchestrationService } from "../../../services/orchestration/OrchestrationService"
import { ToolResult } from "../../HookEngine"
import { describe, it, expect, beforeEach, vi, Mocked } from "vitest"

describe("IntentProgressHook", () => {
	let hook: IntentProgressHook
	let mockService: Mocked<OrchestrationService>

	beforeEach(() => {
		mockService = {
			getIntentContext: vi.fn(),
			updateIntentStatus: vi.fn(),
			logTrace: vi.fn(),
		} as unknown as Mocked<OrchestrationService>

		hook = new IntentProgressHook(mockService)
	})

	it("should do nothing if intentId is missing", async () => {
		const result: ToolResult = { toolName: "test", success: true, params: {} }
		await hook.execute(result)
		expect(mockService.getIntentContext).not.toHaveBeenCalled()
	})

	it("should do nothing if success is false", async () => {
		const result: ToolResult = { toolName: "test", success: false, params: {}, intentId: "REQ-1" }
		await hook.execute(result)
		expect(mockService.getIntentContext).not.toHaveBeenCalled()
	})

	it("should do nothing if intent has no acceptance criteria", async () => {
		const result: ToolResult = { toolName: "test", success: true, params: {}, intentId: "REQ-1" }
		mockService.getIntentContext.mockResolvedValue({
			intent: { id: "REQ-1", status: "ACTIVE", acceptance_criteria: [] },
			history: [],
			related_files: [],
		} as any)

		await hook.execute(result)
		expect(mockService.updateIntentStatus).not.toHaveBeenCalled()
	})

	it("should do nothing if intent is already COMPLETED", async () => {
		const result: ToolResult = { toolName: "test", success: true, params: {}, intentId: "REQ-1" }
		mockService.getIntentContext.mockResolvedValue({
			intent: { id: "REQ-1", status: "COMPLETED", acceptance_criteria: ["Done"] },
			history: [{ result: { output_summary: "Done" } }],
			related_files: [],
		} as any)

		await hook.execute(result)
		expect(mockService.updateIntentStatus).not.toHaveBeenCalled()
	})

	it("should transition intent to COMPLETED if all criteria match output in trace", async () => {
		const result: ToolResult = {
			toolName: "test",
			success: true,
			params: {},
			intentId: "REQ-1",
			output: "Successfully finished parsing data",
			summary: "Successfully finished parsing data",
		}

		mockService.getIntentContext.mockResolvedValue({
			intent: {
				id: "REQ-1",
				status: "ACTIVE",
				acceptance_criteria: ["parsing data", "Tests passed: 5"],
			},
			history: [
				{ result: { output_summary: "All Tests passed: 5 assertions" }, payload: { tool_name: "test" } },
			] as any[],
			related_files: [],
		} as any)

		await hook.execute(result)

		expect(mockService.updateIntentStatus).toHaveBeenCalledWith("REQ-1", "COMPLETED")
		expect(mockService.logTrace).toHaveBeenCalled()
	})

	it("should not transition if not all criteria are met", async () => {
		const result: ToolResult = {
			toolName: "test",
			success: true,
			params: {},
			intentId: "REQ-1",
			output: "Missing criteria",
			summary: "Missing criteria",
		}

		mockService.getIntentContext.mockResolvedValue({
			intent: {
				id: "REQ-1",
				status: "ACTIVE",
				acceptance_criteria: ["parsing data", "Tests passed: 5"],
			},
			history: [{ result: { output_summary: "All Tests passed: 5 assertions" }, payload: {} }] as any[],
			related_files: [],
		} as any)

		await hook.execute(result)

		expect(mockService.updateIntentStatus).not.toHaveBeenCalled()
	})

	it("should gracefully degradation and not throw on internal errors", async () => {
		const result: ToolResult = { toolName: "test", success: true, params: {}, intentId: "REQ-1" }
		mockService.getIntentContext.mockRejectedValue(new Error("File error"))

		await expect(hook.execute(result)).resolves.not.toThrow()
	})
})
