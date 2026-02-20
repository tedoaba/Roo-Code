import { describe, it, expect, beforeEach, vi } from "vitest"
import { HookEngine, ToolRequest } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"

describe("Relaxed Handshake Integration (US1, US2)", () => {
    let hookEngine: HookEngine
    let stateMachine: StateMachine
    let mockOrchestrationService: any

    beforeEach(() => {
        mockOrchestrationService = {
            isOrchestrationHealthy: vi.fn().mockResolvedValue(true),
            validateScope: vi.fn().mockResolvedValue({ allowed: true }),
            checkFileOwnership: vi.fn().mockResolvedValue(null),
            updateBudget: vi.fn().mockResolvedValue({ withinBudget: true }),
            logTrace: vi.fn().mockResolvedValue(undefined),
            isIntentIgnored: vi.fn().mockReturnValue(false),
            logMutation: vi.fn().mockResolvedValue(undefined),
        }

        stateMachine = new StateMachine("test-session", mockOrchestrationService as unknown as OrchestrationService)
        hookEngine = new HookEngine(
            mockOrchestrationService as unknown as OrchestrationService,
            stateMachine
        )
    })

    describe("User Story 1: Analysis Before Intent", () => {
        it("T010: allows read_file in REASONING state without an active intent", async () => {
            // Trigger transition to REASONING (e.g. on user request)
            await stateMachine.onUserRequest()
            expect(stateMachine.getCurrentState()).toBe("REASONING")

            const req: ToolRequest = {
                toolName: "read_file",
                params: { path: "src/index.ts" }
                // no intentId
            }

            const response = await hookEngine.preToolUse(req)
            expect(response.action).toBe("CONTINUE")
        })

        it("T011: allows attempt_completion in REASONING state for informational tasks", async () => {
            await stateMachine.onUserRequest()
            
            const req: ToolRequest = {
                toolName: "attempt_completion",
                params: { result: "Research complete: component found in src/ui." }
            }

            const response = await hookEngine.preToolUse(req)
            expect(response.action).toBe("CONTINUE")
        })

        it("allows codebase_search in REQUEST state", async () => {
            expect(stateMachine.getCurrentState()).toBe("REQUEST")

            const req: ToolRequest = {
                toolName: "codebase_search",
                params: { query: "auth" }
            }

            const response = await hookEngine.preToolUse(req)
            expect(response.action).toBe("CONTINUE")
        })
    })

    describe("User Story 2: Mutation Protection", () => {
        it("T014: blocks write_to_file in REASONING state with State Violation", async () => {
            await stateMachine.onUserRequest()

            const req: ToolRequest = {
                toolName: "write_to_file",
                params: { path: "src/index.ts", content: "..." }
            }

            const response = await hookEngine.preToolUse(req)
            expect(response.action).toBe("DENY")
            expect(response.reason).toContain("State Violation")
            expect(response.reason).toContain("Intent Handshake required")
        })
    })

    describe("Full Flow Verification", () => {
        it("T016: executes Research -> Select Intent -> Mutate flow successfully", async () => {
            // 1. Research (REASONING state)
            await stateMachine.onUserRequest()
            expect(stateMachine.getCurrentState()).toBe("REASONING")

            const researchReq: ToolRequest = {
                toolName: "read_file",
                params: { path: "src/types.ts" }
            }
            const researchRes = await hookEngine.preToolUse(researchReq)
            expect(researchRes.action).toBe("CONTINUE")

            // 2. Select Intent (REASONING -> ACTION)
            const intentId = "REQ-FLOW-01"
            const selectReq: ToolRequest = {
                toolName: "select_active_intent",
                params: { intent_id: intentId }
            }
            const selectRes = await hookEngine.preToolUse(selectReq)
            expect(selectRes.action).toBe("CONTINUE")
            
            // Simulate controller calling transition after tool use
            await stateMachine.onIntentSelected(intentId)
            expect(stateMachine.getCurrentState()).toBe("ACTION")

            // 3. Mutate (ACTION state)
            const mutateReq: ToolRequest = {
                toolName: "write_to_file",
                params: { path: "src/types.ts", content: "updated" },
                intentId
            }
            const mutateRes = await hookEngine.preToolUse(mutateReq)
            expect(mutateRes.action).toBe("CONTINUE")
        })
    })
})
