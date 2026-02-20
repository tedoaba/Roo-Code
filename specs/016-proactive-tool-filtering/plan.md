# Implementation Plan: Proactive Tool Filtering for Intent Handshake

**Branch**: `016-proactive-tool-filtering` | **Date**: 2026-02-20 | **Spec**: [specs/016-proactive-tool-filtering/spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-proactive-tool-filtering/spec.md`

## Summary

Integrate execution-state-aware tool filtering into `build-tools.ts` (`buildNativeToolsArray()`) so that the LLM only sees tools it is allowed to use in the current state. During `REQUEST` and `REASONING` states, only `SAFE` tools and intent selection tools will be presented. When transitioning to the `ACTION` state, all tools permitted by the active mode will be exposed. This implements a defense-in-depth, UI/Agent restriction mechanism that complements the runtime security checks in the Hook Engine, lowering LLM token waste and preventing premature hallucinated block actions.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: VS Code Extension API  
**Storage**: N/A (Stateless functional filtering based on existing state)  
**Testing**: Mocha/Chai (VS Code Extension test runner)
**Target Platform**: VS Code Extension (Roo Code)
**Project Type**: single (VS Code Extension)
**Performance Goals**: N/A (Synchronous array filtering)
**Constraints**: Must not break existing mode-based filtering. Must remain synchronous. Must decouple from the State Machine's internal logic (Decorator pattern).
**Scale/Scope**: Impacts `build-tools.ts`, `Task.ts`, and core orchestration typings.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Intent-Code Binding (Inv 1)**: N/A - This feature improves intent enforcement but does not alter trace binding.
- **Hook Execution Guarantee (Inv 2)**: PASS - Runtime hook execution remains the ultimate arbiter. Pre-LLM filtering acts as defense-in-depth.
- **Fail-Safe Default (Inv 8)**: PASS - The default assumption is that unknown states or tools restrict destructiveness.
- **Three-State Execution Flow (Inv 9)**: PASS - This feature directly bolsters State 1 -> State 2 -> State 3 execution enforcement by hiding ACTION-state tools during the reasoning phases.

## Project Structure

### Documentation (this feature)

```text
specs/016-proactive-tool-filtering/
├── plan.md              # This file
├── data-model.md        # Feature Data Model (Integration Points)
├── contracts/           # API/Function Signatures Modifed
└── tasks.md             # Implementation steps
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── task/
│   │   ├── Task.ts
│   │   └── build-tools.ts
│   └── StateMachine.ts
├── services/
│   └── orchestration/
│       └── types.ts
└── hooks/
    └── HookEngine.ts
```

**Structure Decision**: The feature is localized to `src/core/task/build-tools.ts`, with integration updates required in `Task.ts` (the instantiator). Existing typings in `orchestration/types.ts` will be heavily utilized to distinguish SAFE vs DESTRUCTIVE capabilities.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |
