import { MutationClass } from "../../../shared/types"
import { IMutationEngine } from "../types"

/**
 * Base class for mutation engines.
 * Defaults to INTENT_EVOLUTION on any error or unsupported operation.
 */
export abstract class BaseEngine implements IMutationEngine {
	abstract readonly supportedExtensions: string[]

	/**
	 * Performs the language-specific AST comparison.
	 * Subclasses should override this method.
	 */
	abstract compare(previous: string, current: string): MutationClass

	/**
	 * Helper to safely handle classification.
	 */
	protected safeCompare(previous: string, current: string): MutationClass {
		try {
			// Basic checks
			if (previous === current) {
				return MutationClass.AST_REFACTOR
			}
			if (!previous || !current) {
				return MutationClass.INTENT_EVOLUTION
			}
			return this.compare(previous, current)
		} catch (error) {
			console.error(`[${this.constructor.name}] Comparison failed:`, error)
			return MutationClass.INTENT_EVOLUTION
		}
	}
}
