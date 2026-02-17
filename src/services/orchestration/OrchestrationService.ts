import * as fs from "fs/promises"
import * as path from "path"
import * as yaml from "js-yaml"
import { minimatch } from "minimatch"
import { ActiveIntent, IntentStatus, AgentTraceEntry, IntentContextBlock, ScopeValidationResult } from "./types"

interface ActiveIntentsFile {
	intents: ActiveIntent[]
}

export class OrchestrationService {
	private intentsFile: string
	private traceFile: string
	private workspaceRoot: string

	constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot
		this.intentsFile = path.join(workspaceRoot, ".orchestration", "active_intents.yaml")
		this.traceFile = path.join(workspaceRoot, ".orchestration", "agent_trace.jsonl")
	}

	async getActiveIntents(): Promise<ActiveIntent[]> {
		try {
			const content = await fs.readFile(this.intentsFile, "utf8")
			const data = yaml.load(content) as ActiveIntentsFile
			return data.intents || []
		} catch (error: any) {
			if (error.code === "ENOENT") {
				return []
			}
			throw error
		}
	}

	async getIntent(id: string): Promise<ActiveIntent | undefined> {
		const intents = await this.getActiveIntents()
		return intents.find((intent) => intent.id === id)
	}

	async logTrace(entry: AgentTraceEntry): Promise<void> {
		const line = JSON.stringify(entry) + "\n"
		// Ensure directory exists if needed?
		// Assuming .orchestration exists as per prerequisites.
		try {
			await fs.appendFile(this.traceFile, line, "utf8")
		} catch (error: any) {
			// If ENOENT, maybe directory missing?
			if (error.code === "ENOENT") {
				// Try to mkdir and retry?
				const dir = path.dirname(this.traceFile)
				await fs.mkdir(dir, { recursive: true })
				await fs.appendFile(this.traceFile, line, "utf8")
			} else {
				throw error
			}
		}
	}

	async validateScope(intentId: string, filePath: string): Promise<ScopeValidationResult> {
		const intent = await this.getIntent(intentId)
		if (!intent) {
			return { allowed: false, reason: `Intent ${intentId} not found` }
		}

		let relativePath = filePath
		if (path.isAbsolute(filePath)) {
			relativePath = path.relative(this.workspaceRoot, filePath)
		}
		// Normalize slashes
		relativePath = relativePath.split(path.sep).join("/")

		if (!intent.owned_scope || intent.owned_scope.length === 0) {
			return { allowed: false, reason: `Intent ${intentId} has no defined scope.` }
		}

		const isAllowed = intent.owned_scope.some((pattern) => minimatch(relativePath, pattern))

		if (isAllowed) {
			return { allowed: true }
		}

		return {
			allowed: false,
			reason: `File '${relativePath}' is not in scope for intent '${intentId}'. Allowed scopes: ${intent.owned_scope.join(", ")}`,
		}
	}

	async getIntentContext(id: string): Promise<IntentContextBlock | undefined> {
		const intent = await this.getIntent(id)
		if (!intent) return undefined

		let history: AgentTraceEntry[] = []
		try {
			const content = await fs.readFile(this.traceFile, "utf8")
			const lines = content.split("\n").filter((line) => line.trim() !== "")
			history = lines
				.map((line) => {
					try {
						return JSON.parse(line) as AgentTraceEntry
					} catch {
						return null
					}
				})
				.filter((entry): entry is AgentTraceEntry => entry !== null && entry.intent_id === id)
			history = history.slice(-50)
		} catch (error: any) {
			if (error.code !== "ENOENT") throw error
		}

		return {
			intent,
			history,
			related_files: [],
		}
	}

	async getLastActiveIntentId(): Promise<string | undefined> {
		try {
			const content = await fs.readFile(this.traceFile, "utf8")
			const lines = content.split("\n").filter((line) => line.trim() !== "")
			for (let i = lines.length - 1; i >= 0; i--) {
				try {
					const entry = JSON.parse(lines[i]) as AgentTraceEntry
					if (entry.action_type === "INTENT_SELECTION" && entry.intent_id) {
						return entry.intent_id
					}
				} catch {
					continue
				}
			}
		} catch (error: any) {
			if (error.code !== "ENOENT") throw error
		}
		return undefined
	}
}
