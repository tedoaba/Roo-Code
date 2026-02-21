import { describe, it, expect, vi, beforeEach } from "vitest"
import { verifyOptimisticLock } from "../OptimisticGuard"
import { ITurnContext } from "../types"
import { StaleWriteError } from "../../errors/StaleWriteError"
import * as fs from "fs/promises"

vi.mock("fs/promises")

describe("OptimisticGuard — StaleWriteError rejection (T004)", () => {
	let mockContext: ITurnContext
	const mockHasher = (content: string) => `hash_${content}`

	beforeEach(() => {
		vi.resetAllMocks()
		mockContext = {
			recordRead: vi.fn(),
			recordWrite: vi.fn(),
			getBaseline: vi.fn(),
			startTurn: vi.fn(),
			endTurn: vi.fn(),
			get_initial_hash: vi.fn(),
			reset: vi.fn(),
		}
	})

	it("should throw StaleWriteError with correct fields when disk hash differs from baseline", async () => {
		const filePath = "/test/conflict.ts"
		const baselineHash = "hash_old_content"
		const diskContent = "new content"
		const diskHash = mockHasher(diskContent) // "hash_new content"

		vi.mocked(mockContext.getBaseline).mockReturnValue(baselineHash)
		vi.mocked(fs.readFile).mockResolvedValue(diskContent)

		await expect(verifyOptimisticLock(filePath, mockContext, mockHasher)).rejects.toThrow(StaleWriteError)

		try {
			await verifyOptimisticLock(filePath, mockContext, mockHasher)
		} catch (err) {
			const error = err as StaleWriteError
			expect(error.file_path).toBe(filePath)
			expect(error.expected_hash).toBe(baselineHash)
			expect(error.actual_hash).toBe(diskHash)
			expect(error.error_type).toBe("STALE_FILE")
			expect(error.resolution).toBe("RE_READ_REQUIRED")
		}
	})

	it("should throw StaleWriteError with actual_hash 'DELETED' when file was concurrently deleted", async () => {
		const filePath = "/test/deleted.ts"
		const baselineHash = "hash_existing"

		vi.mocked(mockContext.getBaseline).mockReturnValue(baselineHash)
		vi.mocked(fs.readFile).mockRejectedValue({ code: "ENOENT" })

		await expect(verifyOptimisticLock(filePath, mockContext, mockHasher)).rejects.toThrow(StaleWriteError)

		try {
			await verifyOptimisticLock(filePath, mockContext, mockHasher)
		} catch (err) {
			const error = err as StaleWriteError
			expect(error.file_path).toBe(filePath)
			expect(error.expected_hash).toBe(baselineHash)
			expect(error.actual_hash).toBe("DELETED")
			expect(error.error_type).toBe("STALE_FILE")
			expect(error.resolution).toBe("RE_READ_REQUIRED")
		}
	})

	it("should produce a valid StaleFileErrorPayload via toPayload()", async () => {
		const filePath = "/test/payload.ts"
		const baselineHash = "hash_original"
		const diskContent = "changed content"

		vi.mocked(mockContext.getBaseline).mockReturnValue(baselineHash)
		vi.mocked(fs.readFile).mockResolvedValue(diskContent)

		try {
			await verifyOptimisticLock(filePath, mockContext, mockHasher)
		} catch (err) {
			const error = err as StaleWriteError
			const payload = error.toPayload()
			expect(payload).toEqual({
				error_type: "STALE_FILE",
				file_path: filePath,
				expected_hash: baselineHash,
				actual_hash: mockHasher(diskContent),
				resolution: "RE_READ_REQUIRED",
			})
			// Verify no additional properties (additionalProperties: false in schema)
			expect(Object.keys(payload).sort()).toEqual([
				"actual_hash",
				"error_type",
				"expected_hash",
				"file_path",
				"resolution",
			])
		}
	})

	it("should still allow write when no baseline exists (no throw)", async () => {
		vi.mocked(mockContext.getBaseline).mockReturnValue(undefined)

		const result = await verifyOptimisticLock("/test/new.ts", mockContext, mockHasher)
		expect(result.allowed).toBe(true)
		expect(fs.readFile).not.toHaveBeenCalled()
	})

	it("should still allow write when disk hash matches baseline (no throw)", async () => {
		const content = "same content"
		const hash = mockHasher(content)

		vi.mocked(mockContext.getBaseline).mockReturnValue(hash)
		vi.mocked(fs.readFile).mockResolvedValue(content)

		const result = await verifyOptimisticLock("/test/same.ts", mockContext, mockHasher)
		expect(result.allowed).toBe(true)
	})
})
