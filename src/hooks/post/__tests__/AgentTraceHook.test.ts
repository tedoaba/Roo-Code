import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { AgentTraceHook } from "../AgentTraceHook"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"

describe("AgentTraceHook (US1)", () => {
	let hook: AgentTraceHook
	let tempDir: string
	let ledgerPath: string
	let testFilePath: string

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "roo-trace-test-"))
		ledgerPath = path.join(tempDir, "agent_trace.jsonl")
		testFilePath = path.join(tempDir, "test-target.txt")

		// Create a dummy target file
		await fs.writeFile(testFilePath, "Hello Trace", "utf8")

		// Initialize hook with temporary ledger path
		hook = new AgentTraceHook(ledgerPath)
	})

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true })
		// Clear de-duplication cache for test isolation
		;(AgentTraceHook as any).processedEvents.clear()
	})

	it("US1: generates a trace with basic fields on write in new schema", async () => {
		const mockEngine = {
			isFileDestructiveTool: () => true,
		} as any

		await hook.execute(
			{
				toolName: "write_to_file",
				params: {},
				success: true,
				intentId: "intent_123",
				filePath: testFilePath,
				mutationClass: "file_mutation",
				summary: "test mutation",
			},
			mockEngine,
			"request_456",
		)

		const content = await fs.readFile(ledgerPath, "utf8")
		const lines = content.trim().split("\n")
		expect(lines.length).toBe(1)

		const entry = JSON.parse(lines[0])

		expect(entry).toHaveProperty("timestamp")
		expect(entry.actor).toBe("roo-code")
		expect(entry.intent_id).toBe("intent_123")
		expect(entry.ranges.file).toBe(testFilePath)
		expect(entry.metadata.requestId).toBe("request_456")
		expect(entry.contributor.entity_type).toBe("AI")
	})

	it("US1: computes SHA-256 hash for the mutation", async () => {
		const mockEngine = {
			isFileDestructiveTool: () => true,
		} as any

		await hook.execute(
			{
				toolName: "write_to_file",
				params: {},
				success: true,
				intentId: "intent_789",
				filePath: testFilePath,
				mutationClass: "file_mutation",
				summary: "test mutation",
			},
			mockEngine,
			"request_abc",
		)

		const content = await fs.readFile(ledgerPath, "utf8")
		const lines = content.trim().split("\n")
		const entry = JSON.parse(lines[0])

		expect(entry.ranges.content_hash).toBeDefined()
		// SHA-256 for "Hello Trace"
		expect(entry.ranges.content_hash).toBe("dffa5b4982065eb91f477bb117d0a7bb6723dfad620823c169bcbab93722440d")
	})

	it("US1: prevents duplicate entries for the same event", async () => {
		const mockEngine = {
			isFileDestructiveTool: () => true,
		} as any

		const result = {
			toolName: "write_to_file",
			params: {},
			success: true,
			intentId: "intent_123",
			filePath: testFilePath,
			mutationClass: "file_mutation",
			summary: "test mutation",
		}

		await hook.execute(result, mockEngine, "request_456")
		await hook.execute(result, mockEngine, "request_456") // Duplicate call

		const content = await fs.readFile(ledgerPath, "utf8")
		const lines = content.trim().split("\n")
		expect(lines.length).toBe(1) // Should still be 1
	})

	it("US1: fails safely without throwing exceptions on internal error", async () => {
		const mockEngine = {
			isFileDestructiveTool: () => true,
		} as any

		// Pass an invalid file path that will cause LedgerManager to warn and proceed with hash "n/a"
		// or at least not crash the hook's execution.
		const invalidFilePath = path.join(os.tmpdir(), "does-not-exist.txt")

		// This should not throw
		await expect(
			hook.execute(
				{
					toolName: "write_to_file",
					params: {},
					success: true,
					intentId: "intent_bad",
					filePath: invalidFilePath,
					mutationClass: "file_mutation",
					summary: "test mutation",
				},
				mockEngine,
				"request_bad",
			),
		).resolves.not.toThrow()

		const content = await fs.readFile(ledgerPath, "utf8")
		const entry = JSON.parse(content.trim())
		expect(entry.ranges.content_hash).toBe("n/a")
	})
})
