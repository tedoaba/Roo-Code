import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { LedgerManager } from "../LedgerManager"
import { AgentTraceEntry } from "../../../contracts/AgentTrace"
import * as fs from "fs/promises"
import * as path from "path"

describe("LedgerManager", () => {
	const testDir = path.join(process.cwd(), ".orchestration", "test_tmp")
	const testLedgerPath = path.join(testDir, "agent_trace.jsonl")
	let manager: LedgerManager

	beforeEach(async () => {
		await fs.mkdir(testDir, { recursive: true })
		manager = new LedgerManager(testLedgerPath)
	})

	afterEach(async () => {
		if (await fs.stat(testDir).catch(() => null)) {
			await fs.rm(testDir, { recursive: true, force: true })
		}
	})

	it("should create the ledger file and append an entry", async () => {
		const entry: AgentTraceEntry = {
			timestamp: "2026-02-20T01:00:00Z",
			actor: "agy-77",
			intent_id: "test-intent",
			trace_id: "trace1",
			mutation_class: "file_mutation",
			related: [],
			ranges: { file: "f1.ts", hash: "h1", content_hash: "h1", start_line: 1, end_line: 10 },
			summary: "test",
		} as any

		await manager.append(entry)

		const content = await fs.readFile(testLedgerPath, "utf8")
		const lines = content.trim().split("\n")
		expect(lines.length).toBe(1)

		const parsed = JSON.parse(lines[0])
		expect(parsed).toEqual(entry)
	})

	it("should append multiple entries without overwriting", async () => {
		const entry1: AgentTraceEntry = {
			timestamp: "2026-02-20T01:00:00Z",
			actor: "agy-77",
			intent_id: "test-intent-1",
			trace_id: "trace1",
			mutation_class: "file_mutation",
			related: [],
			ranges: { file: "f1.ts", hash: "h1", content_hash: "h1", start_line: 1, end_line: 10 },
			summary: "test",
		} as any

		const entry2: AgentTraceEntry = {
			timestamp: "2026-02-20T01:01:00Z",
			actor: "agy-77",
			intent_id: "test-intent-2",
			trace_id: "trace2",
			mutation_class: "file_mutation",
			related: [],
			ranges: { file: "f2.ts", content_hash: "h2", start_line: 1, end_line: 10 },
			summary: "test",
		} as any

		await manager.append(entry1)
		await manager.append(entry2)

		const content = await fs.readFile(testLedgerPath, "utf8")
		const lines = content.trim().split("\n")
		expect(lines.length).toBe(2)

		expect(JSON.parse(lines[0])).toEqual(entry1)
		expect(JSON.parse(lines[1])).toEqual(entry2)
	})

	it("should handle directory creation if it does not exist", async () => {
		const deeplyNestedPath = path.join(testDir, "nested", "deeply", "trace.jsonl")
		const nestedManager = new LedgerManager(deeplyNestedPath)

		const entry: AgentTraceEntry = {
			timestamp: "2026-02-20T01:00:00Z",
			actor: "agy-77",
			intent_id: "test-intent",
			trace_id: "trace1",
			mutation_class: "file_mutation",
			related: [],
			ranges: { file: "test.ts", content_hash: "hash", start_line: 1, end_line: 10 },
			summary: "test",
		} as any

		await nestedManager.append(entry)
		expect(await fs.stat(deeplyNestedPath).catch(() => null)).not.toBeNull()
	})
})
