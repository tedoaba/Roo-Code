import * as ts from "typescript"
import { MutationClass } from "../../../shared/types"
import { BaseEngine } from "./BaseEngine"

/**
 * TypeScript/JavaScript Mutation Engine
 * Uses the TypeScript Compiler API for structural AST comparison.
 */
export class TypeScriptEngine extends BaseEngine {
	readonly supportedExtensions = [".ts", ".tsx", ".js", ".jsx"]

	/**
	 * Performs the structural AST comparison.
	 */
	compare(previous: string, current: string): MutationClass {
		try {
			const prevSource = ts.createSourceFile("prev.ts", previous, ts.ScriptTarget.Latest, true)
			const currSource = ts.createSourceFile("curr.ts", current, ts.ScriptTarget.Latest, true)

			// Check for parsing errors (though createSourceFile rarely "fails" hard, it might produce diagnostics)
			// For simplicity, we trust the parser. If it's total garbage, it will just result in different structures.

			if (this.areNodesSemanticallyEqual(prevSource, currSource)) {
				return MutationClass.AST_REFACTOR
			}

			return MutationClass.INTENT_EVOLUTION
		} catch (error) {
			console.error("[TypeScriptEngine] AST Comparison failed:", error)
			return MutationClass.INTENT_EVOLUTION
		}
	}

	/**
	 * Recursively compares two AST nodes for semantic equality.
	 * Structural equality + simplified identifier normalization.
	 */
	private areNodesSemanticallyEqual(nodeA: ts.Node, nodeB: ts.Node): boolean {
		// 1. Different kinds mean functional change (e.g., IfStatement vs ExpressionStatement)
		if (nodeA.kind !== nodeB.kind) {
			return false
		}

		// 2. Handle terminal nodes (Tokens, Identifiers, Literals)
		if (ts.isIdentifier(nodeA) && ts.isIdentifier(nodeB)) {
			// Simplified MVP: Treat all identifier structure as equal.
			// In a more robust version, we would track renames across a scope mapping.
			return true
		}

		if (ts.isLiteralExpression(nodeA) && ts.isLiteralExpression(nodeB)) {
			// Literals MUST match (e.g., changing 1 to 2 is INTENT_EVOLUTION)
			return nodeA.text === nodeB.text
		}

		// 3. Compare children
		// We use getChildren() which includes punctuators and keywords,
		// but since we already checked node.kind, this is safe for structure.
		const childrenA = nodeA.getChildren()
		const childrenB = nodeB.getChildren()

		if (childrenA.length !== childrenB.length) {
			return false
		}

		for (let i = 0; i < childrenA.length; i++) {
			if (!this.areNodesSemanticallyEqual(childrenA[i], childrenB[i])) {
				return false
			}
		}

		return true
	}
}
