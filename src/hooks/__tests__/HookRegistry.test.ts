import { describe, it, expect, beforeEach, vi } from "vitest"
import { HookRegistry } from "../engine/HookRegistry"
import { IPreHook, IPostHook } from "../engine/types"

describe("HookRegistry", () => {
	let registry: HookRegistry
	let mockEngine: any

	beforeEach(() => {
		registry = new HookRegistry()
		mockEngine = {} as any
	})

	describe("Registration", () => {
		it("T003.1: registers and returns pre-hooks", () => {
			const hook: IPreHook = { id: "test", priority: 1, execute: vi.fn() }
			registry.register("PRE", hook)
			expect(registry.getRegisteredHooks("PRE")).toContain(hook)
		})

		it("T003.2: registers and returns post-hooks", () => {
			const hook: IPostHook = { id: "test", execute: vi.fn() }
			registry.register("POST", hook)
			expect(registry.getRegisteredHooks("POST")).toContain(hook)
		})

		it("T003.3: updates existing hook if same ID is registered", () => {
			const hook1: IPreHook = { id: "test", priority: 1, execute: vi.fn() }
			const hook2: IPreHook = { id: "test", priority: 2, execute: vi.fn() }
			registry.register("PRE", hook1)
			registry.register("PRE", hook2)
			const hooks = registry.getRegisteredHooks("PRE") as IPreHook[]
			expect(hooks.length).toBe(1)
			expect(hooks[0].priority).toBe(2)
		})
	})

	describe("Deregistration", () => {
		it("T003.4: removes pre-hook and updates order", async () => {
			const hook1: IPreHook = {
				id: "h1",
				priority: 1,
				execute: vi.fn().mockResolvedValue({ action: "CONTINUE" }),
			}
			const hook2: IPreHook = {
				id: "h2",
				priority: 2,
				execute: vi.fn().mockResolvedValue({ action: "CONTINUE" }),
			}
			registry.register("PRE", hook1)
			registry.register("PRE", hook2)
			registry.deregister("PRE", "h1")

			const hooks = registry.getRegisteredHooks("PRE")
			expect(hooks.length).toBe(1)
			expect(hooks[0].id).toBe("h2")

			await registry.executePre({} as any, mockEngine)
			expect(hook1.execute).not.toHaveBeenCalled()
		})
	})

	describe("Pre-Hook Execution", () => {
		it("T003.5: executes pre-hooks in priority order", async () => {
			const callOrder: string[] = []
			const hook1: IPreHook = {
				id: "h1",
				priority: 2,
				execute: async () => {
					callOrder.push("h1")
					return { action: "CONTINUE" }
				},
			}
			const hook2: IPreHook = {
				id: "h2",
				priority: 1,
				execute: async () => {
					callOrder.push("h2")
					return { action: "CONTINUE" }
				},
			}

			registry.register("PRE", hook1)
			registry.register("PRE", hook2)

			await registry.executePre({} as any, mockEngine)
			expect(callOrder).toEqual(["h2", "h1"])
		})

		it("T003.6: short-circuits on DENY", async () => {
			const hook1: IPreHook = {
				id: "h1",
				priority: 1,
				execute: async () => ({ action: "DENY", reason: "blocked" }),
			}
			const hook2: IPreHook = { id: "h2", priority: 2, execute: vi.fn() }

			registry.register("PRE", hook1)
			registry.register("PRE", hook2)

			const res = await registry.executePre({} as any, mockEngine)
			expect(res.action).toBe("DENY")
			expect(hook2.execute).not.toHaveBeenCalled()
		})

		it("T003.7: short-circuits on HALT", async () => {
			const hook1: IPreHook = {
				id: "h1",
				priority: 1,
				execute: async () => ({ action: "HALT", reason: "stop" }),
			}
			const hook2: IPreHook = { id: "h2", priority: 2, execute: vi.fn() }

			registry.register("PRE", hook1)
			registry.register("PRE", hook2)

			const res = await registry.executePre({} as any, mockEngine)
			expect(res.action).toBe("HALT")
			expect(hook2.execute).not.toHaveBeenCalled()
		})
	})

	describe("Post-Hook Execution", () => {
		it("T003.8: executes all post-hooks even if some fail", async () => {
			const hook1: IPostHook = {
				id: "h1",
				execute: async () => {
					throw new Error("fail")
				},
			}
			const hook2: IPostHook = { id: "h2", execute: vi.fn() }

			registry.register("POST", hook1)
			registry.register("POST", hook2)

			// Should not throw
			await registry.executePost({} as any, mockEngine)
			expect(hook2.execute).toHaveBeenCalled()
		})
	})
})
