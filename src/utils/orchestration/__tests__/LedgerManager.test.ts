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
			agentId: "agy-77",
			intentId: "test-intent",
			mutation: {
				type: "write",
				target: "src/test.ts",
				hash: "abc123hash",
			},
			vcsRevision: "main@abcdef",
			attribution: "agent",
		}

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
			agentId: "agy-77",
			intentId: "test-intent-1",
			mutation: { type: "write", target: "f1.ts", hash: "h1" },
			vcsRevision: "rev1",
			attribution: "agent",
		}

		const entry2: AgentTraceEntry = {
			timestamp: "2026-02-20T01:01:00Z",
			agentId: "agy-77",
			intentId: "test-intent-2",
			mutation: { type: "delete", target: "f2.ts", hash: "h2" },
			vcsRevision: "rev2",
			attribution: "system",
		}

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
			agentId: "agy-77",
			intentId: "test-intent",
			mutation: { type: "write", target: "test.ts", hash: "hash" },
			vcsRevision: "rev",
			attribution: "agent",
		}

		await nestedManager.append(entry)
		expect(await fs.stat(deeplyNestedPath).catch(() => null)).not.toBeNull()
	})
})
