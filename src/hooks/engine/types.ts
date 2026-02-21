import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest, ToolResult } from "../HookEngine"

export type HookPhase = "PRE" | "POST"

export interface IHook {
	id: string
}

export interface IPreHook extends IHook {
	priority: number
	execute(req: ToolRequest, engine: HookEngine): Promise<HookResponse>
}

export interface IPostHook extends IHook {
	execute(result: ToolResult, engine: HookEngine, requestId?: string): Promise<void>
}

export interface IHookRegistry {
	register(phase: "PRE", hook: IPreHook): void
	register(phase: "POST", hook: IPostHook): void
	deregister(phase: HookPhase, id: string): void
	executePre(req: ToolRequest, engine: HookEngine): Promise<HookResponse>
	executePost(result: ToolResult, engine: HookEngine, requestId?: string): Promise<void>
	getRegisteredHooks(phase: HookPhase): IHook[]
}
