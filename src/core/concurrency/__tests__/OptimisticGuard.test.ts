import { describe, it, expect, vi, beforeEach } from "vitest"
import { verifyOptimisticLock } from "../OptimisticGuard"
import { ITurnContext } from "../types"
import * as fs from "fs/promises"

vi.mock("fs/promises")

describe("OptimisticGuard", () => {
	let mockContext: ITurnContext
	const mockHasher = (content: string) => `hash_${content}`

	beforeEach(() => {
		vi.resetAllMocks()
		mockContext = {
			recordRead: vi.fn(),
			recordWrite: vi.fn(),
			getBaseline: vi.fn(),
			reset: vi.fn(),
		}
	})

	it("should allow write if no baseline exists", async () => {
		const filePath = "/test/file.ts"
		vi.mocked(mockContext.getBaseline).mockReturnValue(undefined)

		const result = await verifyOptimisticLock(filePath, mockContext, mockHasher)
		expect(result.allowed).toBe(true)
		expect(fs.readFile).not.toHaveBeenCalled()
	})

	it("should allow write if disk hash matches baseline", async () => {
		const filePath = "/test/file.ts"
		const content = "same content"
		const hash = mockHasher(content)

		vi.mocked(mockContext.getBaseline).mockReturnValue(hash)
		vi.mocked(fs.readFile).mockResolvedValue(content)

		const result = await verifyOptimisticLock(filePath, mockContext, mockHasher)
		expect(result.allowed).toBe(true)
	})

	it("should block write if disk hash differs from baseline", async () => {
		const filePath = "/test/file.ts"
		const oldHash = "hash_old"
		const newContent = "new content"
		const newHash = mockHasher(newContent)

		vi.mocked(mockContext.getBaseline).mockReturnValue(oldHash)
		vi.mocked(fs.readFile).mockResolvedValue(newContent)

		const result = await verifyOptimisticLock(filePath, mockContext, mockHasher)
		expect(result.allowed).toBe(false)
		expect(result.error_type).toBe("STALE_FILE")
		expect(result.details?.baseline_hash).toBe(oldHash)
		expect(result.details?.current_disk_hash).toBe(newHash)
	})

	it("should block write if file is missing (deleted)", async () => {
		const filePath = "/test/deleted.ts"
		const oldHash = "hash_old"

		vi.mocked(mockContext.getBaseline).mockReturnValue(oldHash)
		vi.mocked(fs.readFile).mockRejectedValue({ code: "ENOENT" })

		const result = await verifyOptimisticLock(filePath, mockContext, mockHasher)
		expect(result.allowed).toBe(false)
		expect(result.error_type).toBe("STALE_FILE")
		expect(result.details?.current_disk_hash).toBe("MISSING")
	})
})
