# Quickstart: Semantic Mutation Classifier

The Mutation Classifier distinguishes between safe refactors and functional evolutions.

## Basic Usage

```typescript
import { MutationClassifier } from "../core/mutation/MutationClassifier"

const classifier = MutationClassifier.getInstance()

const previous = `function add(a, b) { return a + b; }`
const next = `function sum(a, b) { return a + b; }` // Variable rename

const result = await classifier.classify(previous, next, "math.ts")
console.log(result) // "AST_REFACTOR"
```

## Integration with Hooks

In the `PostToolUse` hook (e.g., for `write_to_file`):

1.  Capture the `previousContent` of the file.
2.  Allow the tool to write.
3.  Read the `newContent`.
4.  Run `MutationClassifier.classify()`.
5.  If `AST_REFACTOR`, log as low-risk; if `INTENT_EVOLUTION`, log for review.

## Running Tests

```bash
pnpm --filter roo-cline test -- src/core/mutation/__tests__
```
