# Import Contracts: Governance Isolation

**Feature**: 021-governance-isolation  
**Date**: 2026-02-21

## Overview

This document defines the import contracts for the governance isolation migration. Each contract specifies the exports from a relocated module and the re-export shim at the old location.

## Contract 1: AgentTrace

**New canonical path**: `src/hooks/contracts/AgentTrace.ts`
**Old path (re-export shim)**: `src/contracts/AgentTrace.ts`

```typescript
// Exports at new location (unchanged)
export interface AgentTraceEntry {
	/* ... */
}
export type ExecutionState = "REQUEST" | "REASONING" | "ACTION"
// + any other existing exports

// Re-export shim at old location
/** @deprecated Moved to src/hooks/contracts/AgentTrace.ts. Update your imports. */
export { AgentTraceEntry, ExecutionState } from "../hooks/contracts/AgentTrace"
```

## Contract 2: StateMachine

**New canonical path**: `src/hooks/state/StateMachine.ts`
**Old path (re-export shim)**: `src/core/state/StateMachine.ts`

```typescript
// Exports at new location (unchanged)
export class StateMachine {
	/* ... */
}

// Re-export shim at old location
/** @deprecated Moved to src/hooks/state/StateMachine.ts. Update your imports. */
export { StateMachine } from "../../hooks/state/StateMachine"
```

## Contract 3: OrchestrationService

**New canonical path**: `src/hooks/state/OrchestrationService.ts`
**Old path (re-export shim)**: `src/services/orchestration/OrchestrationService.ts`

```typescript
// Exports at new location (unchanged)
export class OrchestrationService {
	/* ... */
}

// Re-export shim at old location
/** @deprecated Moved to src/hooks/state/OrchestrationService.ts. Update your imports. */
export { OrchestrationService } from "../../hooks/state/OrchestrationService"
```

## Contract 4: Concurrency Modules

**TurnContext**

- New: `src/hooks/state/TurnContext.ts`
- Old shim: `src/core/concurrency/TurnContext.ts`

**OptimisticGuard**

- New: `src/hooks/state/OptimisticGuard.ts`
- Old shim: `src/core/concurrency/OptimisticGuard.ts`

**types.ts (ITurnContext)**

- New: `src/hooks/state/types.ts`
- Old shim: `src/core/concurrency/types.ts`

## Contract 5: Lesson Modules

All lesson modules move from `src/core/lessons/` to `src/hooks/state/lessons/`.

| Module                 | Export Symbols              |
| ---------------------- | --------------------------- |
| `LessonRecorder.ts`    | `LessonRecorder`            |
| `LockManager.ts`       | `LockManager`               |
| `Deduplicator.ts`      | `Deduplicator`              |
| `LessonAuditLogger.ts` | `LessonAuditLogger`         |
| `LessonRetriever.ts`   | `LessonRetriever`           |
| `types.ts`             | Lesson-related type exports |

## Contract 6: SelectActiveIntentTool

**New canonical path**: `src/hooks/tools/SelectActiveIntentTool.ts`
**Old path (re-export shim)**: `src/core/tools/SelectActiveIntent.ts`

```typescript
// Re-export shim at old location (note: filename changes)
/** @deprecated Moved to src/hooks/tools/SelectActiveIntentTool.ts. Update your imports. */
export { SelectActiveIntentTool, selectActiveIntentTool } from "../../hooks/tools/SelectActiveIntentTool"
```

## Contract 7: Intent Handshake Prompt

**New canonical path**: `src/hooks/prompts/intent-handshake.ts`
**Old path (re-export shim)**: `src/core/prompts/sections/intent-handshake.ts`

## Contract 8: TraceabilityError

**New canonical path**: `src/hooks/errors/TraceabilityError.ts`
**Old path (re-export shim)**: `src/errors/TraceabilityError.ts`

## Contract 9: LedgerManager

**New canonical path**: `src/hooks/state/LedgerManager.ts`
**Old path (re-export shim)**: `src/utils/orchestration/LedgerManager.ts`

## Contract 10: HookEngine (Internal Move)

**New canonical path**: `src/hooks/engine/HookEngine.ts`
**Old path (re-export)**: `src/hooks/HookEngine.ts` (no @deprecated — this is an internal restructuring within hooks/)

```typescript
// Re-export at old location (within src/hooks/, so no @deprecated)
export { HookEngine, type ToolRequest, type ToolResult } from "./engine/HookEngine"
```
