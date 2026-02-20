# Research: Deterministic Mutation Classification

## Decision: TypeScript Compiler API + Structural AST Diffing

We will use the native `typescript` compiler API to parse code and perform a structural comparison of AST nodes.

### Rationale

- **Zero AI Dependency**: Meets the requirement for deterministic logic.
- **Precision**: AST-level analysis correctly ignores trivia (whitespace, comments) while capturing logical changes.
- **Performance**: The built-in TS parser is optimized for speed and handles 1000+ line files in milliseconds.
- **Maintainability**: Leverages existing dependencies already present in the Roo-Code project.

### Technical Implementation Details

1.  **Parsing**: Use `ts.createSourceFile` with `ts.ScriptTarget.Latest` and `setParentNodes: true`.
2.  **Trivia Filtering**: AST nodes natively omit whitespace and comments unless explicitly requested.
3.  **Renaming Detection**:
    - To classify a "Variable Rename" as `AST_REFACTOR`, we will implement a normalization pass during the structural comparison.
    - If two nodes have the same `SyntaxKind` and structure but different `Identifier` names, we check if the name change is consistent within the relevant scope.
    - _Simplification for MVP_: For the first version, we will treat any structure-preserving identifier change as a rename (`AST_REFACTOR`), provided the `SyntaxKind` tree remains identical.
4.  **Logic Branch / New Function Detection**: These change the AST structure (e.g., adding an `IfStatement` or `FunctionDeclaration` node), which triggers `INTENT_EVOLUTION`.

### Alternatives Considered

- **`ts-morph`**: Rejected for core logic to keep dependencies lean, though it is excellent for high-level manipulation.
- **Tree-sitter**: Rejected because it would require non-JS native bindings, increasing build complexity. The TS Compiler API is already available.
- **RegExp-based Diffing**: Rejected as it is inherently fragile and fails to distinguish between semantic and non-semantic changes (e.g., variable renames in strings vs code).

### Extensibility Pattern

We will implement an `IMutationEngine` interface:

```typescript
interface IMutationEngine {
	classify(previous: string, current: string): MutationClass
}
```

The `MutationClassifier` will select the engine based on the file extension.

## Unresolved Questions / Risks

- **Cross-file renames**: Will be classified as `INTENT_EVOLUTION` because the classifier operates on a per-file basis in this module. This is acceptable for the initial scope.
- **Complex Refactors**: Highly complex refactors (e.g., extracting a function) change the AST structure and thus will be classified as `INTENT_EVOLUTION`. This aligns with a "Safe Default" governance strategy.
