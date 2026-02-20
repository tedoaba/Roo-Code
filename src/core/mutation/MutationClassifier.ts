import * as path from "path"
import { MutationClass } from "../../shared/types"
import { IMutationClassifier, IMutationEngine, MutationClassificationResult } from "./types"
import { TypeScriptEngine } from "./engines/TypeScriptEngine"

/**
 * MutationClassifier Service
 * Coordinates semantic classification of code changes using language-specific engines.
 */
export class MutationClassifier implements IMutationClassifier {
	private static instance: MutationClassifier
	private engines: Map<string, IMutationEngine> = new Map()

	private constructor() {
		// Register default engines
		this.registerEngine(new TypeScriptEngine())
	}

	public static getInstance(): MutationClassifier {
		if (!MutationClassifier.instance) {
			MutationClassifier.instance = new MutationClassifier()
		}
		return MutationClassifier.instance
	}

	/**
	 * Register a language engine.
	 */
	public registerEngine(engine: IMutationEngine): void {
		for (const ext of engine.supportedExtensions) {
			this.engines.set(ext.toLowerCase(), engine)
		}
	}

	/**
	 * Classifies a code change.
	 */
	public async classify(
		previousContent: string,
		newContent: string,
		filename: string,
	): Promise<MutationClassificationResult> {
		const startTime = Date.now()
		const ext = path.extname(filename).toLowerCase()
		const engine = this.engines.get(ext)

		let classification: MutationClass = MutationClass.INTENT_EVOLUTION
		let reason: string | undefined

		try {
			if (!engine) {
				classification = MutationClass.INTENT_EVOLUTION
				reason = `No engine registered for extension: ${ext}`
			} else if (previousContent === newContent) {
				classification = MutationClass.AST_REFACTOR
				reason = "Contents are identical"
			} else {
				classification = engine.compare(previousContent, newContent)
			}
		} catch (error) {
			console.error(`[MutationClassifier] Error during classification for ${filename}:`, error)
			classification = MutationClass.INTENT_EVOLUTION
			reason = `Classification error: ${error instanceof Error ? error.message : String(error)}`
		}

		const durationMs = Date.now() - startTime

		return {
			classification,
			reason,
			timestamp: startTime,
			durationMs,
		}
	}
}
