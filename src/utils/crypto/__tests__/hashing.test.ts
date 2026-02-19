import { describe, it, expect } from "vitest"
import { generateFileHash } from "../hashing"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"

describe("File Hashing Utility", () => {
	it("should generate a correct SHA-256 hash for an existing file", async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "roo-test-"))
		const testFilePath = path.join(tempDir, "test.txt")
		const content = "Hello World"

		await fs.writeFile(testFilePath, content, "utf8")

		// The hash of "Hello World"
		const expected = "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
		const hash = await generateFileHash(testFilePath)

		expect(hash).toBe(expected)

		await fs.rm(tempDir, { recursive: true, force: true })
	})

	it("should throw an error for a non-existent file", async () => {
		const nonExistentPath = path.join(os.tmpdir(), "does-not-exist-foo-bar.txt")
		await expect(generateFileHash(nonExistentPath)).rejects.toThrow()
	})

	it("should throw an error if path is not a regular file", async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "roo-test-dir-"))
		await expect(generateFileHash(tempDir)).rejects.toThrow("Path is not a regular file")
		await fs.rm(tempDir, { recursive: true, force: true })
	})
})
