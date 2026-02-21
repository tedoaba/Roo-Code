import { describe, it, expect } from "vitest"
import * as fs from "fs/promises"
import * as path from "path"
import { AgentTraceEntry } from "../AgentTrace"

describe("AgentTraceEntry (Canonical definition) - SC-001 Validation", () => {
	it("SC-001: should have exactly one canonical definition in src/", async () => {
		const srcDir = path.join(__dirname, "..", "..", "..")

		const typesPath = path.join(srcDir, "services", "orchestration", "types.ts")
		const typesContent = await fs.readFile(typesPath, "utf8")
		expect(typesContent).not.toMatch(/export interface AgentTraceEntry\s*\{/)

		const contractsPath = path.join(srcDir, "hooks", "contracts", "AgentTrace.ts")
		const contractsContent = await fs.readFile(contractsPath, "utf8")
		expect(contractsContent).toMatch(/export interface AgentTraceEntry\s*\{/)
	})

	it("FR-008: should keep ILedgerManager co-located in contracts", async () => {
		const srcDir = path.join(__dirname, "..", "..", "..")
		const contractsPath = path.join(srcDir, "hooks", "contracts", "AgentTrace.ts")
		const contractsContent = await fs.readFile(contractsPath, "utf8")
		expect(contractsContent).toMatch(/export interface ILedgerManager\s*\{/)
	})

	it("Expected fields are typed correctly (compile time check)", () => {
		const entry: AgentTraceEntry = {
			trace_id: "test_trace_id",
			timestamp: "2026-02-21T00:00:00Z",
			mutation_class: "file",
			intent_id: "test_intent_id",
			related: ["INT-001"],
			ranges: {
				file: "example.ts",
				content_hash: "sha256:abcd",
				start_line: 1,
				end_line: 10,
			},
			actor: "roo-code",
			summary: "test summary",
			contributor: { entity_type: "AI", model_identifier: "roo-code" },
			state: "REQUEST",
			action_type: "TOOL_EXECUTION",
			payload: { foo: "bar" },
			result: { success: true },
			metadata: { session_id: "session_123", vcs_ref: "abcdef" },
		}
		expect(entry.actor).toBe("roo-code")
		expect(entry.contributor?.entity_type).toBe("AI")
	})

	it("SC-003: Contributor type should accept AI and HUMAN", () => {
		const aiEntry: AgentTraceEntry = {
			trace_id: "t1",
			timestamp: "2026-02-21T00:00:00Z",
			mutation_class: "mc",
			intent_id: "i1",
			related: [],
			ranges: { file: "f", content_hash: "h", start_line: 1, end_line: 1 },
			actor: "a",
			summary: "s",
			contributor: { entity_type: "AI", model_identifier: "roo-code" },
		}

		const humanEntry: AgentTraceEntry = {
			trace_id: "t2",
			timestamp: "2026-02-21T00:00:00Z",
			mutation_class: "mc",
			intent_id: "i1",
			related: [],
			ranges: { file: "f", content_hash: "h", start_line: 1, end_line: 1 },
			actor: "h",
			summary: "s",
			contributor: { entity_type: "HUMAN" },
		}

		expect(aiEntry.contributor?.entity_type).toBe("AI")
		expect(humanEntry.contributor?.entity_type).toBe("HUMAN")
	})
})
