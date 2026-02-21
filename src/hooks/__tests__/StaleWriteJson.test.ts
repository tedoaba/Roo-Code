import { describe, it, expect, beforeEach, vi } from "vitest"
import { HookEngine, ToolRequest, ToolResult } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import * as fs from "fs/promises"

vi.mock("fs/promises")

describe("HookEngine — StaleWriteError JSON formatting (T008/T009)", () => {
	let hookEngine: HookEngine
	let mockOrchestrationService: any
	let mockStateMachine: any

	beforeEach(() => {
		vi.resetAllMocks()

		mockOrchestrationService = {
			isOrchestrationHealthy: vi.fn().mockResolvedValue(true),
			validateScope: vi.fn().mockResolvedValue({ allowed: true }),
			checkFileOwnership: vi.fn().mockResolvedValue(null),
			updateBudget: vi.fn().mockResolvedValue({ withinBudget: true }),
			logTrace: vi.fn().mockResolvedValue(undefined),
			isIntentIgnored: vi.fn().mockReturnValue(false),
			logMutation: vi.fn().mockResolvedValue(undefined),
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

	it("T008: returns pure JSON StaleFileErrorPayload on stale write rejection", async () => {
		const filePath = "C:/repo/src/stale.ts"
		const initialContent = "original content"
		const externalContent = "externally modified"
		const intentId = "REQ-STALE-JSON"

		// 1. Read baseline
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: initialContent,
			filePath,
		})

		// 2. External modification
		vi.mocked(fs.readFile).mockResolvedValue(externalContent)

		// 3. Attempt write
		const response = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent attempt" },
			intentId,
		})

		// Verify response structure
		expect(response.action).toBe("DENY")
		expect(response.error_type).toBe("STALE_FILE")

		// Verify reason is valid JSON conforming to the StaleFileErrorPayload schema
		const payload = JSON.parse(response.reason!)
		expect(payload.error_type).toBe("STALE_FILE")
		expect(payload.file_path).toBe(filePath)
		expect(payload.expected_hash).toBeDefined()
		expect(payload.actual_hash).toBeDefined()
		expect(payload.resolution).toBe("RE_READ_REQUIRED")

		// Verify no additional properties (contract: additionalProperties: false)
		const keys = Object.keys(payload).sort()
		expect(keys).toEqual(["actual_hash", "error_type", "expected_hash", "file_path", "resolution"])

		// Verify the response.details also contains the same payload as an object
		expect(response.details).toEqual(payload)
	})

	it("T008a: returns 'DELETED' for actual_hash when file was concurrently deleted", async () => {
		const filePath = "C:/repo/src/deleted.ts"
		const initialContent = "content before delete"
		const intentId = "REQ-STALE-DEL"

		// 1. Read baseline
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: initialContent,
			filePath,
		})

		// 2. File deleted
		vi.mocked(fs.readFile).mockRejectedValue({ code: "ENOENT" })

		// 3. Attempt write
		const response = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent attempt" },
			intentId,
		})

		expect(response.action).toBe("DENY")
		const payload = JSON.parse(response.reason!)
		expect(payload.actual_hash).toBe("DELETED")
		expect(payload.error_type).toBe("STALE_FILE")
		expect(payload.resolution).toBe("RE_READ_REQUIRED")
	})

	it("T008b: logs the conflict to the Agent Trace Ledger on stale write", async () => {
		const filePath = "C:/repo/src/traced.ts"
		const initialContent = "traced content"
		const intentId = "REQ-STALE-TRACE"

		// 1. Read baseline
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: initialContent,
			filePath,
		})

		// 2. External modification
		vi.mocked(fs.readFile).mockResolvedValue("different content")

		// 3. Attempt write
		await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent attempt" },
			intentId,
		})

		// Verify logTrace was called with the conflict details
		expect(mockOrchestrationService.logTrace).toHaveBeenCalled()
		// Find the MUTATION_CONFLICT trace (postToolUse also logs TOOL_EXECUTION)
		const allCalls = mockOrchestrationService.logTrace.mock.calls.map((c: any) => c[0])
		const traceCall = allCalls.find((c: any) => c.action_type === "MUTATION_CONFLICT")
		expect(traceCall).toBeDefined()
		expect(traceCall.mutation_class).toBe("STALE_FILE_CONFLICT")
		expect(traceCall.intent_id).toBe(intentId)
		expect(traceCall.result.error_type).toBe("STALE_FILE")
		expect(traceCall.payload.target_file).toBe(filePath)
	})
})
