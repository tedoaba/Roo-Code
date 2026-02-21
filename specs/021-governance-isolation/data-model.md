# Data Model: Governance Isolation Migration Manifest

**Feature**: 021-governance-isolation  
**Date**: 2026-02-21

## §1 Migration Manifest

The migration manifest defines every file move operation in dependency order. Each entry specifies the source path, target path, consumer count (files that import the module), and the migration phase.

### Phase 1: Types & Contracts (no governance dependencies)

| #   | Source                                            | Target                                                  | Consumers      | Notes                                       |
| --- | ------------------------------------------------- | ------------------------------------------------------- | -------------- | ------------------------------------------- |
| 1   | `src/contracts/AgentTrace.ts`                     | `src/hooks/contracts/AgentTrace.ts`                     | 4 source files | Exports `AgentTraceEntry`, `ExecutionState` |
| 2   | `src/contracts/__tests__/AgentTraceEntry.test.ts` | `src/hooks/contracts/__tests__/AgentTraceEntry.test.ts` | 0              | Co-located test                             |
| 3   | `src/core/concurrency/types.ts`                   | `src/hooks/state/types.ts`                              | 1 source file  | Exports `ITurnContext`                      |

### Phase 2: Errors

| #   | Source                            | Target                                  | Consumers | Notes              |
| --- | --------------------------------- | --------------------------------------- | --------- | ------------------ |
| 4   | `src/errors/TraceabilityError.ts` | `src/hooks/errors/TraceabilityError.ts` | 2 files   | Custom error class |

### Phase 3: State & Concurrency

| #   | Source                                                    | Target                                              | Consumers | Notes                      |
| --- | --------------------------------------------------------- | --------------------------------------------------- | --------- | -------------------------- |
| 5   | `src/core/state/StateMachine.ts`                          | `src/hooks/state/StateMachine.ts`                   | 10+ files | Core state machine         |
| 6   | `src/core/state/__tests__/StateMachine.test.ts`           | `src/hooks/state/__tests__/StateMachine.test.ts`    | 0         | Co-located test            |
| 7   | `src/core/concurrency/TurnContext.ts`                     | `src/hooks/state/TurnContext.ts`                    | 1 file    | Turn lifecycle tracking    |
| 8   | `src/core/concurrency/OptimisticGuard.ts`                 | `src/hooks/state/OptimisticGuard.ts`                | 1 file    | Stale write detection      |
| 9   | `src/core/concurrency/__tests__/TurnContext.test.ts`      | `src/hooks/state/__tests__/TurnContext.test.ts`     | 0         | Co-located test            |
| 10  | `src/core/concurrency/__tests__/OptimisticGuard.test.ts`  | `src/hooks/state/__tests__/OptimisticGuard.test.ts` | 0         | Co-located test            |
| 11  | `src/core/concurrency/__tests__/TurnLifecycle.test.ts`    | `src/hooks/state/__tests__/TurnLifecycle.test.ts`   | 0         | Co-located test            |
| 12  | `src/services/orchestration/OrchestrationService.ts`      | `src/hooks/state/OrchestrationService.ts`           | 15+ files | Orchestration truth source |
| 13  | `src/utils/orchestration/LedgerManager.ts`                | `src/hooks/state/LedgerManager.ts`                  | 2 files   | Ledger append operations   |
| 14  | `src/utils/orchestration/__tests__/LedgerManager.test.ts` | `src/hooks/state/__tests__/LedgerManager.test.ts`   | 0         | Co-located test            |

### Phase 4: Lessons

