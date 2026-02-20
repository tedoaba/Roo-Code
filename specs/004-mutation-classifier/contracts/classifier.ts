/**
 * Semantic Mutation Classifier Contract
 */

export enum MutationClass {
	AST_REFACTOR = "AST_REFACTOR",
	INTENT_EVOLUTION = "INTENT_EVOLUTION",
}

export interface IMutationClassifier {
	/**
	 * Classifies a code change between two versions of a file.
	 *
	 * @param previousContent The content before the change
	 * @param newContent The content after the change
	 * @param filename Required to determine the language engine (e.g., .ts, .js)
	 * @returns The classification of the mutation
	 */
	classify(previousContent: string, newContent: string, filename: string): Promise<MutationClass>
}

export interface IMutationEngine {
	readonly supportedExtensions: string[]

	/**
	 * Performs the language-specific AST comparison.
	 */
	compare(previous: string, current: string): MutationClass
}
