import { describe, it, expect, beforeEach, vi } from "vitest"
import { HookEngine, ToolResult } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import { VerificationFailureHook } from "../post/VerificationFailureHook"

// Mock VerificationFailureHook
vi.mock("../post/VerificationFailureHook", () => {
	return {
		VerificationFailureHook: vi.fn().mockImplementation(() => {
			return {
				execute: vi.fn().mockResolvedValue(undefined),
			}
		}),
	}
})

describe("VerificationFailureHook Integration", () => {
	let hookEngine: HookEngine
	let mockOrchestrationService: any
	let mockStateMachine: any

	beforeEach(() => {
		vi.clearAllMocks()

		mockOrchestrationService = {
			isOrchestrationHealthy: vi.fn().mockResolvedValue(true),
			logTrace: vi.fn().mockResolvedValue(undefined),
		}

		mockStateMachine = {
			isToolAllowed: vi.fn().mockReturnValue({ allowed: true }),
		}

		hookEngine = new HookEngine(
			mockOrchestrationService as unknown as OrchestrationService,
			mockStateMachine as unknown as StateMachine,
		)
	})

	it("should trigger VerificationFailureHook on execute_command", async () => {
		const result: ToolResult = {
			toolName: "execute_command",
			params: { command: "npm test" },
			success: true,
			output: "Exit code: 1",
			intentId: "REQ-001",
		}

		await hookEngine.postToolUse(result)

		const { VerificationFailureHook: MockHook } = await import("../post/VerificationFailureHook")
		const mockHookInstance = (MockHook as any).mock.results[0].value
		expect(mockHookInstance.execute).toHaveBeenCalledWith(result)
	})

	it("should NOT trigger VerificationFailureHook on other tools", async () => {
		const result: ToolResult = {
			toolName: "read_file",
			params: { path: "test.ts" },
			success: true,
			output: "content",
			intentId: "REQ-001",
		}

		await hookEngine.postToolUse(result)

		const { VerificationFailureHook: MockHook } = await import("../post/VerificationFailureHook")
		expect(MockHook).not.toHaveBeenCalled()
	})

	it("should handle VerificationFailureHook errors gracefully (US3)", async () => {
		const { VerificationFailureHook: MockHook } = await import("../post/VerificationFailureHook")
		;(MockHook as any).mockImplementationOnce(() => {
			return {
				execute: vi.fn().mockRejectedValue(new Error("Hook failed")),
			}
		})

		const result: ToolResult = {
			toolName: "execute_command",
			params: { command: "npm test" },
			success: true,
			output: "Exit code: 1",
			intentId: "REQ-001",
		}

		// Should not throw
		await expect(hookEngine.postToolUse(result)).resolves.not.toThrow()
	})
})
