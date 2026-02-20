import { describe, it, expect, beforeEach, vi } from "vitest"
import { HookEngine, ToolRequest, ToolResult } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import * as fs from "fs/promises"

vi.mock("fs/promises")

describe("ConcurrencyHook Integration (US1, US2)", () => {
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

	it("T009: blocks write when file has changed since initial read (US1)", async () => {
		const filePath = "C:/repo/src/app.ts"
		const initialContent = "content v1"
		const externalContent = "content v2 (external)"
		const intentId = "REQ-001"

		// 1. Simulate agent reading the file
		const readResult: ToolResult = {
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: initialContent,
			filePath: filePath,
		}
		await hookEngine.postToolUse(readResult)

		// 2. Mock external change on disk
		vi.mocked(fs.readFile).mockResolvedValue(externalContent)

		// 3. Attempt to write
		const writeReq: ToolRequest = {
			toolName: "write_to_file",
			params: { path: filePath, content: "agent write" },
			intentId,
		}

		const response = await hookEngine.preToolUse(writeReq)

		expect(response.action).toBe("DENY")
		expect(response.error_type).toBe("STALE_FILE")
		expect(response.reason).toContain("File modified by another actor")
	})

	it("T009a: allows write when file has NOT changed (US1)", async () => {
		const filePath = "C:/repo/src/app.ts"
		const initialContent = "content v1"
		const intentId = "REQ-001"

		// 1. Simulate agent reading the file
		const readResult: ToolResult = {
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: initialContent,
			filePath: filePath,
		}
		await hookEngine.postToolUse(readResult)

		// 2. Disk content matches initial
		vi.mocked(fs.readFile).mockResolvedValue(initialContent)

		// 3. Attempt to write
		const writeReq: ToolRequest = {
			toolName: "write_to_file",
			params: { path: filePath, content: "agent write" },
			intentId,
		}

		const response = await hookEngine.preToolUse(writeReq)

		expect(response.action).toBe("CONTINUE")
	})

	it("T009b: blocks write when target file is missing (US1)", async () => {
		const filePath = "C:/repo/src/app.ts"
		const initialContent = "content v1"
		const intentId = "REQ-001"

		// 1. Record baseline
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: initialContent,
			filePath: filePath,
		})

		// 2. Mock file deletion
		vi.mocked(fs.readFile).mockRejectedValue({ code: "ENOENT" })

		// 3. Attempt to write
		const response = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent write" },
			intentId,
		})

		expect(response.action).toBe("DENY")
		expect(response.error_type).toBe("STALE_FILE")
		expect(response.details?.current_disk_hash).toBe("MISSING")
	})

	it("T016: allows write after re-reading the file (US2 Recovery)", async () => {
		const filePath = "C:/repo/src/app.ts"
		const initialContent = "content v1"
		const externalContent = "content v2 (external)"
		const intentId = "REQ-001"

		// 1. Initial Read
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: initialContent,
			filePath: filePath,
		})

		// 2. Conflict attempt
		vi.mocked(fs.readFile).mockResolvedValue(externalContent)
		const response1 = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent write" },
			intentId,
		})
		expect(response1.action).toBe("DENY")

		// 3. Re-read (Recovery)
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: externalContent,
			filePath: filePath,
		})

		// 4. Second write attempt should now succeed (provided content hasn't changed again)
		vi.mocked(fs.readFile).mockResolvedValue(externalContent)
		const response2 = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent write" },
			intentId,
		})

		expect(response2.action).toBe("CONTINUE")
	})
})
