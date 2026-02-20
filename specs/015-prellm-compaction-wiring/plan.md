# Implementation Plan: Pre-LLM Context Compaction Wiring

**Branch**: `015-prellm-compaction-wiring` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/015-prellm-compaction-wiring/spec.md`

## Summary

Wire the existing `HookEngine.preLLMRequest()` method into `Task.recursivelyMakeClineRequests()` so that context compaction runs before every LLM API call. The method already exists at `HookEngine.ts:432-456` and delegates to `PreCompactHook.compact()`, but Task.ts never invokes it. The change adds a single `preLLMRequest()` call in `attemptApiRequest()` before `createMessage()`, prepending the compaction summary to the system prompt string when non-null. Errors are caught and logged without propagating to the LLM loop.

## Technical Context

**Language/Version**: TypeScript 5.x (VS Code extension)  
**Primary Dependencies**: Anthropic SDK, OpenAI types, vscode API  
**Storage**: `.orchestration/` sidecar directory (JSONL, YAML)  
**Testing**: Vitest (`vitest`, `vi.spyOn`, `vi.fn`)  
**Target Platform**: VS Code Extension Host (Node.js)  
**Project Type**: Single monorepo (extension)  
**Performance Goals**: Zero overhead on no-op path (null check + early return)  
**Constraints**: Decorator Pattern — single call at boundary, no core logic changes  
**Scale/Scope**: Single file change (`Task.ts`) + unit tests

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Constitutional Law                           | Compliance | Notes                                                                              |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| **Invariant 2** (Hook Execution Guarantee)   | ✅ PASS    | Feature _implements_ this invariant — routes compaction through HookEngine         |
| **Invariant 8** (Fail-Safe Default)          | ✅ PASS    | Errors caught and logged; null/empty returns treated as no-op                      |
| **Invariant 9** (Three-State Execution Flow) | ✅ PASS    | `preLLMRequest()` already handles undefined `intentId` (returns null in REASONING) |
| **Law 3.1.6** (Context Compaction)           | ✅ PASS    | This feature _implements_ Law 3.1.6                                                |
| **Law 7.1** (Graceful Degradation)           | ✅ PASS    | Compaction failure does not crash the LLM loop                                     |
| **Law 7.3** (Failure Transparency)           | ✅ PASS    | Errors logged with intent ID and stack trace                                       |

No violations detected. No complexity tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/015-prellm-compaction-wiring/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── core/
│   └── task/
│       ├── Task.ts                    # PRIMARY — add preLLMRequest() call in attemptApiRequest()
│       └── __tests__/
│           └── Task.spec.ts           # Add unit tests for compaction wiring
└── hooks/
    ├── HookEngine.ts                  # EXISTING — preLLMRequest() at L432-456 (no changes)
    └── pre/
        └── PreCompactHook.ts          # EXISTING — compact() (no changes)
```

**Structure Decision**: Single file modification in `src/core/task/Task.ts` with corresponding test additions in `src/core/task/__tests__/Task.spec.ts`. No new files required. The hook infrastructure (`HookEngine.ts`, `PreCompactHook.ts`) is already complete and functional.
