import { ScopeDriftDetectionHook } from "../ScopeDriftDetectionHook"
import { OrchestrationService } from "../../../services/orchestration/OrchestrationService"
import { ToolResult } from "../../HookEngine"
import { describe, it, expect, beforeEach, vi, Mocked } from "vitest"
import * as path from "path"

describe("ScopeDriftDetectionHook", () => {
	let hook: ScopeDriftDetectionHook
	let mockService: Mocked<OrchestrationService>

	beforeEach(() => {
		mockService = {
			getIntentContext: vi.fn(),
			getMappedPaths: vi.fn(),
			logTrace: vi.fn(),
		} as unknown as Mocked<OrchestrationService>

		hook = new ScopeDriftDetectionHook(mockService)
	})

	it("should do nothing if tool is not a file mutation", async () => {
		const result: ToolResult = { toolName: "read_file", success: true, params: {} }
		await hook.execute(result)
		expect(mockService.getIntentContext).not.toHaveBeenCalled()
	})

	it("should do nothing if no filePath in result", async () => {
		const result: ToolResult = { toolName: "write_to_file", success: true, params: {}, intentId: "REQ-1" }
		await hook.execute(result)
		expect(mockService.getIntentContext).not.toHaveBeenCalled()
	})

	it("should do nothing if file is not near boundary or expanding scope", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: true,
			params: {},
			intentId: "REQ-1",
			filePath: path.join("src", "hooks", "post", "ScopeDriftDetectionHook.ts"),
		}

		mockService.getIntentContext.mockResolvedValue({
			intent: { id: "REQ-1", owned_scope: ["src/hooks/post/*"] },
			history: [],
			related_files: [],
		} as any)

		mockService.getMappedPaths.mockResolvedValue([path.join("src", "hooks", "post", "ScopeDriftDetectionHook.ts")])

		await hook.execute(result)
		expect(mockService.logTrace).not.toHaveBeenCalled()
	})

	it("should warn if file expands scope without prior mapping", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: true,
			params: {},
			intentId: "REQ-1",
			filePath: path.join("src", "hooks", "post", "NewFeature.ts"),
		}

		mockService.getIntentContext.mockResolvedValue({
			intent: { id: "REQ-1", owned_scope: ["src/hooks/post/*"] },
			history: [],
			related_files: [],
		} as any)

		mockService.getMappedPaths.mockResolvedValue([path.join("src", "hooks", "post", "ScopeDriftDetectionHook.ts")])

		await hook.execute(result)
		expect(mockService.logTrace).toHaveBeenCalledWith(
			expect.objectContaining({
				action_type: "SCOPE_WARNING",
			}),
		)
	})

	it("should warn if file is near boundary", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: true,
			params: {},
			intentId: "REQ-1",
			filePath: path.join("src", "hooks", "NewHook.ts"),
		}

		mockService.getIntentContext.mockResolvedValue({
			intent: { id: "REQ-1", owned_scope: ["src/hooks/post/*"] },
			history: [],
			related_files: [],
		} as any)

		mockService.getMappedPaths.mockResolvedValue([path.join("src", "hooks", "post", "ScopeDriftDetectionHook.ts")])

		await hook.execute(result)
		// src/hooks is parent of src/hooks/post, so it's a boundary warning OR scope expansion.
		expect(mockService.logTrace).toHaveBeenCalledWith(
			expect.objectContaining({
				action_type: "SCOPE_WARNING",
			}),
		)
	})

	it("should fail gracefully on internal error", async () => {
		const result: ToolResult = {
			toolName: "write_to_file",
			success: true,
			params: {},
			intentId: "REQ-1",
			filePath: "test.ts",
		}
		mockService.getIntentContext.mockRejectedValue(new Error("Internal"))
		await expect(hook.execute(result)).resolves.not.toThrow()
	})
})
