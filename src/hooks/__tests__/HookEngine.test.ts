import { describe, it, expect, beforeEach, vi } from "vitest"
import { HookEngine, ToolRequest } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import { TraceabilityError } from "../../errors/TraceabilityError"

describe("HookEngine Traceability Enforcement (US1, US2)", () => {
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
			getCurrentState: vi.fn().mockReturnValue("ACTION"),
		}

		hookEngine = new HookEngine(
			mockOrchestrationService as unknown as OrchestrationService,
			mockStateMachine as unknown as StateMachine,
		)
	})

	describe("User Story 1: Intent Presence Validation", () => {
		it("T004: throws TraceabilityError when intentId is missing for a destructive tool", async () => {
			const req: ToolRequest = {
				toolName: "write_to_file",
				params: { path: "test.ts", content: "..." },
				// intentId is missing
			}

			await expect(hookEngine.preToolUse(req)).rejects.toThrow(TraceabilityError)
			await expect(hookEngine.preToolUse(req)).rejects.toThrow(/Traceability Requirement Violation/)
		})

		it("T005: allows execution of SAFE tools even when intentId is missing", async () => {
			const req: ToolRequest = {
				toolName: "read_file",
				params: { path: "test.ts" },
				// intentId is missing
			}

			const response = await hookEngine.preToolUse(req)
			expect(response.action).toBe("CONTINUE")
		})
	})

	describe("User Story 2: Requirement ID Format Validation", () => {
		it("T007: rejects malformed intentId formats", async () => {
			const invalidIds = ["FIX-123", "12345", "", "REQ_", "req-123"]

			for (const intentId of invalidIds) {
				hookEngine.resetCircuitBreaker()
				const req: ToolRequest = {
					toolName: "write_to_file",
					params: { path: "test.ts", content: "..." },
					intentId,
				}
				await expect(hookEngine.preToolUse(req)).rejects.toThrow(TraceabilityError)
				await expect(hookEngine.preToolUse(req)).rejects.toThrow(/Invalid Traceability Identifier Format/)
			}
		})

		it("T008: accepts valid intentId formats", async () => {
			const validIds = ["REQ-123", "REQ-AUTH-01", "REQ-FEATURE-FLAG-99"]

			for (const intentId of validIds) {
				hookEngine.resetCircuitBreaker()
				const req: ToolRequest = {
					toolName: "write_to_file",
					params: { path: "test.ts", content: "..." },
					intentId,
				}
				const response = await hookEngine.preToolUse(req)
				expect(response.action).toBe("CONTINUE")
			}
		})

		it("T009: populates contributor field in logTrace calls for denials (US2)", async () => {
			mockOrchestrationService.validateScope.mockResolvedValue({ allowed: false, reason: "Out of scope" })
			const req: ToolRequest = {
				toolName: "write_to_file",
				params: { path: "test.ts", content: "..." },
				intentId: "REQ-123",
			}

			await hookEngine.preToolUse(req)

			expect(mockOrchestrationService.logTrace).toHaveBeenCalledWith(
				expect.objectContaining({
					contributor: {
						entity_type: "AI",
						model_identifier: "roo-code",
					},
				}),
			)
		})
	})
})
