import { describe, it, beforeAll, expect } from "vitest"
import { MutationClassifier } from "../MutationClassifier"
import { TypeScriptEngine } from "../engines/TypeScriptEngine"
import { MutationClass } from "../../../shared/types"

describe("MutationClassifier (TypeScript)", () => {
	let classifier: MutationClassifier
	let engine: TypeScriptEngine

	beforeAll(() => {
		classifier = MutationClassifier.getInstance()
		engine = new TypeScriptEngine()
		classifier.registerEngine(engine)
	})

	it("should classify identical content as AST_REFACTOR", async () => {
		const code = "const x = 1;"
		const result = await classifier.classify(code, code, "test.ts")
		expect(result.classification).toBe(MutationClass.AST_REFACTOR)
	})

	it("should classify whitespace and comment changes as AST_REFACTOR", async () => {
		const prev = "const x = 1;"
		const curr = "  const   x = 1; // some comment"
		const result = await classifier.classify(prev, curr, "test.ts")
		expect(result.classification).toBe(MutationClass.AST_REFACTOR)
	})

	it("should classify simple variable renames as AST_REFACTOR", async () => {
		const prev = "const x = 1; console.log(x);"
		const curr = "const y = 1; console.log(y);"
		const result = await classifier.classify(prev, curr, "test.ts")
		expect(result.classification).toBe(MutationClass.AST_REFACTOR)
	})

	it("should classify function renames as AST_REFACTOR", async () => {
		const prev = "function foo() { return 1; }"
		const curr = "function bar() { return 1; }"
		const result = await classifier.classify(prev, curr, "test.ts")
		expect(result.classification).toBe(MutationClass.AST_REFACTOR)
	})

	it("should classify adding a logic branch as INTENT_EVOLUTION", async () => {
		const prev = "function foo(x: number) { return x; }"
		const curr = "function foo(x: number) { if (x > 0) return x; return 0; }"
		const result = await classifier.classify(prev, curr, "test.ts")
		expect(result.classification).toBe(MutationClass.INTENT_EVOLUTION)
	})

	it("should classify adding a new function as INTENT_EVOLUTION", async () => {
		const prev = "const x = 1;"
		const curr = "const x = 1; function y() { return 2; }"
		const result = await classifier.classify(prev, curr, "test.ts")
		expect(result.classification).toBe(MutationClass.INTENT_EVOLUTION)
	})

	it("should classify empty files comparison as AST_REFACTOR", async () => {
		const result = await classifier.classify("", "", "test.ts")
		expect(result.classification).toBe(MutationClass.AST_REFACTOR)
	})

	it("should classify file deletion (content to empty) as INTENT_EVOLUTION", async () => {
		const result = await classifier.classify("const x = 1;", "", "test.ts")
		expect(result.classification).toBe(MutationClass.INTENT_EVOLUTION)
	})

	it("should default to INTENT_EVOLUTION on unparseable code", async () => {
		const prev = "const x = 1;"
		const curr = "const x = 1; !!! unexpected syntax !!!"
		const result = await classifier.classify(prev, curr, "test.ts")
		expect(result.classification).toBe(MutationClass.INTENT_EVOLUTION)
	})

	describe("Determinism (User Story 2)", () => {
		it("should yield identical results for 100 consecutive runs on complex input", async () => {
			const prev = `
				interface User { id: number; name: string; }
				function process(u: User): string {
					return u.name.toUpperCase();
				}
			`
			const curr = `
				interface User { id: number; name: string; }
				// Refactored function
				function process(user: User): string {
					return user.name.toUpperCase();
				}
			`

			const results: MutationClass[] = []
			for (let i = 0; i < 100; i++) {
				const res = await classifier.classify(prev, curr, "complex.ts")
				results.push(res.classification)
			}

			const first = results[0]
			expect(first).toBe(MutationClass.AST_REFACTOR)
			results.forEach((res) => {
				expect(res).toBe(first)
			})
		})
	})

	describe("Performance (SC-001)", () => {
		it("should classify 1000 LOC in less than 500ms", async () => {
			const line = "const x = 1; console.log(x);\n"
			const prev = line.repeat(1000)
			const curr = line.repeat(1000).replace("x = 1", "y = 1").replace("(x)", "(y)")

			const start = Date.now()
			const result = await classifier.classify(prev, curr, "large.ts")
			const duration = Date.now() - start

			expect(result.classification).toBe(MutationClass.AST_REFACTOR)
			expect(duration).toBeLessThan(500)
			console.log(`[Benchmark] 1000 LOC took ${duration}ms`)
		})
	})
})
