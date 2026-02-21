import { describe, it, expect, vi, beforeEach } from "vitest"
import { HookEngine, ToolRequest, ToolResult } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import * as fs from "fs/promises"

vi.mock("fs/promises")

describe("T013: Controller RE_READ_REQUIRED Integration Flow", () => {
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

	it("simulates full conflict → re-read → retry cycle", async () => {
		const filePath = "C:/repo/integration/test.ts"
		const originalContent = "version 1"
		const externalContent = "version 2 (external edit)"
		const intentId = "REQ-INTEG-001"

		// ── Step 1: Agent reads the file ──
		const readResult: ToolResult = {
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: originalContent,
			filePath,
		}
		await hookEngine.postToolUse(readResult)

		// ── Step 2: File is externally modified ──
		vi.mocked(fs.readFile).mockResolvedValue(externalContent)

		// ── Step 3: Agent attempts to write ──
		const writeReq: ToolRequest = {
			toolName: "write_to_file",
			params: { path: filePath, content: "agent changes" },
			intentId,
		}
		const deniedResponse = await hookEngine.preToolUse(writeReq)

		// ── Step 4: Controller receives RE_READ_REQUIRED ──
		expect(deniedResponse.action).toBe("DENY")
		expect(deniedResponse.error_type).toBe("STALE_FILE")

		const payload = JSON.parse(deniedResponse.reason!)
		expect(payload.resolution).toBe("RE_READ_REQUIRED")
		expect(payload.file_path).toBe(filePath)

		// Controller programmatically decides to re-read based on the resolution field
		expect(payload.resolution).toBe("RE_READ_REQUIRED")

		// ── Step 5: Controller triggers view_file (re-read) ──
		// The agent re-reads the file and gets the current version
		const reReadResult: ToolResult = {
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: externalContent,
			filePath,
		}
		await hookEngine.postToolUse(reReadResult)

		// ── Step 6: Agent retries write with fresh baseline ──
		vi.mocked(fs.readFile).mockResolvedValue(externalContent) // File unchanged since re-read
		const retryWriteReq: ToolRequest = {
			toolName: "write_to_file",
			params: { path: filePath, content: "agent changes v2" },
			intentId,
		}
		const retryResponse = await hookEngine.preToolUse(retryWriteReq)

		// ── Step 7: Write should now succeed ──
		expect(retryResponse.action).toBe("CONTINUE")
	})

	it("handles multiple consecutive conflicts on the same file", async () => {
		const filePath = "C:/repo/multi/conflict.ts"
		const intentId = "REQ-MULTI-001"

		// Initial read
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: "v1",
			filePath,
		})

		// Conflict 1
		vi.mocked(fs.readFile).mockResolvedValue("v2")
		const r1 = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "attempt 1" },
			intentId,
		})
		expect(r1.action).toBe("DENY")

		// Re-read
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: "v2",
			filePath,
		})

		// Conflict 2 (file changed again while re-reading!)
		vi.mocked(fs.readFile).mockResolvedValue("v3")
		const r2 = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "attempt 2" },
			intentId,
		})
		expect(r2.action).toBe("DENY")
		const payload2 = JSON.parse(r2.reason!)
		expect(payload2.resolution).toBe("RE_READ_REQUIRED")

		// Final re-read and successful write
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: "v3",
			filePath,
		})
		vi.mocked(fs.readFile).mockResolvedValue("v3")
		const r3 = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "final write" },
			intentId,
		})
		expect(r3.action).toBe("CONTINUE")
	})

	it("verifies target files remain unmodified after rejection (SC-002)", async () => {
		const filePath = "C:/repo/unmodified.ts"
		const intentId = "REQ-UNMOD"

		// Read baseline
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: "original",
			filePath,
		})

		// Mock external change
		vi.mocked(fs.readFile).mockResolvedValue("externally modified")

		// Attempt write — should be denied BEFORE any write occurs
		const response = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent write" },
			intentId,
		})

		expect(response.action).toBe("DENY")
		// The key guarantee: fs.writeFile should NEVER have been called
		// because the rejection happens in preToolUse, before the tool executes.
		// We verify that at the hook level, no mutations occurred.
		expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled()
	})
})
