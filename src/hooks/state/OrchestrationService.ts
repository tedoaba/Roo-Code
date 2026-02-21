import * as fs from "fs/promises"
import * as path from "path"
import * as crypto from "crypto"
import * as yaml from "js-yaml"
import * as vscode from "vscode"
import ignore, { Ignore } from "ignore"
import {
	ActiveIntent,
	IntentStatus,
	IntentContextBlock,
	ScopeValidationResult,
} from "../../services/orchestration/types"
import { AgentTraceEntry } from "../contracts/AgentTrace"

interface ActiveIntentsFile {
	active_intents?: ActiveIntent[]
	intents?: ActiveIntent[]
}

/** Maximum number of files an intent's owned_scope can cover */
const MAX_SCOPE_FILES = 20

/** Root-level glob patterns that are too broad to be auditable */
const BROAD_GLOB_PATTERNS = ["**/*", "*", "src/**/*", "**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"]

export class OrchestrationService {
	private intentsFile: string
	private traceFile: string
	private intentMapFile: string
	private orchestrationDir: string
	private workspaceRoot: string
	private intentIgnoreFile: string
	private intentIgnoreInstance: Ignore | null = null
	private intentIgnoreWatcher: vscode.Disposable | null = null

	constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot
		this.orchestrationDir = path.join(workspaceRoot, ".orchestration")
		this.intentsFile = path.join(this.orchestrationDir, "active_intents.yaml")
		this.traceFile = path.join(this.orchestrationDir, "agent_trace.jsonl")
		this.intentMapFile = path.join(this.orchestrationDir, "intent_map.md")
		this.intentIgnoreFile = path.join(workspaceRoot, ".intentignore")
		// Load .intentignore and start watching
		this.loadIntentIgnore().catch(() => {})
		this.watchIntentIgnore()
	}

	// ── .intentignore Loading & Watching (T004) ──

	/**
	 * Load and parse the .intentignore file from the workspace root.
	 * Uses the `ignore` library (gitignore syntax).
	 */
	async loadIntentIgnore(): Promise<void> {
		try {
			const content = await fs.readFile(this.intentIgnoreFile, "utf8")
			this.intentIgnoreInstance = ignore().add(content)
		} catch (error: any) {
			if (error.code === "ENOENT") {
				// No .intentignore file — no restrictions
				this.intentIgnoreInstance = null
			} else {
				console.warn("Failed to load .intentignore:", error.message)
				this.intentIgnoreInstance = null
			}
		}
	}

	/**
	 * Watch the .intentignore file for changes and reload automatically.
	 */
	private watchIntentIgnore(): void {
		try {
			const watcher = vscode.workspace.createFileSystemWatcher(
				new vscode.RelativePattern(this.workspaceRoot, ".intentignore"),
			)
			watcher.onDidChange(() => this.loadIntentIgnore())
			watcher.onDidCreate(() => this.loadIntentIgnore())
			watcher.onDidDelete(() => {
				this.intentIgnoreInstance = null
			})
			this.intentIgnoreWatcher = watcher
		} catch {
			// VS Code API may not be available in all contexts
		}
	}

	/**
	 * Check if a file path is excluded by .intentignore patterns.
	 * Returns true if the file SHOULD BE BLOCKED.
	 */
	isIntentIgnored(filePath: string): boolean {
		if (!this.intentIgnoreInstance) return false
		let relativePath = filePath
		if (path.isAbsolute(filePath)) {
			relativePath = path.relative(this.workspaceRoot, filePath)
		}
		relativePath = relativePath.split(path.sep).join("/")
		return this.intentIgnoreInstance.ignores(relativePath)
	}

	/**
	 * Dispose of the .intentignore file watcher.
	 */
	disposeIntentIgnoreWatcher(): void {
		if (this.intentIgnoreWatcher) {
			this.intentIgnoreWatcher.dispose()
			this.intentIgnoreWatcher = null
		}
	}

	async getActiveIntents(): Promise<ActiveIntent[]> {
		try {
			const content = await fs.readFile(this.intentsFile, "utf8")
			const data = yaml.load(content) as ActiveIntentsFile
			const rawIntents = data.active_intents || data.intents || []
			return rawIntents.map((intent: any) => ({
				...intent,
				constraints: intent.constraints || [],
				owned_scope: intent.owned_scope || [],
				acceptance_criteria: intent.acceptance_criteria || [],
				related_specs: intent.related_specs || [],
			})) as ActiveIntent[]
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

		// T005: .intentignore takes HIGHEST precedence (Additive Override)
		// If a path matches .intentignore, it is ALWAYS blocked regardless of owned_scope
		if (this.isIntentIgnored(relativePath)) {
			return {
				allowed: false,
				reason: `File '${relativePath}' is excluded by .intentignore. This file is globally protected and cannot be modified by any intent.`,
			}
		}

		if (!intent.owned_scope || intent.owned_scope.length === 0) {
			return { allowed: false, reason: `Intent ${intentId} has no defined scope.` }
		}

		const scopeMatcher = ignore().add(intent.owned_scope)
		const isAllowed =
			scopeMatcher.ignores(relativePath) ||
			scopeMatcher.ignores(`${relativePath}/`) ||
			intent.owned_scope.includes(relativePath)

		if (isAllowed) {
			return { allowed: true }
		}

		return {
			allowed: false,
			reason: `Scope Violation: ${intentId} is not authorized to edit '${relativePath}'. Request scope expansion. Allowed scopes: ${intent.owned_scope.join(", ")}`,
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

	// ── T001-T004: Orchestration Directory Initialization ──

	/**
	 * Initialize the .orchestration/ directory with default sidecar files.
	 * Idempotent: only creates files that don't already exist.
	 */
	async initializeOrchestration(): Promise<void> {
		await fs.mkdir(this.orchestrationDir, { recursive: true })

		// T002: active_intents.yaml
		try {
			await fs.access(this.intentsFile)
		} catch {
			const defaultIntents = yaml.dump({ active_intents: [] })
			await fs.writeFile(this.intentsFile, defaultIntents, "utf8")
		}

		// T003: agent_trace.jsonl
		try {
			await fs.access(this.traceFile)
		} catch {
			await fs.writeFile(this.traceFile, "", "utf8")
		}

		// T004: intent_map.md
		try {
			await fs.access(this.intentMapFile)
		} catch {
			const defaultMap = ["# Intent Map", "", "_No intents have been mapped yet._"].join("\n")
			await fs.writeFile(this.intentMapFile, defaultMap, "utf8")
		}
	}

	// ── T008: SHA-256 Helper ──

	/**
	 * Compute a SHA-256 hash of the given content string.
	 */
	computeHash(content: string): string {
		return crypto.createHash("sha256").update(content, "utf8").digest("hex")
	}

	// ── T013: Intent Validation (broad scope rejection) ──

	/**
	 * Validate an intent's scope before selection.
	 * Rejects root-level broad globs and scopes covering more than MAX_SCOPE_FILES.
	 */
	async validateIntentScope(intentId: string): Promise<ScopeValidationResult> {
		const intent = await this.getIntent(intentId)
		if (!intent) {
			return { allowed: false, reason: `Intent ${intentId} not found` }
		}

		if (!intent.owned_scope || intent.owned_scope.length === 0) {
			return { allowed: false, reason: `Intent ${intentId} has no defined scope.` }
		}

		// Check for overly broad glob patterns
		for (const pattern of intent.owned_scope) {
			const normalized = pattern.replace(/\\/g, "/")
			if (BROAD_GLOB_PATTERNS.includes(normalized)) {
				return {
					allowed: false,
					reason: `Intent scope contains overly broad pattern '${pattern}'. Use more specific globs for auditable changes (max ${MAX_SCOPE_FILES} files).`,
				}
			}
		}

		// Check total file count against limit
		if (intent.owned_scope.length > MAX_SCOPE_FILES) {
			return {
				allowed: false,
				reason: `Intent scope covers ${intent.owned_scope.length} patterns, exceeding the maximum of ${MAX_SCOPE_FILES}. Break the intent into smaller, focused sub-intents.`,
			}
		}

		return { allowed: true }
	}

	// ── T020-T023: Audit Ledger & Intent Map ──

	/**
	 * Log a mutation with SHA-256 hash and update intent_map.md.
	 */
	async logMutation(intentId: string, filePath: string, content: string): Promise<string> {
		const hash = this.computeHash(content)

		// Log to agent_trace.jsonl
		await this.logTrace({
			trace_id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			mutation_class: "INTENT_EVOLUTION",
			intent_id: intentId,
			related: [intentId],
			ranges: {
				file: filePath,
				content_hash: `sha256:${hash}`,
				start_line: 1,
				end_line: -1,
			},
			actor: "roo-code-agent",
			summary: `Wrote to ${filePath}`,
			contributor: { entity_type: "AI", model_identifier: "roo-code" },
			action_type: "TOOL_EXECUTION",
			payload: {
				tool_name: "write_to_file",
				target_files: [filePath],
			},
			result: {
				status: "SUCCESS",
				output_summary: `Wrote to ${filePath}`,
				content_hash: `sha256:${hash}`,
			},
			metadata: {
				session_id: "current",
			},
		})

		// Update intent_map.md
		await this.updateIntentMap(filePath, intentId, hash)

		return hash
	}

	/**
	 * Update the intent_map.md with the latest file hash and owning intent.
	 */
	async updateIntentMap(filePath: string, intentId: string, hash: string): Promise<void> {
		let relativePath = filePath
		if (path.isAbsolute(filePath)) {
			relativePath = path.relative(this.workspaceRoot, filePath)
		}
		relativePath = relativePath.split(path.sep).join("/")

		try {
			let content = await fs.readFile(this.intentMapFile, "utf8")
			const lines = content.split("\n")

			// Find existing entry for this file
			const entryIndex = lines.findIndex((line) => line.includes(`\`${relativePath}\``))
			const newEntry = `| \`${relativePath}\` | \`${intentId}\` | \`sha256:${hash.slice(0, 8)}...\` | Yes |`

			if (entryIndex >= 0) {
				lines[entryIndex] = newEntry
			} else {
				// Add after the table header separator (line index 3 in default format)
				const separatorIndex = lines.findIndex((line) => line.startsWith("| :---"))
				if (separatorIndex >= 0) {
					lines.splice(separatorIndex + 1, 0, newEntry)
				} else {
					lines.push(newEntry)
				}
			}

			await fs.writeFile(this.intentMapFile, lines.join("\n"), "utf8")
		} catch (error: any) {
			if (error.code === "ENOENT") {
				// If the file doesn't exist, create it with the entry
				const newContent = [
					"# Intent Map",
					"",
					"| File Path | Owning Intent ID | Last Hash | Prov. Locked? |",
					"| :--- | :--- | :--- | :--- |",
					`| \`${relativePath}\` | \`${intentId}\` | \`sha256:${hash.slice(0, 8)}...\` | Yes |`,
					"",
				].join("\n")
				await fs.mkdir(path.dirname(this.intentMapFile), { recursive: true })
				await fs.writeFile(this.intentMapFile, newContent, "utf8")
			} else {
				throw error
			}
		}
	}

	/**
	 * Check file ownership contention in intent_map.md.
	 * Returns the owning intent ID if the file is locked by another intent.
	 */
	async checkFileOwnership(filePath: string, currentIntentId: string): Promise<string | null> {
		let relativePath = filePath
		if (path.isAbsolute(filePath)) {
			relativePath = path.relative(this.workspaceRoot, filePath)
		}
		relativePath = relativePath.split(path.sep).join("/")

		try {
			const content = await fs.readFile(this.intentMapFile, "utf8")
			const lines = content.split("\n")

			for (const line of lines) {
				if (line.includes(`\`${relativePath}\``) && line.includes("| Yes |")) {
					// Extract the owning intent ID
					const match = line.match(/\|\s*`([^`]+)`\s*\|\s*`([^`]+)`/)
					if (match && match[2] !== currentIntentId) {
						return match[2]
					}
				}
			}
		} catch {
			// File doesn't exist → no contention
		}

		return null
	}

	/**
	 * Get all file paths tracked in intent_map.md as absolute paths.
	 */
	async getMappedPaths(): Promise<string[]> {
		const mappedPaths: string[] = []
		try {
			const content = await fs.readFile(this.intentMapFile, "utf8")
			const lines = content.split("\n")

			for (const line of lines) {
				const match = line.match(/\|\s*`([^`]+)`/)
				if (match && match[1] && !match[1].includes("File Path")) {
					mappedPaths.push(path.join(this.workspaceRoot, match[1]))
				}
			}
		} catch {
			// File doesn't exist → no mapped paths
		}
		return mappedPaths
	}

	// ── T017: Shared Brain Loading ──

	/**
	 * Load Shared Brain content from AGENT.md or CLAUDE.md in the workspace root.
	 */
	async loadSharedBrain(): Promise<string | null> {
		const candidates = ["AGENT.md", "CLAUDE.md"]
		for (const filename of candidates) {
			try {
				const content = await fs.readFile(path.join(this.workspaceRoot, filename), "utf8")
				return content
			} catch {
				continue
			}
		}
		return null
	}

	/**
	 * Append a lesson to the Shared Brain file.
	 */
	async appendToSharedBrain(lesson: string): Promise<void> {
		const brainFile = path.join(this.workspaceRoot, "AGENT.md")
		const timestamp = new Date().toISOString()
		const entry = `\n\n## Lesson Learned (${timestamp})\n\n${lesson}\n`
		try {
			await fs.appendFile(brainFile, entry, "utf8")
		} catch (error: any) {
			if (error.code === "ENOENT") {
				await fs.writeFile(brainFile, `# Shared Brain\n${entry}`, "utf8")
			} else {
				throw error
			}
		}
	}

	// ── T025-T026: Budget Tracking ──

	/**
	 * Update budget consumption for an intent.
	 * Returns whether the intent is within budget.
	 */
	async updateBudget(
		intentId: string,
		addTurns: number = 1,
		addTokens: number = 0,
	): Promise<{ withinBudget: boolean; reason?: string }> {
		const intents = await this.getActiveIntents()
		const intent = intents.find((i) => i.id === intentId)
		if (!intent) {
			return { withinBudget: false, reason: `Intent ${intentId} not found` }
		}

		if (!intent.budget) {
			// No budget defined → always within budget
			return { withinBudget: true }
		}

		intent.budget.consumed_turns = (intent.budget.consumed_turns || 0) + addTurns
		intent.budget.consumed_tokens = (intent.budget.consumed_tokens || 0) + addTokens

		// Check limits
		if (intent.budget.max_turns && intent.budget.consumed_turns > intent.budget.max_turns) {
			intent.status = "BLOCKED"
			await this.saveIntents(intents)
			return {
				withinBudget: false,
				reason: `Turn limit exceeded (${intent.budget.consumed_turns}/${intent.budget.max_turns}). Intent marked BLOCKED.`,
			}
		}

		if (intent.budget.max_tokens && intent.budget.consumed_tokens > intent.budget.max_tokens) {
			intent.status = "BLOCKED"
			await this.saveIntents(intents)
			return {
				withinBudget: false,
				reason: `Token limit exceeded (${intent.budget.consumed_tokens}/${intent.budget.max_tokens}). Intent marked BLOCKED.`,
			}
		}

		await this.saveIntents(intents)
		return { withinBudget: true }
	}

	/**
	 * Update the status of an intent and save.
	 */
	async updateIntentStatus(intentId: string, status: IntentStatus): Promise<void> {
		const intents = await this.getActiveIntents()
		const intent = intents.find((i) => i.id === intentId)
		if (intent) {
			intent.status = status
			await this.saveIntents(intents)
		}
	}

	/**
	 * Save the intents array back to the YAML file.
	 */
	public async saveIntents(intents: ActiveIntent[]): Promise<void> {
		const content = yaml.dump({ active_intents: intents })
		await fs.writeFile(this.intentsFile, content, "utf8")
	}

	// ── T029: Fail-Safe Default ──

	/**
	 * Check if the orchestration directory is healthy.
	 * Returns false if .orchestration/ is missing or corrupted.
	 */
	async isOrchestrationHealthy(): Promise<boolean> {
		try {
			await fs.access(this.orchestrationDir)
			await fs.access(this.intentsFile)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Verify integrity of a file by comparing its current hash to the stored hash.
	 */
	async verifyIntegrity(filePath: string): Promise<boolean> {
		try {
			const content = await fs.readFile(filePath, "utf8")
			const currentHash = this.computeHash(content)

			// Read stored hash from intent_map.md
			let relativePath = filePath
			if (path.isAbsolute(filePath)) {
				relativePath = path.relative(this.workspaceRoot, filePath)
			}
			relativePath = relativePath.split(path.sep).join("/")

			const mapContent = await fs.readFile(this.intentMapFile, "utf8")
			const entryLine = mapContent.split("\n").find((line) => line.includes(`\`${relativePath}\``))
			if (!entryLine) return false

			// Extract the stored hash prefix
			const hashMatch = entryLine.match(/sha256:([a-f0-9]+)/)
			if (!hashMatch) return false

			return currentHash.startsWith(hashMatch[1])
		} catch {
			return false
		}
	}

	// ── T023b: Functional Scope Extraction (Invariant 11) ──

	/**
	 * Extract functional scope (top-level symbols) from a file using VS Code's DocumentSymbolProvider.
	 */
	async extractFunctionalScope(filePath: string): Promise<string[]> {
		try {
			const uri = vscode.Uri.file(filePath)
			// Open document to ensure language server is active
			try {
				await vscode.workspace.openTextDocument(uri)
			} catch {
				// File might not exist yet or can't be opened
				return []
			}
			// Small delay for language server to warm up/parse (might not be needed but safer)
			await new Promise((resolve) => setTimeout(resolve, 50))

			const symbols = (await vscode.commands.executeCommand(
				"vscode.executeDocumentSymbolProvider",
				uri,
			)) as vscode.DocumentSymbol[]

			if (!symbols) return []

			const names: string[] = []
			for (const symbol of symbols) {
				if (
					symbol.kind === vscode.SymbolKind.Function ||
					symbol.kind === vscode.SymbolKind.Method ||
					symbol.kind === vscode.SymbolKind.Class ||
					symbol.kind === vscode.SymbolKind.Interface
				) {
					names.push(symbol.name)
				}
			}
			return names
		} catch (error) {
			console.warn(`Failed to extract symbols for ${filePath}:`, error)
			return []
		}
	}

	// ── T024b: Retroactive Provenance Resolver (FR-012) ──

	/**
	 * Find intents that produced a specific content hash by scanning the audit trace.
	 */
	async findIntentsByHash(hash: string): Promise<string[]> {
		const targetHash = hash.startsWith("sha256:") ? hash : `sha256:${hash}`
		const intents = new Set<string>()

		try {
			const content = await fs.readFile(this.traceFile, "utf8")
			const lines = content.split("\n").filter((line) => line.trim() !== "")

			for (const line of lines) {
				try {
					const entry = JSON.parse(line) as AgentTraceEntry
					if (entry.result.content_hash === targetHash && entry.intent_id) {
						intents.add(entry.intent_id)
					}
				} catch {
					// skip malformed lines
				}
			}
		} catch (error: any) {
			if (error.code !== "ENOENT") throw error
		}

		return Array.from(intents)
	}

	/**
	 * T024: Verify spatial independence by checking if content can be re-linked
	 * to its original intent using the hash, even if the file moves.
	 */
	async verifyRelinkage(content: string): Promise<string | null> {
		const hash = this.computeHash(content)
		const intents = await this.findIntentsByHash(hash)
		return intents.length > 0 ? intents[0] : null
	}
}
