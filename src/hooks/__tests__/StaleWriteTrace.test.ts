import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { AgentTraceHook } from "../post/AgentTraceHook"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"

describe("AgentTraceHook — StaleWriteError conflict logging (T005)", () => {
	let hook: AgentTraceHook
	let tempDir: string
	let ledgerPath: string
	let testFilePath: string

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "roo-stale-trace-"))
		ledgerPath = path.join(tempDir, "agent_trace.jsonl")
		testFilePath = path.join(tempDir, "conflict-target.txt")
		await fs.writeFile(testFilePath, "conflict content", "utf8")
		hook = new AgentTraceHook(ledgerPath)
	})

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true })
		// Clear de-duplication cache for test isolation
		;(AgentTraceHook as any).processedEvents.clear()
	})

	it("should record a conflict trace for a stale write rejection", async () => {
		const mockEngine = {
			isFileDestructiveTool: (name: string) => name === "write_to_file",
		} as any

		await hook.execute(
			{
				intentId: "REQ-STALE-001",
				filePath: testFilePath,
				success: true,
				toolName: "write_to_file",
				params: {},
				mutationClass: "STALE_FILE_CONFLICT",
				summary: "write_to_file_rejected: expected hash abc123 but found def456",
			},
			mockEngine,
			"req-xyz",
		)

		const content = await fs.readFile(ledgerPath, "utf8")
		const lines = content.trim().split("\n")
		expect(lines.length).toBe(1)

		const entry = JSON.parse(lines[0])
		// LedgerManager uses AgentTraceEntry shape: intent_id, actor, ranges.file, etc.
		expect(entry.intent_id).toBe("REQ-STALE-001")
		expect(entry.actor).toBe("roo-code")
		expect(entry.ranges.file).toBe(testFilePath)
		expect(entry.mutation_class).toBe("STALE_FILE_CONFLICT")
		expect(entry.summary).toContain("write_to_file_rejected")
		expect(entry.metadata.requestId).toBe("req-xyz")
	})

	it("should not record duplicate conflict events for the same stale write", async () => {
		const mockEngine = {
			isFileDestructiveTool: (name: string) => name === "write_to_file",
		} as any

		const result = {
			intentId: "REQ-STALE-DUP",
			filePath: testFilePath,
			success: true,
			toolName: "write_to_file",
			params: {},
			mutationClass: "STALE_FILE_CONFLICT",
			summary: "Duplicate stale write conflict",
		}
		const requestId = "req-dup"

		await hook.execute(result, mockEngine, requestId)
		await hook.execute(result, mockEngine, requestId) // Duplicate call

		const content = await fs.readFile(ledgerPath, "utf8")
		const lines = content.trim().split("\n")
		expect(lines.length).toBe(1) // Should still be 1 due to deduplication
	})
})
