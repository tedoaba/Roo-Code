# Phase 1: Design & Data Model

## Core Entities

These models represent the primary interfaces for the new post-hooks. They integrate directly with `HookEngine.ts`, `OrchestrationService.ts`, and `LessonRecorder.ts`.

### 1. `IntentProgressHook`

- **Location**: `src/hooks/post/IntentProgressHook.ts`
- **Responsibility**: Checks `acceptance_criteria` against recent trace history for the active intent.
- **Key Methods**:
    - `execute(result: ToolResult): Promise<void>`
    - `private areAllCriteriaMet(criteria: string[], traceEntries: any[]): boolean`

### 2. `ScopeDriftDetectionHook`

- **Location**: `src/hooks/post/ScopeDriftDetectionHook.ts`
- **Responsibility**: Determines if the written `filePath` from a tool result is at the boundary of `owned_scope` defined in active intent or outside `intent_map.md`.
- **Key Methods**:
    - `execute(result: ToolResult): Promise<void>`
    - `private isNearBoundary(filePath: string, scopePaths: string[]): boolean`
    - `private isScopeExpansion(filePath: string, mappedPaths: string[]): boolean`

### 3. `SharedBrainHook`

- **Location**: `src/hooks/post/SharedBrainHook.ts`
- **Responsibility**: Records lessons in `AGENTS.md` for DENY responses or scope conflicts. Note that `VerificationFailureHook` handles test/lint output specifically, while this hook handles broader orchestration violations.
- **Key Methods**:
    - `execute(result: ToolResult): Promise<void>`
    - `private synthesizeGovernanceLesson(toolResult: ToolResult): Lesson | null`

## Interfaces and State Modifications

1. **ToolResult** (Pre-existing in `HookEngine.ts`):
   Contains `success`, `toolName`, `params`, `output`, `filePath`, etc. All new hooks receive this exact object structure as their input.

2. **Lessons** (Pre-existing in `types.ts`):

    ```typescript
    export interface Lesson {
    	timestamp: string
    	type: "LINT" | "TEST" | "OTHER"
    	file: string
    	error_summary: string
    	intent_id: string
    }
    ```

    _Note: `SharedBrainHook` will register its lessons under the "OTHER" type or add a `GOVERNANCE` type if it exists._

3. **OrchestrationService.ts**:
   Used via DI (Dependency Injection) to load trace entries and to record trace logs when intents transition to `COMPLETED` or when a scope warning is generated.

## Contract / Behavior Constraints

All three post-hooks:

1. Must not return a value blocking the completion of `HookEngine.postToolUse`.
2. Must gracefully catch and swallow exceptions resulting from bad file parsing (e.g., locking conflicts).
3. Must only execute if `result.intentId` exists in `ToolResult`.
