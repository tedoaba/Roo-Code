# Governance Isolation Migration Guide

This document maps the legacy locations of governance and orchestration modules to their new canonical locations within the `src/hooks/` directory.

## Directory Conventions

- `src/hooks/engine/`: Core hook execution and registration logic.
- `src/hooks/state/`: Governance state management, orchestration services, and concurrency control.
- `src/hooks/state/lessons/`: Automated learning and lesson recording sub-system.
- `src/hooks/tools/`: Tools that implement governance capabilities.
- `src/hooks/prompts/`: Prompt sections related to governance (e.g., intent handshake).
- `src/hooks/contracts/`: Shared interfaces and types for the governance layer.
- `src/hooks/errors/`: Custom error classes for governance violations.
- `src/hooks/pre/`: Validation and enforcement hooks (Input).
- `src/hooks/post/`: Side-effect and monitoring hooks (Output).

## Path Mapping

| Legacy Path (Shim)                                   | Canonical Path (Implementation)                | Exported Symbols                                                     |
| ---------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| `src/hooks/HookEngine.ts`                            | `src/hooks/engine/HookEngine.ts`               | `HookEngine`, `ToolRequest`, `ToolResult`                            |
| `src/core/state/StateMachine.ts`                     | `src/hooks/state/StateMachine.ts`              | `StateMachine`                                                       |
| `src/core/concurrency/TurnContext.ts`                | `src/hooks/state/TurnContext.ts`               | `TurnContext`                                                        |
| `src/core/concurrency/OptimisticGuard.ts`            | `src/hooks/state/OptimisticGuard.ts`           | `OptimisticGuard`                                                    |
| `src/services/orchestration/OrchestrationService.ts` | `src/hooks/state/OrchestrationService.ts`      | `OrchestrationService`                                               |
| `src/utils/orchestration/LedgerManager.ts`           | `src/hooks/state/LedgerManager.ts`             | `LedgerManager`                                                      |
| `src/core/lessons/types.ts`                          | `src/hooks/state/lessons/types.ts`             | `Lesson`, `LessonType`                                               |
| `src/core/lessons/LockManager.ts`                    | `src/hooks/state/lessons/LockManager.ts`       | `LockManager`                                                        |
| `src/core/lessons/Deduplicator.ts`                   | `src/hooks/state/lessons/Deduplicator.ts`      | `Deduplicator`                                                       |
| `src/core/lessons/LessonAuditLogger.ts`              | `src/hooks/state/lessons/LessonAuditLogger.ts` | `LessonAuditLogger`                                                  |
| `src/core/lessons/LessonRecorder.ts`                 | `src/hooks/state/lessons/LessonRecorder.ts`    | `LessonRecorder`                                                     |
| `src/core/lessons/LessonRetriever.ts`                | `src/hooks/state/lessons/LessonRetriever.ts`   | `LessonRetriever`                                                    |
| `src/core/tools/SelectActiveIntent.ts`               | `src/hooks/tools/SelectActiveIntentTool.ts`    | `SelectActiveIntentTool`, `selectActiveIntentTool`                   |
| `src/core/prompts/sections/intent-handshake.ts`      | `src/hooks/prompts/intent-handshake.ts`        | `getIntentHandshakeSection`                                          |
| `src/contracts/AgentTrace.ts`                        | `src/hooks/contracts/AgentTrace.ts`            | `AgentTraceEntry`, `ExecutionState`, `Contributor`, `ILedgerManager` |
| `src/errors/TraceabilityError.ts`                    | `src/hooks/errors/TraceabilityError.ts`        | `TraceabilityError`                                                  |

## Barrel Export (`src/hooks/index.ts`)

The root `index.ts` in `src/hooks/` now provides a organized entry point for all governance components. It is recommended to import from here rather than deep-linking to individual files when possible.

```typescript
import { HookEngine, StateMachine, OrchestrationService, LessonRecorder } from "src/hooks"
```

## Backward Compatibility

All legacy paths listed above now contain re-export shims with `@deprecated` JSDoc tags. This ensures that existing code continues to function while providing clear signaling for developers to migrate their imports.
