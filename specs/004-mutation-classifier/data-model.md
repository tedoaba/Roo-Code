# Data Model: Mutation Classification

## Enums & Constants

### `MutationClass`

Represents the semantic nature of a file change.

| Value              | Meaning                                                                              |
| :----------------- | :----------------------------------------------------------------------------------- |
| `AST_REFACTOR`     | Structural/Syntax changes with no functional impact (whitespace, renames, comments). |
| `INTENT_EVOLUTION` | Functional changes (added logic, new exports, modified control flow).                |

## Entity Definitions

### `MutationComparisonRequest` (Input)

The data required to perform a classification.

| Field             | Type     | Description                                |
| :---------------- | :------- | :----------------------------------------- |
| `previousContent` | `string` | The code content before mutation.          |
| `newContent`      | `string` | The code content after mutation.           |
| `fileExtension`   | `string` | Used to select the appropriate AST engine. |

### `MutationClassificationResult` (Output)

The result of the comparison.

| Field            | Type            | Description                                                |
| :--------------- | :-------------- | :--------------------------------------------------------- |
| `classification` | `MutationClass` | Either `AST_REFACTOR` or `INTENT_EVOLUTION`.               |
| `reason`         | `string`        | (Optional) Brief description of why this label was chosen. |
| `timestamp`      | `number`        | Unix timestamp of when the check was performed.            |
