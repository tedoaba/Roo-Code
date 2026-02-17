# Implementation Plan: 001-intent-handshake

**Branch**: `001-intent-handshake` | **Date**: 2026-02-17 | **Spec**: [specs/001-intent-handshake/spec.md](./spec.md)
**Input**: Feature specification from `specs/001-intent-handshake/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements the "Intent Handshake" protocol, a mandatory reasoning loop that effectively solves the Context Paradox. By forcing the agent to select an active intent (`select_active_intent`) before performing any mutating actions, we ensure the agent is always operating within a declared scope with full context (constraints, history, acceptance criteria) injected into its prompt.

## Technical Context

**Language/Version**: TypeScript 5.8+
**Primary Dependencies**: VS Code Extension API, Node.js (fs/path), `@roo-code/types`, `@roo-code/core`
**Storage**: `.orchestration/` sidecar files (active_intents.yaml, agent_trace.jsonl, intent_map.md)
**Testing**: Mocha/Chai (Unit/Integration), VS Code Extension Tests
**Target Platform**: VS Code (Desktop & Web)
**Project Type**: VS Code Extension
**Performance Goals**: <2s added latency for handshake; negligible overhead for subsequent turns.
**Constraints**: Must operate within the existing `Task.ts` loop without blocking the UI thread.
**Scale/Scope**: Single active intent per session.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Invariant 9 (Three-State Execution Flow)**: ✅ This feature IS the implementation of Invariant 9. It enforces the Request -> Reasoning Intercept -> Contextualized Action flow.
- **Invariant 2 (Hook Execution Guarantee)**: ✅ The design injects checking logic into `Task.ts` loop, ensuring no tool execution bypasses the intent check.
- **Invariant 4 (Single Source of Orchestration Truth)**: ✅ The implementation reads/writes exclusively to `.orchestration/`.
- **Invariant 1 (Intent-Code Binding)**: ✅ By enforcing intent selection, we enable the strict binding of code mutations to intents.

## Project Structure

### Documentation (this feature)

```text
specs/001-intent-handshake/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── task/
│   │   └── Task.ts           # Modified: Inject handshake logic into loop
│   └── tools/
│       └── SelectActiveIntent.ts # New: The tool implementation
├── services/
│   └── orchestration/        # New: Orchestration state management
│       ├── OrchestrationService.ts
│       └── types.ts
└── hooks/
    └── pre/
        └── IntentGateHook.ts # New: The enforcement hook
```

**Structure Decision**: We will add a new `OrchestrationService` to manage the sidecar state and inject the `IntentGateHook` logic into the `Task.ts` execution loop. The new tool `SelectActiveIntent` will be added to the core tools.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :-------- | :--------- | :----------------------------------- |
| N/A       |            |                                      |
