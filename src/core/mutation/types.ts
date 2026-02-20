import { MutationClass } from "../../shared/types"

/**
 * Mutation Classification Result
 */
export interface MutationClassificationResult {
	classification: MutationClass
	reason?: string
	timestamp: number
	durationMs: number
}

/**
 * Semantic Mutation Classifier interface
 */
export interface IMutationClassifier {
	/**
	 * Classifies a code change between two versions of a file.
	 *
	 * @param previousContent The content before the change
	 * @param newContent The content after the change
	 * @param filename Required to determine the language engine (e.g., .ts, .js)
	 * @returns The classification of the mutation
	 */
	classify(previousContent: string, newContent: string, filename: string): Promise<MutationClassificationResult>
}

/**
 * Language-specific mutation engine interface
 */
export interface IMutationEngine {
	readonly supportedExtensions: string[]

	/**
	 * Performs the language-specific AST comparison.
	 * @returns The classification of the mutation
	 */
	compare(previous: string, current: string): MutationClass
}
