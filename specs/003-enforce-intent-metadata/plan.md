# Implementation Plan: Enforce Intent Metadata in write_to_file Tool

**Branch**: `003-enforce-intent-metadata` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)

## Summary

Implement a schema upgrade for the `write_to_file` (canonical name: `write_to_file`) tool to enforce mutation traceability. This requires adding `intent_id` and `mutation_class` as mandatory fields and implementing strict validation to block any writes lacking this metadata.

## Technical Context

**Language/Version**: TypeScript  
**Primary Dependencies**: VS Code API, Anthropic SDK (for blocks/types), @roo-code/types  
**Storage**: Filesystem (via `fs/promises` and `Task`/`diffViewProvider`)  
**Testing**: Vitest (`src/core/tools/__tests__/writeToFileTool.spec.ts`)  
**Target Platform**: VS Code Extension  
**Project Type**: VS Code Extension (Single Project)  
**Performance Goals**: Fail Fast validation (<10ms overhead)  
**Constraints**: No backward compatibility (breaking change for existing tool calls if they were somehow cached or hardcoded).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **Invariant 1: Intent–Code Binding**: PASS. Directly enforces binding of code mutation to an intent.
2. **Invariant 3: Immutable Audit Trail**: PASS. Provides necessary metadata for audit logs.
3. **Invariant 8: Fail-Safe Default**: PASS. Implements "denial of action" on invalid metadata.
4. **Invariant 9: Three-State Execution Flow**: PASS. Reinforces State 2 (Reasoning Intercept) requirements.

## Project Structure

### Documentation (this feature)

```text
specs/003-enforce-intent-metadata/
├── plan.md              # This file
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Quality checklist
├── data-model.md        # NEW: Defines the mutation metadata entities
└── quickstart.md        # NEW: Example of correct tool usage
```

### Source Code

```text
src/
├── shared/
│   └── tools.ts         # Update ToolParamName, NativeToolArgs, WriteToFileToolUse
├── core/
│   ├── tools/
│   │   ├── WriteToFileTool.ts  # Add validation logic
│   │   └── __tests__/
│   │       └── writeToFileTool.spec.ts # Add validation test cases
│   └── prompts/
│       └── tools/
│           └── native-tools/
│               └── write_to_file.ts # Update tool schema definition
```

**Structure Decision**: Standard Roo-Code tool architecture.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       |            |                                      |

## Phase 0: Research

- [x] Verify usage of `intent_id` and `mutation_class` in existing codebase. (Found: `intent_id` exists in `toolParamNames` but `mutation_class` is new).
- [x] Confirm enum values: `AST_REFACTOR`, `INTENT_EVOLUTION`.

## Phase 1: Design & Contracts

- **Generate `data-model.md`**: Define the `MutationClass` enum and updated `WriteToFileParams`.
- **Generate `quickstart.md`**: Provide examples of valid and invalid `write_file` calls.
- **Contract Update**: Modify `src/core/prompts/tools/native-tools/write_to_file.ts` to include the new required parameters.
- **Shared Types Update**: Update `src/shared/tools.ts` to include `mutation_class` in `toolParamNames` and `NativeToolArgs`.
- **Agent Context Update**: Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType agy` to ensure the assistant knows about the new requirement.
