/**
 * Shared types for the Roo-Code project.
 */

/**
 * Represents the semantic nature of a file change.
 */
export enum MutationClass {
	/** Structural/Syntax changes with no functional impact (whitespace, renames, comments). */
	AST_REFACTOR = "AST_REFACTOR",
	/** Functional changes (added logic, new exports, modified control flow). */
	INTENT_EVOLUTION = "INTENT_EVOLUTION",
}
