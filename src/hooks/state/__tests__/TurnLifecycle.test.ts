import { describe, it, expect, beforeEach, vi } from "vitest"
import { TurnContext } from "../TurnContext"
import * as fs from "fs/promises"
import { generate_content_hash } from "../../../utils/hashing"

vi.mock("fs/promises")

describe("TurnContext Lifecycle & Snapshots", () => {
	let context: TurnContext

	beforeEach(() => {
		context = new TurnContext()
		vi.resetAllMocks()
	})

	describe("get_initial_hash", () => {
		it("should compute and store hash on first read", async () => {
			const filePath = "/test/file.ts"
			const content = "my file content"
			const expectedHash = generate_content_hash(content)

			vi.mocked(fs.readFile).mockResolvedValue(content as any)

			const hash = await context.get_initial_hash(filePath)

			expect(hash).toBe(expectedHash)
			expect(fs.readFile).toHaveBeenCalledWith(filePath, "utf8")
			expect(fs.readFile).toHaveBeenCalledTimes(1)
		})

		it("should return the same hash on subsequent reads without re-reading disk", async () => {
			const filePath = "/test/file.ts"
			const content = "my file content"
			vi.mocked(fs.readFile).mockResolvedValue(content as any)

			const firstHash = await context.get_initial_hash(filePath)
			const secondHash = await context.get_initial_hash(filePath)

			expect(firstHash).toBe(secondHash)
			expect(fs.readFile).toHaveBeenCalledTimes(1)
		})

		it("should handle concurrent reads atomically using the same promise", async () => {
			const filePath = "/test/file.ts"
			const content = "concurrent content"

			// Slow down the read to ensure concurrency
			vi.mocked(fs.readFile).mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50))
				return content as any
			})

			const [hash1, hash2] = await Promise.all([
				context.get_initial_hash(filePath),
				context.get_initial_hash(filePath),
			])

			expect(hash1).toBe(hash2)
			expect(fs.readFile).toHaveBeenCalledTimes(1)
		})

		it("should snapshot null on file read error", async () => {
			const filePath = "/test/nonexistent.ts"
			vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"))

			const firstResult = await context.get_initial_hash(filePath)
			expect(firstResult).toBeNull()

			const secondResult = await context.get_initial_hash(filePath)
			expect(secondResult).toBeNull()
			expect(fs.readFile).toHaveBeenCalledTimes(1)
		})

		it("should return the original hash even if the file is deleted after the first read", async () => {
			const filePath = "/test/file.ts"
			const content = "original content"
			const expectedHash = generate_content_hash(content)
			vi.mocked(fs.readFile).mockResolvedValue(content as any)

			const firstHash = await context.get_initial_hash(filePath)
			expect(firstHash).toBe(expectedHash)

			// Simulate deletion for subsequent calls
			vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"))

			const secondHash = await context.get_initial_hash(filePath)
			expect(secondHash).toBe(expectedHash)
			expect(fs.readFile).toHaveBeenCalledTimes(1)
		})

		it("should have sub-millisecond retrieval for cached hashes", async () => {
			const filePath = "/test/perf.ts"
			vi.mocked(fs.readFile).mockResolvedValue("content" as any)

			// First read (disk hit)
			await context.get_initial_hash(filePath)

			// Subsequent reads (cache hit)
			const start = performance.now()
			for (let i = 0; i < 1000; i++) {
				await context.get_initial_hash(filePath)
			}
			const end = performance.now()
			const averageTime = (end - start) / 1000

			expect(averageTime).toBeLessThan(1) // Average time < 1ms
		})
	})

	describe("startTurn / endTurn lifecycle", () => {
		it("should clear snapshots when a turn ends", async () => {
			const filePath = "/test/file.ts"
			vi.mocked(fs.readFile).mockResolvedValue("content" as any)

			await context.get_initial_hash(filePath)
			context.recordRead(filePath, "content")

			expect(context.getBaseline(filePath)).toBeDefined()

			context.endTurn()

			expect(context.getBaseline(filePath)).toBeUndefined()

			// Start new turn
			context.startTurn()

			// Should read disk again
			vi.mocked(fs.readFile).mockResolvedValue("new content" as any)
			const newHash = await context.get_initial_hash(filePath)

			expect(fs.readFile).toHaveBeenCalledTimes(2)
			expect(newHash).toBe(generate_content_hash("new content"))
		})
	})
})
