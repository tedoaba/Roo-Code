import { HookResponse } from "../../services/orchestration/types"
import { HookEngine, ToolRequest, ToolResult } from "../HookEngine"
import { IHookRegistry, IPreHook, IPostHook, HookPhase, IHook } from "./types"

/**
 * Central registry for pre-hooks and post-hooks.
 * Implements the Open/Closed Principle for the governance layer.
 */
export class HookRegistry implements IHookRegistry {
	private preHooks: Map<string, IPreHook> = new Map()
	private postHooks: Map<string, IPostHook> = new Map()
	private sortedPreIds: string[] = []

	/**
	 * Register a new hook into a specific phase.
	 * Upserts if id already exists in that phase.
	 */
	register(phase: "PRE", hook: IPreHook): void
	register(phase: "POST", hook: IPostHook): void
	register(phase: HookPhase, hook: any): void {
		if (phase === "PRE") {
			this.preHooks.set(hook.id, hook)
			this.updateSortedPreIds()
		} else {
			this.postHooks.set(hook.id, hook)
		}
	}

	/**
	 * Remove a hook by id.
	 */
	deregister(phase: HookPhase, id: string): void {
		if (phase === "PRE") {
			if (this.preHooks.delete(id)) {
				this.updateSortedPreIds()
			}
		} else {
			this.postHooks.delete(id)
		}
	}

	/**
	 * Keeps the pre-hooks sorted by priority for execution.
	 */
	private updateSortedPreIds(): void {
		this.sortedPreIds = Array.from(this.preHooks.values())
			.sort((a, b) => a.priority - b.priority)
			.map((h) => h.id)
	}

	/**
	 * Run all pre-hooks in priority order.
	 * Short-circuits on first DENY or HALT.
	 */
	async executePre(req: ToolRequest, engine: HookEngine): Promise<HookResponse> {
		for (const id of this.sortedPreIds) {
			const hook = this.preHooks.get(id)
			if (hook) {
				const response = await hook.execute(req, engine)
				if (response.action === "DENY" || response.action === "HALT") {
					return response
				}
			}
		}
		return { action: "CONTINUE" }
	}

	/**
	 * Run all post-hooks sequentially.
	 * Isolates errors from individual hooks to ensure audit trails are preserved.
	 */
	async executePost(result: ToolResult, engine: HookEngine, requestId?: string): Promise<void> {
		for (const hook of this.postHooks.values()) {
			try {
				await hook.execute(result, engine, requestId)
			} catch (error) {
				console.error(`[HookRegistry] Post-hook '${hook.id}' failed (isolated):`, error)
			}
		}
	}

	/**
	 * Returns ordered list of hooks for inspection and debug.
	 */
	getRegisteredHooks(phase: HookPhase): IHook[] {
		if (phase === "PRE") {
			return this.sortedPreIds.map((id) => this.preHooks.get(id)!)
		} else {
			return Array.from(this.postHooks.values())
		}
	}
}
