import { describe, it, expect } from "vitest"
import { Deduplicator } from "../Deduplicator"

describe("Deduplicator", () => {
	it("should generate consistent signatures for the same input", () => {
		const file = "src/test.ts"
		const error = "Something went wrong"
		const sig1 = Deduplicator.generateSignature(file, error)
		const sig2 = Deduplicator.generateSignature(file, error)
		expect(sig1).toBe(sig2)
		expect(sig1).toHaveLength(64) // SHA-256 hex length
	})

	it("should generate different signatures for different inputs", () => {
		const sig1 = Deduplicator.generateSignature("a.ts", "err")
		const sig2 = Deduplicator.generateSignature("b.ts", "err")
		const sig3 = Deduplicator.generateSignature("a.ts", "other")
		expect(sig1).not.toBe(sig2)
		expect(sig1).not.toBe(sig3)
	})

	it("should normalize paths", () => {
		const sig1 = Deduplicator.generateSignature("src/test.ts", "err")
		const sig2 = Deduplicator.generateSignature("src\\test.ts", "err")
		expect(sig1).toBe(sig2)
	})

	it("should truncate error summaries before hashing", () => {
		const shortError = "A".repeat(500)
		const longError = "A".repeat(1000)
		const sig1 = Deduplicator.generateSignature("test.ts", shortError)
		const sig2 = Deduplicator.generateSignature("test.ts", longError)
		expect(sig1).toBe(sig2)
	})

	it("should detect duplicates in a set", () => {
		const signature = "test-sig"
		const existing = new Set(["sig-1", signature, "sig-2"])
		expect(Deduplicator.isDuplicate(signature, existing)).toBe(true)
		expect(Deduplicator.isDuplicate("missing", existing)).toBe(false)
	})

	it("should detect duplicates in an array", () => {
		const signature = "test-sig"
		const existing = ["sig-1", signature, "sig-2"]
		expect(Deduplicator.isDuplicate(signature, existing)).toBe(true)
		expect(Deduplicator.isDuplicate("missing", existing)).toBe(false)
	})
})
