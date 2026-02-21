import { describe, it, expect, beforeEach, vi } from "vitest"
import { HookEngine } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import { IPreHook } from "../engine/types"

describe("HookEngine Dynamic Mocking (US6)", () => {
	let hookEngine: HookEngine
	let mockOrchestrationService: any
	let mockStateMachine: any

	beforeEach(() => {
		mockOrchestrationService = {
			isOrchestrationHealthy: vi.fn().mockResolvedValue(true),
			validateScope: vi.fn().mockResolvedValue({ allowed: true }),
			checkFileOwnership: vi.fn().mockResolvedValue(null),
			updateBudget: vi.fn().mockResolvedValue({ withinBudget: true }),
			logTrace: vi.fn().mockResolvedValue(undefined),
			isIntentIgnored: vi.fn().mockReturnValue(false),
		}

		mockStateMachine = {
			isToolAllowed: vi.fn().mockReturnValue({ allowed: true }),
		}

		hookEngine = new HookEngine(
			mockOrchestrationService as unknown as OrchestrationService,
			mockStateMachine as unknown as StateMachine,
		)
	})

	it("should allow replacing a default hook with a mock one", async () => {
		// 1. Verify default hook behavior (StateMachine blocks)
		mockStateMachine.isToolAllowed.mockReturnValue({ allowed: false, reason: "Blocked by StateMachine" })

		const req = {
			toolName: "read_file",
			params: { path: "test.ts" },
		}

		const res1 = await hookEngine.preToolUse(req)
		expect(res1.action).toBe("DENY")
		expect(res1.reason).toBe("Blocked by StateMachine")

		// 2. Replace StateCheckHook with a permissive mock
		const mockHook: IPreHook = {
			id: "state-check",
			priority: 2,
			execute: async () => ({ action: "CONTINUE" }),
		}

		hookEngine.registry.register("PRE", mockHook)

		const res2 = await hookEngine.preToolUse(req)
		expect(res2.action).toBe("CONTINUE")
	})

	it("should allow deregistering a hook", async () => {
		hookEngine.registry.deregister("PRE", "state-check")

		mockStateMachine.isToolAllowed.mockReturnValue({ allowed: false })

		const req = {
			toolName: "read_file",
			params: { path: "test.ts" },
		}

		const res = await hookEngine.preToolUse(req)
		// Should ignore StateMachine's blocked status because hook is gone
		expect(res.action).toBe("CONTINUE")
	})
})
