import { describe, it, expect } from "vitest"
import { LedgerManager } from "../LedgerManager"
import { AgentTraceEntry } from "../../../contracts/AgentTrace"
import * as fs from "fs/promises"
import * as path from "path"

describe("LedgerManager Performance Benchmark", () => {
	const testLedgerPath = path.join(process.cwd(), ".orchestration", "test_performance.jsonl")

	it("should complete a write operation in less than 50ms", async () => {
		const manager = new LedgerManager(testLedgerPath)
		const entry: AgentTraceEntry = {
			timestamp: new Date().toISOString(),
			actor: "test-agent",
			intent_id: "test-intent",
			trace_id: "trace1",
			mutation_class: "file_mutation",
			related: [],
			ranges: { file: "test.ts", content_hash: "hash", start_line: 1, end_line: 10 },
			summary: "test",
		} as any

		const start = performance.now()
		await manager.append(entry)
		const end = performance.now()

		const duration = end - start
		console.log(`[Benchmark] Single write took ${duration.toFixed(2)}ms`)

		expect(duration).toBeLessThan(50)

		// Cleanup
		if (await fs.stat(testLedgerPath).catch(() => null)) {
			await fs.unlink(testLedgerPath)
		}
	})

	it("should maintain performance under concurrent bursts (10 writes)", async () => {
		const manager = new LedgerManager(testLedgerPath)
		const entry: AgentTraceEntry = {
			timestamp: new Date().toISOString(),
			actor: "test-agent",
			intent_id: "test-intent",
			trace_id: "trace1",
			mutation_class: "file_mutation",
			related: [],
			ranges: { file: "test.ts", content_hash: "hash", start_line: 1, end_line: 10 },
			summary: "test",
		} as any

		const start = performance.now()
		await Promise.all(Array.from({ length: 10 }).map(() => manager.append(entry)))
		const end = performance.now()

		const totalDuration = end - start
		const avgDuration = totalDuration / 10
		console.log(
			`[Benchmark] Concurrent 10 writes took ${totalDuration.toFixed(2)}ms (avg ${avgDuration.toFixed(2)}ms/write)`,
		)

		// Even under concurrency, the total burst should be reasonable or average should be low
		expect(avgDuration).toBeLessThan(50)

		// Cleanup
		if (await fs.stat(testLedgerPath).catch(() => null)) {
			await fs.unlink(testLedgerPath)
		}
	})
})
