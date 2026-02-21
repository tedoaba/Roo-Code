import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest } from "../HookEngine"
import { IPreHook } from "../engine/types"
import { StateMachine } from "../../core/state/StateMachine"

/**
 * State-based tool filtering hook (Invariant 9).
 * Ensures tools are only allowed in valid execution states.
 */
export class StateCheckHook implements IPreHook {
	id = "state-check"
	priority = 2

	constructor(private stateMachine: StateMachine) {}

	async execute(req: ToolRequest, _engine: HookEngine): Promise<HookResponse> {
		const stateCheck = this.stateMachine.isToolAllowed(req.toolName)
		if (!stateCheck.allowed) {
			return { action: "DENY", reason: stateCheck.reason }
		}
		return { action: "CONTINUE" }
	}
}
