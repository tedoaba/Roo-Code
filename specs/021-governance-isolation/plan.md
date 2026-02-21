# Implementation Plan: Governance Isolation Boundary Enforcement

**Branch**: `021-governance-isolation` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-governance-isolation/spec.md`

## Summary

Enforce the architectural principle from §6.4 that all governance logic lives exclusively in `src/hooks/` by incrementally relocating 15+ governance modules from forbidden directories (`src/core/`, `src/services/`, `src/utils/`, `src/errors/`, `src/contracts/`) into the `src/hooks/` subtree. The migration uses a re-export shim strategy with `@deprecated` annotations to maintain backward compatibility at every step. Modules are moved in dependency order (types → errors → state → tools → prompts → engine) with co-located tests migrating alongside their modules.

## Technical Context

**Language/Version**: TypeScript (VSCode extension project)  
**Primary Dependencies**: `vscode`, `js-yaml`, `minimatch`, `ignore`, `crypto`  
**Storage**: File-system based (`.orchestration/` sidecar directory)  
**Testing**: Vitest (`describe`, `it`, `expect`, `vi` for mocking)  
**Target Platform**: VSCode Extension Host (Node.js runtime)  
**Project Type**: Single VSCode extension with governance hook layer  
**Performance Goals**: N/A — structural refactoring only, no runtime performance changes  
**Constraints**: Zero-downtime migration — tests must pass after each individual module move  
**Scale/Scope**: ~15 source modules, ~10 test files, ~30+ consumer files to update imports

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Constitutional Law                           | Alignment  | Notes                                                                                                                                                       |
| -------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invariant 2** (Hook Execution Guarantee)   | ✅ ALIGNED | This migration directly enforces Invariant 2 by consolidating all governance code under `src/hooks/`. No execution paths are changed — only file locations. |
| **Invariant 4** (Single Orchestration Truth) | ✅ ALIGNED | `OrchestrationService` moves into the hooks subtree where it belongs per §6.3. It remains the single source of orchestration truth.                         |
| **Invariant 8** (Fail-Safe Default)          | ✅ ALIGNED | Re-export shims ensure no import breaks. If a re-export is missing, TypeScript compilation fails — a safe failure mode.                                     |
| **Invariant 9** (Three-State Execution Flow) | ✅ ALIGNED | `StateMachine` and `SelectActiveIntentTool` move but retain identical behavior. Their import consumers work via re-exports.                                 |
| **Law 3.1.1** (Mandatory Intent Declaration) | ✅ ALIGNED | `SelectActiveIntentTool` moves to `src/hooks/tools/` — its documented home per §6.3, Appendix C.                                                            |
| **Law 3.2.1** (Scope as Hard Boundary)       | ✅ ALIGNED | `ScopeEnforcementHook` already lives in `src/hooks/pre/`. Supporting modules (`StateMachine`, `OrchestrationService`) now co-locate.                        |
| **Law 6.3** (Knowledge Currency)             | ✅ ALIGNED | This migration brings the codebase into alignment with the documented architecture in §6.3 — reducing documentation drift.                                  |
| **Law 6.5** (Constitution Supremacy)         | ✅ ALIGNED | The Constitution defines governance hooks as load-bearing (Axiom 3). Centralizing them enforces this principle structurally.                                |

**Gate Result**: ✅ PASS — No violations. This migration is a direct enforcement of constitutional principles.

## Project Structure

### Documentation (this feature)

```text
specs/021-governance-isolation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (migration manifest)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (import contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/hooks/                          # TARGET: All governance code lives here
├── engine/
│   ├── HookEngine.ts               # MOVE from src/hooks/HookEngine.ts
│   ├── HookRegistry.ts             # EXISTING (already in place)
│   └── types.ts                    # EXISTING (already in place)
├── pre/                            # EXISTING (8 hooks, no changes)
│   ├── BudgetHook.ts
│   ├── CircuitBreakerHook.ts
│   ├── ConcurrencyHook.ts
│   ├── ContextEnrichmentHook.ts
│   ├── FailSafeHook.ts
│   ├── IntentGateHook.ts
│   ├── PreCompactHook.ts
│   ├── ScopeEnforcementHook.ts
│   ├── StateCheckHook.ts
│   └── TraceabilityHook.ts
├── post/                           # EXISTING (11 hooks, no changes)
│   └── [11 existing post-hooks + __tests__/]
├── state/                          # NEW subdirectory
│   ├── StateMachine.ts             # MOVE from src/core/state/
│   ├── OrchestrationService.ts     # MOVE from src/services/orchestration/
│   ├── TurnContext.ts              # MOVE from src/core/concurrency/
│   ├── OptimisticGuard.ts          # MOVE from src/core/concurrency/
│   ├── LedgerManager.ts            # MOVE from src/utils/orchestration/
│   ├── types.ts                    # MOVE from src/core/concurrency/
│   ├── __tests__/                  # MOVE co-located tests
│   │   ├── StateMachine.test.ts
│   │   ├── OptimisticGuard.test.ts
│   │   ├── TurnContext.test.ts
│   │   ├── TurnLifecycle.test.ts
│   │   └── LedgerManager.test.ts
│   └── lessons/                    # NEW subdirectory
│       ├── LessonRecorder.ts       # MOVE from src/core/lessons/
│       ├── LockManager.ts          # MOVE from src/core/lessons/
│       ├── Deduplicator.ts         # MOVE from src/core/lessons/
│       ├── LessonAuditLogger.ts    # MOVE from src/core/lessons/
│       ├── LessonRetriever.ts      # MOVE from src/core/lessons/
│       ├── types.ts                # MOVE from src/core/lessons/
│       └── __tests__/              # MOVE co-located tests
│           ├── Deduplicator.test.ts
│           └── LessonRecorder.test.ts
├── tools/                          # NEW subdirectory
│   └── SelectActiveIntentTool.ts   # MOVE from src/core/tools/SelectActiveIntent.ts
├── prompts/                        # NEW subdirectory
│   └── intent-handshake.ts         # MOVE from src/core/prompts/sections/
├── contracts/                      # NEW subdirectory
│   ├── AgentTrace.ts               # MOVE from src/contracts/
│   └── __tests__/
│       └── AgentTraceEntry.test.ts # MOVE co-located test
├── errors/                         # EXISTS (has StaleWriteError.ts)
│   ├── StaleWriteError.ts          # EXISTING
│   └── TraceabilityError.ts        # MOVE from src/errors/
├── __tests__/                      # EXISTING (integration tests — no changes)
│   └── [8 existing integration test files]
├── HookEngine.ts                   # BECOMES re-export shim → engine/HookEngine.ts
└── index.ts                        # UPDATED with all new exports
```

**Structure Decision**: The existing `src/hooks/` directory is extended with new subdirectories (`state/`, `tools/`, `prompts/`, `contracts/`) to match the documented §6.3 layout. All existing hooks in `pre/`, `post/`, and `engine/` remain untouched. The migration adds new files and converts old locations to re-export shims.

## Complexity Tracking

> No Constitution violations detected — this section is intentionally left empty.
