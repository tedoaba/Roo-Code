# Implementation Plan: Missing Post-Hooks Implementation

**Branch**: `019-post-hooks-impl` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-post-hooks-impl/spec.md`

## Summary

Implement the three missing post-tool-use hooks specified in ARCHITECTURE_NOTES.md §6.3: IntentProgressHook (automated acceptance criteria checking via string matching), ScopeDriftDetectionHook (mutation boundary monitoring via parent directory checking), and SharedBrainHook (comprehensive lessons learned recording beyond verification failures for DENY and scope conflicts). All hooks must be non-blocking and fail gracefully.

## Technical Context

**Language/Version**: TypeScript / Node.js
**Primary Dependencies**: None new required (uses existing HookEngine structure and OrchestrationService).
**Storage**: `.orchestration/` directory (agent_trace.jsonl, AGENTS.md, active_intents.yaml, intent_map.md)
**Testing**: Jest / ts-jest
**Target Platform**: VS Code Extension (Node.js runtime)
**Project Type**: single
**Performance Goals**: Minimal overhead during `postToolUse` execution (non-blocking string matches, asynchronous file appends).
**Constraints**: All hooks must strictly catch and swallow their own internal errors to avoid crashing the agent loop.
**Scale/Scope**: Impacts every tool execution via `HookEngine.postToolUse`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Invariant 2: Hook Execution Guarantee**: All hooks are integrated into the existing `HookEngine.postToolUse` method, maintaining the single execution gateway paradigm.
- **Invariant 3: Immutable Audit Trail**: IntentProgressHook and ScopeDriftDetectionHook directly log their actions (transitions, warnings) to the immutable `agent_trace.jsonl`.
- **Invariant 4: Single Source of Orchestration Truth**: Existing orchestration methods will be reused; no shadow state is introduced.
- **Law 6.1: Documentation as Governed Artifact**: SharedBrainHook explicitly updates `AGENTS.md` using the governed `LessonRecorder` pattern to maintain living knowledge.
- **Law 7.1: Graceful Degradation**: All post-hooks are explicitly constrained to fail gracefully, catching internal errors without disrupting the main agent context.

All constitution checks passed.

## Project Structure

### Documentation (this feature)

```text
specs/019-post-hooks-impl/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (generated later)
```

### Source Code (repository root)

```text
src/
└── hooks/
    ├── HookEngine.ts
    └── post/
        ├── IntentProgressHook.ts
        ├── ScopeDriftDetectionHook.ts
        ├── SharedBrainHook.ts
        └── __tests__/
            ├── IntentProgressHook.spec.ts
            ├── ScopeDriftDetectionHook.spec.ts
            └── SharedBrainHook.spec.ts
```

**Structure Decision**: Using the single project setup, placing the hooks in the existing `src/hooks/post/` directory as requested, directly aligned with the architectural specifications.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_(No violations)_
