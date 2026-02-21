import { describe, it, expect } from "vitest"
import { generate_content_hash } from "../hashing"
import * as crypto from "crypto"

describe("Hashing Performance", () => {
	it("should hash 1MB of content in less than 50ms (SC-003)", () => {
		const oneMB = 1024 * 1024
		const content = crypto.randomBytes(oneMB).toString("hex").slice(0, oneMB)

		const start = performance.now()
		generate_content_hash(content)
		const end = performance.now()

		const duration = end - start
		console.log(`Hashing 1MB took ${duration.toFixed(2)}ms`)

		expect(duration).toBeLessThan(50)
	})

	it("should hash 10MB of content in reasonable time", () => {
		const tenMB = 10 * 1024 * 1024
		const content = crypto.randomBytes(tenMB).toString("hex").slice(0, tenMB)

		const start = performance.now()
		generate_content_hash(content)
		const end = performance.now()

		const duration = end - start
		console.log(`Hashing 10MB took ${duration.toFixed(2)}ms`)

		expect(duration).toBeLessThan(500) // 10MB should be well under 500ms
	})
})