| #   | Source                                              | Target                                                     | Consumers | Notes                   |
| --- | --------------------------------------------------- | ---------------------------------------------------------- | --------- | ----------------------- |
| 15  | `src/core/lessons/types.ts`                         | `src/hooks/state/lessons/types.ts`                         | 5 files   | Shared lesson types     |
| 16  | `src/core/lessons/LockManager.ts`                   | `src/hooks/state/lessons/LockManager.ts`                   | 1 file    | Advisory file locking   |
| 17  | `src/core/lessons/Deduplicator.ts`                  | `src/hooks/state/lessons/Deduplicator.ts`                  | 1 file    | Lesson deduplication    |
| 18  | `src/core/lessons/LessonAuditLogger.ts`             | `src/hooks/state/lessons/LessonAuditLogger.ts`             | 1 file    | Audit trail for lessons |
| 19  | `src/core/lessons/LessonRecorder.ts`                | `src/hooks/state/lessons/LessonRecorder.ts`                | 1 file    | Main lesson recorder    |
| 20  | `src/core/lessons/LessonRetriever.ts`               | `src/hooks/state/lessons/LessonRetriever.ts`               | TBD       | Lesson query interface  |
| 21  | `src/core/lessons/__tests__/Deduplicator.test.ts`   | `src/hooks/state/lessons/__tests__/Deduplicator.test.ts`   | 0         | Co-located test         |
| 22  | `src/core/lessons/__tests__/LessonRecorder.test.ts` | `src/hooks/state/lessons/__tests__/LessonRecorder.test.ts` | 0         | Co-located test         |

### Phase 5: Tools

| #   | Source                                 | Target                                      | Consumers | Notes                       |
| --- | -------------------------------------- | ------------------------------------------- | --------- | --------------------------- |
| 23  | `src/core/tools/SelectActiveIntent.ts` | `src/hooks/tools/SelectActiveIntentTool.ts` | 1-2 files | Renamed to match class name |

### Phase 6: Prompts

| #   | Source                                          | Target                                  | Consumers | Notes                  |
| --- | ----------------------------------------------- | --------------------------------------- | --------- | ---------------------- |
| 24  | `src/core/prompts/sections/intent-handshake.ts` | `src/hooks/prompts/intent-handshake.ts` | 1 file    | Prompt section builder |

### Phase 7: Engine Restructuring

| #   | Source                    | Target                           | Consumers | Notes                       |
| --- | ------------------------- | -------------------------------- | --------- | --------------------------- |
| 25  | `src/hooks/HookEngine.ts` | `src/hooks/engine/HookEngine.ts` | 10+ files | Root → engine/ subdirectory |

**Total**: 25 file operations (15 source modules, 10 test files)

## §2 Re-export Shim Entity

Each moved source module (not test files) gets a re-export shim at the old location.

**Fields**:

- `sourcePath`: Original file location (becomes the shim)
- `targetPath`: New canonical location under `src/hooks/`
- `exports`: Named symbols re-exported (e.g., `StateMachine`, `AgentTraceEntry`)
- `deprecationMessage`: JSDoc `@deprecated` annotation text
- `phase`: Migration phase number (determines creation order)

**Template**:

```typescript
/**
 * @deprecated Moved to {targetPath}. Update your imports.
 * This re-export exists for backward compatibility during migration.
 */
export { {exports} } from "{relativePathToTarget}"
```

**Count**: 15 re-export shims (one per source module, no shims for test files)

## §3 Barrel Export Entity

The `src/hooks/index.ts` file serves as the single import surface for all governance APIs.

**Structure**:

- Organized by subdirectory (engine, state, lessons, tools, contracts, errors, pre-hooks, post-hooks)
- Only public API symbols are exported
- Internal types and utilities used only within `src/hooks/` are NOT barrel-exported

**Current exports** (to be preserved):

- `HookEngine`, `ToolRequest`, `ToolResult`
- `COMMAND_CLASSIFICATION`
- `IntentGateHook`, `ContextEnrichmentHook`, `ScopeEnforcementHook`, `BudgetHook`, `PreCompactHook`
- `AuditHook`

**New exports** (to be added after migration):

- `StateMachine`
- `OrchestrationService`
- `TurnContext`, `OptimisticGuard`, `LedgerManager`
- `LessonRecorder`, `LessonRetriever`
- `SelectActiveIntentTool`, `selectActiveIntentTool`
- `AgentTraceEntry`, `ExecutionState`
- `StaleWriteError`, `TraceabilityError`

## §4 Migration Guide Entity

A migration guide document will be placed at `specs/021-governance-isolation/migration-guide.md` upon completion.

**Fields per entry**:

- `oldPath`: The deprecated import path
- `newPath`: The canonical import path
- `symbols`: List of exported symbols from the module
- `phase`: When the move occurred

**Format**:

```markdown
| Old Import Path               | New Import Path                | Symbols        |
| ----------------------------- | ------------------------------ | -------------- |
| `src/core/state/StateMachine` | `src/hooks/state/StateMachine` | `StateMachine` |
```
