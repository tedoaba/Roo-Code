import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest } from "../HookEngine"
import { IPreHook } from "../engine/types"

interface ToolCallRecord {
	toolName: string
	paramsHash: string
	count: number
}

const CIRCUIT_BREAKER_THRESHOLD = 3

/**
 * Circuit Breaker Hook (Law 4.6)
 * Detects identical tool call loops and halts execution to prevent resource exhaustion.
 */
export class CircuitBreakerHook implements IPreHook {
	id = "circuit-breaker"
	priority = 50
	private lastToolCalls: ToolCallRecord[] = []

	async execute(req: ToolRequest, _engine: HookEngine): Promise<HookResponse> {
		const paramsHash = this.hashParams(req.params)
		const existing = this.lastToolCalls.find((r) => r.toolName === req.toolName && r.paramsHash === paramsHash)

		if (existing) {
			existing.count++
			if (existing.count >= CIRCUIT_BREAKER_THRESHOLD) {
				return {
					action: "HALT",
					reason: "Circuit Breaker Tripped",
					details: `Circuit Breaker Tripped: Tool '${req.toolName}' called ${existing.count} times with identical parameters. Execution halted to prevent infinite loops. Intent will be marked BLOCKED.`,
					recovery_hint: "Break the loop by trying a different approach or different parameters.",
				}
			}
		} else {
			// Reset tracking when a different tool/params combo is used
			this.lastToolCalls = [{ toolName: req.toolName, paramsHash, count: 1 }]
		}

		return { action: "CONTINUE" }
	}

	private hashParams(params: any): string {
		try {
			return JSON.stringify(params)
		} catch {
			return ""
		}
	}

	/**
	 * Reset the circuit breaker tracking.
	 */
	reset(): void {
		this.lastToolCalls = []
	}
}
