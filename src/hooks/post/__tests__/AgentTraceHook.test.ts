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
		ledgerPath = path.join(tempDir, ".orchestration", "agent_trace.jsonl")
		testFilePath = path.join(tempDir, "test-target.txt")

		// Create the ledger directory since it might not exist
		await fs.mkdir(path.dirname(ledgerPath), { recursive: true })

		// Create a dummy target file
		await fs.writeFile(testFilePath, "Hello Trace", "utf8")

		// Override hook ledger path for testing purpose
		hook = new AgentTraceHook()
		;(hook as any).ledgerPath = ledgerPath // Injection for testing
	})

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true })
	})

	it("US1: generates a trace with basic fields on write", async () => {
		await hook.execute("intent_123", testFilePath, "request_456")

		const content = await fs.readFile(ledgerPath, "utf8")
		const lines = content.trim().split("\n")
		expect(lines.length).toBe(1)

		const trace = JSON.parse(lines[0])

		expect(trace).toHaveProperty("id")
		expect(typeof trace.id).toBe("string")
		expect(trace.agent).toBe("roo-code")
		expect(trace.target_artifact).toBe(testFilePath)
		expect(trace.mutation_class).toBe("write")
		expect(typeof trace.timestamp).toBe("number")
	})

	it("US2: maps intent/request relationships and file content hash", async () => {
		await hook.execute("intent_789", testFilePath, "request_abc")

		const content = await fs.readFile(ledgerPath, "utf8")
		const lines = content.trim().split("\n")
		const trace = JSON.parse(lines[0])

		expect(trace.related).toBeDefined()
		expect(trace.related).toEqual(
			expect.arrayContaining([
				{ type: "intent", id: "intent_789" },
				{ type: "request", id: "request_abc" },
			]),
		)

		expect(trace.content_hash).toBeDefined()
		// SHA-256 for "Hello Trace"
		expect(trace.content_hash).toBe("d973bd7fe4a9190c1f6cba0285a862b535d5d8db707af4eafdeadaee8cc7dae4")
	})

	it("US3: fails safely without throwing exceptions on internal error", async () => {
		// Pass an invalid file path that will cause generateFileHash to throw.
		// The hook must catch and suppress it, allowing the flow to continue.
		const invalidFilePath = path.join(os.tmpdir(), "does-not-exist.txt")

		// This should not throw
		await expect(hook.execute("intent_bad", invalidFilePath, "request_bad")).resolves.not.toThrow()
	})
})
