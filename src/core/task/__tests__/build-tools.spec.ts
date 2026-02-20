import { buildNativeToolsArray } from "../build-tools"
import { ClineProvider } from "../../webview/ClineProvider"
import { COMMAND_CLASSIFICATION } from "../../../services/orchestration/types"
import { ModeConfig, ProviderSettings } from "@roo-code/types"

// Mock the dependencies that buildNativeToolsArray uses
vi.mock("../../../services/roo-config/index.js", () => ({
	getRooDirectoriesForCwd: vi.fn().mockReturnValue([]),
}))

vi.mock("../../prompts/tools/native-tools", () => ({
	getNativeTools: vi.fn().mockReturnValue([
		{ type: "function", function: { name: "read_file" } },
		{ type: "function", function: { name: "write_to_file" } },
		{ type: "function", function: { name: "execute_command" } },
		{ type: "function", function: { name: "select_active_intent" } },
	]),
	getMcpServerTools: vi.fn().mockReturnValue([]),
}))

vi.mock("../../prompts/tools/filter-tools-for-mode", () => ({
	filterNativeToolsForMode: vi.fn((tools) => tools),
	filterMcpToolsForMode: vi.fn((tools) => tools),
	resolveToolAlias: vi.fn((name) => name),
}))

vi.mock("../../../services/code-index/manager", () => ({
	CodeIndexManager: {
		getInstance: vi.fn().mockReturnValue({}),
	},
}))

describe("buildNativeToolsArray Execution State Filtering", () => {
	let mockProvider: any

	beforeEach(() => {
		mockProvider = {
			getMcpHub: vi.fn().mockReturnValue({
				getServers: vi.fn().mockReturnValue([]),
			}),
			context: {
				globalStorageUri: { fsPath: "/mock/storage" },
			},
		}
	})

	it("should return only SAFE tools and select_active_intent when in REASONING state", async () => {
		const options = {
			provider: mockProvider as any,
			cwd: "/mock/cwd",
			mode: "code",
			customModes: [],
			experiments: {},
			apiConfiguration: {} as ProviderSettings,
			currentState: "REASONING" as const,
		}

		const tools = await buildNativeToolsArray(options)
		const toolNames = tools.map((t: any) => t.function.name)

		// read_file is SAFE
		expect(toolNames).toContain("read_file")
		// select_active_intent is explicitly allowed
		expect(toolNames).toContain("select_active_intent")

		// write_to_file is DESTRUCTIVE
		expect(toolNames).not.toContain("write_to_file")
		// execute_command is DESTRUCTIVE
		expect(toolNames).not.toContain("execute_command")
	})

	it("should return only SAFE tools and select_active_intent when in REQUEST state", async () => {
		const options = {
			provider: mockProvider as any,
			cwd: "/mock/cwd",
			mode: "code",
			customModes: [],
			experiments: {},
			apiConfiguration: {} as ProviderSettings,
			currentState: "REQUEST" as const,
		}

		const tools = await buildNativeToolsArray(options)
		const toolNames = tools.map((t: any) => t.function.name)

		expect(toolNames).toContain("read_file")
		expect(toolNames).toContain("select_active_intent")
		expect(toolNames).not.toContain("write_to_file")
		expect(toolNames).not.toContain("execute_command")
	})

	it("should return all tools according to mode when in ACTION state (User Story 2 preview)", async () => {
		const options = {
			provider: mockProvider as any,
			cwd: "/mock/cwd",
			mode: "code",
			customModes: [],
			experiments: {},
			apiConfiguration: {} as ProviderSettings,
			currentState: "ACTION" as const,
		}

		const tools = await buildNativeToolsArray(options)
		const toolNames = tools.map((t: any) => t.function.name)

		expect(toolNames).toContain("read_file")
		expect(toolNames).toContain("select_active_intent")
		expect(toolNames).toContain("write_to_file")
		expect(toolNames).toContain("execute_command")
	})

	it("should consume significantly less budget (serialized size) in REASONING vs ACTION (User Story 3)", async () => {
		const baseOptions = {
			provider: mockProvider as any,
			cwd: "/mock/cwd",
			mode: "code",
			customModes: [],
			experiments: {},
			apiConfiguration: {} as ProviderSettings,
		}

		const reasoningTools = await buildNativeToolsArray({ ...baseOptions, currentState: "REASONING" })
		const actionTools = await buildNativeToolsArray({ ...baseOptions, currentState: "ACTION" })

		const reasoningSize = JSON.stringify(reasoningTools).length
		const actionSize = JSON.stringify(actionTools).length

		expect(reasoningSize).toBeLessThan(actionSize)
		// Specifically, REASONING should only have 2 tools (read_file, select_active_intent)
		// while ACTION has 4 tools.
		expect(reasoningTools.length).toBe(2)
		expect(actionTools.length).toBe(4)
	})
})
