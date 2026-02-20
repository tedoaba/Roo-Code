# Data Model: Mutation Metadata

This document defines the data structures used for enforcing mutation traceability in the `write_to_file` tool.

## Enumerations

### MutationClass

Defines the semantic classification of a code mutation.

| Value              | Description                                                                                               |
| :----------------- | :-------------------------------------------------------------------------------------------------------- |
| `AST_REFACTOR`     | Changes that preserve behavior but modify structure (e.g., renaming, extracting functions, reformatting). |
| `INTENT_EVOLUTION` | Changes that implement new features, bug fixes, or intentional behavior modifications.                    |

## Parameter Structures

### WriteToFileParams

Parameters for the `write_to_file` tool call.

| Field            | Type          | Required | Description                                                                       |
| :--------------- | :------------ | :------- | :-------------------------------------------------------------------------------- |
| `path`           | string        | Yes      | Workspace-relative path of the target file. Must be non-empty.                    |
| `content`        | string        | Yes      | Full content to be written to the file.                                           |
| `intent_id`      | string        | Yes      | Unique identifier of the active intent authorizing this write. Must be non-empty. |
| `mutation_class` | MutationClass | Yes      | Semantic classification of the change. Must be one of the enumerated values.      |

## Validation Rules

1. **Existence**: `intent_id` and `mutation_class` MUST be present in the tool call.
2. **Emptiness**: `intent_id` MUST NOT be an empty string (`""`).
3. **Format**: `mutation_class` MUST exactly match one of the defined enum strings (case-sensitive).
4. **Ordering**: Validation MUST occur before any filesystem interaction or user approval prompts.
