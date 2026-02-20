import { describe, it, expect, beforeEach } from "vitest"
import { TurnContext } from "../TurnContext"

describe("TurnContext", () => {
	let context: TurnContext

	beforeEach(() => {
		context = new TurnContext()
	})

	it("should store and retrieve baseline hashes", () => {
		const filePath = "/test/file.ts"
		const content = "const x = 1;"
		context.recordRead(filePath, content)

		const hash = context.getBaseline(filePath)
		expect(hash).toBeDefined()
		expect(typeof hash).toBe("string")
		expect(hash?.length).toBe(64) // SHA-256 hex length
	})

	it("should update baseline hash on recordWrite", () => {
		const filePath = "/test/file.ts"
		context.recordRead(filePath, "initial")
		const initialHash = context.getBaseline(filePath)

		context.recordWrite(filePath, "updated")
		const updatedHash = context.getBaseline(filePath)

		expect(updatedHash).not.toBe(initialHash)
		expect(updatedHash).toBeDefined()
	})

	it("should return undefined for unknown files", () => {
		expect(context.getBaseline("/unknown.ts")).toBeUndefined()
	})

	it("should clear all hashes on reset", () => {
		context.recordRead("/file1.ts", "content1")
		context.recordRead("/file2.ts", "content2")

		context.reset()

		expect(context.getBaseline("/file1.ts")).toBeUndefined()
		expect(context.getBaseline("/file2.ts")).toBeUndefined()
	})
})
