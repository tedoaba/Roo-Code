# Implementation Plan: Sidecar Data Model Alignment

**Branch**: `017-sidecar-model-alignment` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-sidecar-model-alignment/spec.md`

## Summary

Align the `.orchestration/` sidecar data model with the architecture specification. This involves:

1. Updating `OrchestrationService.initializeOrchestration()` to create `intent_map.md` with the canonical header and placeholder.
2. Refactoring the root key in `active_intents.yaml` from `intents:` to `active_intents:`.
3. Implementing a graceful migration path in `OrchestrationService.getActiveIntents()` that supports legacy keys while prioritizing the canonical one.
4. Ensuring all intent-saving operations use the new canonical key.

## Technical Context

**Language/Version**: TypeScript
**Primary Dependencies**: `js-yaml`, `fs/promises`, `vscode`, `minimatch`
**Storage**: Filesystem-based sidecar (`.orchestration/` directory)
**Testing**: Vitest (Unit and Integration)
**Target Platform**: VS Code Extension
**Project Type**: Single project (VS Code Extension)
**Performance Goals**: Minimal overhead for sidecar file operations.
**Constraints**:

- MUST maintain backward compatibility with the legacy `intents:` key.
- MUST NOT overwrite existing valid `intent_map.md` or `active_intents.yaml` during initialization.
- Mixed keys in `active_intents.yaml` MUST result in `active_intents:` taking priority.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Invariant / Law                    | Alignment                                                                                                |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **Invariant 4: Single OS Truth**   | **Aligned**. Ensuring the sidecar files match the documented schema is fundamental to OS integrity.      |
| **Law 3.3.3: Retroactive Tracing** | **Aligned**. Correct initialization of `intent_map.md` enables the spatial mapping required for tracing. |
| **Law 3.1.3: Intent Lifecycle**    | **Aligned**. Updating the YAML key ensures intent states are stored in the canonical format.             |

## Project Structure

### Documentation (this feature)

```text
specs/017-sidecar-model-alignment/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for this internal refactor)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
src/
└── services/
    └── orchestration/
        ├── OrchestrationService.ts    # Main logic for initialization and data handling
        ├── types.ts                   # Intent and trace types
        └── __tests__/                 # NEW: Unit tests for alignment and migration
            └── OrchestrationService.test.ts
```

**Structure Decision**: Single project structure managed by `OrchestrationService`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :-------- | :--------- | :----------------------------------- |
| None      | N/A        | N/A                                  |
