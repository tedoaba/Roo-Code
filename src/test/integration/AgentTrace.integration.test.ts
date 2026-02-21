import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { HookEngine, ToolResult } from "../../hooks/HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"

describe("Agent Trace Integration", () => {
	let tempDir: string
	let ledgerPath: string
	let testFilePath: string
	let hookEngine: HookEngine
	let mockOrchestrationService: any
	let mockStateMachine: any

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "roo-trace-int-"))
		ledgerPath = path.join(process.cwd(), ".orchestration", "agent_trace.jsonl")
		testFilePath = path.join(tempDir, "mutation-target.ts")

		// Create dummy target
		await fs.writeFile(testFilePath, "const x = 1;", "utf8")

		// Mock dependencies
		mockOrchestrationService = {
			isOrchestrationHealthy: vi.fn().mockResolvedValue(true),
			logMutation: vi.fn().mockResolvedValue(undefined),
			logTrace: vi.fn().mockResolvedValue(undefined),
		}
		mockStateMachine = {
			getCurrentState: vi.fn().mockReturnValue("ACTION"),
			isToolAllowed: vi.fn().mockReturnValue({ allowed: true }),
		}

		hookEngine = new HookEngine(
			mockOrchestrationService as unknown as OrchestrationService,
			mockStateMachine as unknown as StateMachine,
		)

		// Ensure .orchestration directory exists in process.cwd() for the test
		// or at least doesn't fail if we don't mock LedgerManager path.
		// NOTE: In a real integration test we might want to mock LedgerManager's path.
		// For now, the hook uses the default which is .orchestration/agent_trace.jsonl relative to cwd.
		await fs.mkdir(path.join(process.cwd(), ".orchestration"), { recursive: true })
	})

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true })
		// We don't necessarily want to delete the REAL .orchestration/agent_trace.jsonl
		// if other tests use it, but for integration we should probably clean up.
		const realLedger = path.join(process.cwd(), ".orchestration", "agent_trace.jsonl")
		if (await fs.stat(realLedger).catch(() => null)) {
			// Instead of deleting, we can truncate it or just leave it.
			// Better to delete it for test isolation if we are in a test env.
		}
	})

	it("should record a trace entry when a destructive tool succeeds", async () => {
		const uniqueIntentId = `intent-integration-test-${Date.now()}-${Math.random()}`
		const result: ToolResult = {
			toolName: "write_to_file",
			params: { path: testFilePath, content: "const x = 2;" },
			intentId: uniqueIntentId,
			success: true,
			filePath: testFilePath,
			fileContent: "const x = 2;",
		}

		// Set the file content for hashing
		await fs.writeFile(testFilePath, "const x = 2;", "utf8")

		await hookEngine.postToolUse(result, "req-123")

		// Verify ledger
		const realLedger = path.join(process.cwd(), ".orchestration", "agent_trace.jsonl")
		const content = await fs.readFile(realLedger, "utf8")
		const lines = content.trim().split("\n")

		// Find the line relevant to our test (in case there are other traces)
		const ourTrace = lines.map((l) => JSON.parse(l)).find((t) => t.intent_id === uniqueIntentId)

		expect(ourTrace).toBeDefined()
		expect(ourTrace.ranges.file).toBe(testFilePath)
		expect(ourTrace.metadata.requestId).toBe("req-123")
	})
})
