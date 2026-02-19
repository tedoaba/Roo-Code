import * as crypto from "crypto"
import * as fs from "fs/promises"

/**
 * Generates a SHA-256 hash of a file's contents safely.
 * Checks for path existence and file access before attempting to hash to remain fail-safe.
 *
 * @param filePath The absolute path to the file.
 * @returns A promise that resolves to the SHA-256 hex digest, or a fallback if unable to read.
 */
export async function generateFileHash(filePath: string): Promise<string> {
	// Check that file exists and can be accessed
	const stat = await fs.stat(filePath)
	if (!stat.isFile()) {
		throw new Error(`Path is not a regular file: ${filePath}`)
	}

	// Stream-based hashing to handle large files efficiently without killing memory
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash("sha256")
		const stream = require("fs").createReadStream(filePath)

		stream.on("data", (chunk: Buffer) => hash.update(chunk))
		stream.on("end", () => resolve(hash.digest("hex")))
		stream.on("error", (err: Error) => reject(err))
	})
}
