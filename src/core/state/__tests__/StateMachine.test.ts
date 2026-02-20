import { describe, it, expect, beforeEach, vi } from "vitest"
import { StateMachine } from "../StateMachine"
import { OrchestrationService } from "../../../services/orchestration/OrchestrationService"

describe("StateMachine: Relaxed Handshake Analysis (FR-009)", () => {
	let stateMachine: StateMachine
	let mockOrchestrationService: any

	beforeEach(() => {
		mockOrchestrationService = {
			logTrace: vi.fn().mockResolvedValue(undefined),
		}
		stateMachine = new StateMachine("test-session", mockOrchestrationService as unknown as OrchestrationService)
	})

	describe("isToolAllowed", () => {
		describe("REQUEST state", () => {
			beforeEach(() => {
				stateMachine.reset() // Starts in REQUEST
			})

			it("allows SAFE tools (e.g., read_file)", () => {
				const result = stateMachine.isToolAllowed("read_file")
				expect(result.allowed).toBe(true)
			})

			it("allows select_active_intent (SAFE)", () => {
				const result = stateMachine.isToolAllowed("select_active_intent")
				expect(result.allowed).toBe(true)
			})

			it("blocks DESTRUCTIVE tools (e.g., write_to_file)", () => {
				const result = stateMachine.isToolAllowed("write_to_file")
				expect(result.allowed).toBe(false)
				expect(result.reason).toContain("State Violation")
			})

			it("blocks unknown tools (defaults to DESTRUCTIVE)", () => {
				const result = stateMachine.isToolAllowed("unknown_tool")
				expect(result.allowed).toBe(false)
				expect(result.reason).toContain("State Violation")
			})
		})

		describe("REASONING state", () => {
			beforeEach(async () => {
				await stateMachine.transitionTo("REASONING")
			})

			it("allows SAFE tools (e.g., list_files)", () => {
				const result = stateMachine.isToolAllowed("list_files")
				expect(result.allowed).toBe(true)
			})

			it("blocks DESTRUCTIVE tools (e.g., execute_command)", () => {
				const result = stateMachine.isToolAllowed("execute_command")
				expect(result.allowed).toBe(false)
				expect(result.reason).toContain("State Violation")
			})

			it("blocks apply_diff (DESTRUCTIVE)", () => {
				const result = stateMachine.isToolAllowed("apply_diff")
				expect(result.allowed).toBe(false)
			})
		})

		describe("ACTION state", () => {
			beforeEach(async () => {
				await stateMachine.transitionTo("REASONING")
				await stateMachine.transitionTo("ACTION", "REQ-123")
			})

			it("allows SAFE tools", () => {
				const result = stateMachine.isToolAllowed("read_file")
				expect(result.allowed).toBe(true)
			})

			it("allows DESTRUCTIVE tools", () => {
				const result = stateMachine.isToolAllowed("write_to_file")
				expect(result.allowed).toBe(true)
			})

			it("allows unknown tools", () => {
				const result = stateMachine.isToolAllowed("unknown_tool")
				expect(result.allowed).toBe(true)
			})
		})
	})
})
