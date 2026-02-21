/**
 * HookRegistry Functional Contract
 *
 * Defines the public API for the HookRegistry component.
 */

export type HookPhase = "PRE" | "POST"

export interface IHook {
	id: string
}

export interface IPreHook extends IHook {
	priority: number
	execute(req: any, engine: any): Promise<any>
}

export interface IPostHook extends IHook {
	execute(result: any, engine: any, requestId?: string): Promise<void>
}

export interface IHookRegistry {
	/**
	 * Register a new hook into a specific phase.
	 * Upserts if id already exists in that phase.
	 */
	register(phase: "PRE", hook: IPreHook): void
	register(phase: "POST", hook: IPostHook): void

	/**
	 * Remove a hook by id.
	 */
	deregister(phase: HookPhase, id: string): void

	/**
	 * Run all pre-hooks in priority order.
	 * Short-circuits on first DENY/HALT.
	 */
	executePre(req: any, engine: any): Promise<any>

	/**
	 * Run all post-hooks sequentially.
	 * Isolates errors from individual hooks.
	 */
	executePost(result: any, engine: any, requestId?: string): Promise<void>

	/**
	 * Returns ordered list of hooks for inspection.
	 */
	getRegisteredHooks(phase: HookPhase): IHook[]
}
