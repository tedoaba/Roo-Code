# Implementation Plan: HookRegistry Dynamic Plugin System

**Branch**: `020-hook-registry` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-hook-registry/spec.md`

## Summary

Extract hook management from `HookEngine` into a dedicated `HookRegistry` that supports dynamic registration, ordering, and lifecycle management of pre-hooks and post-hooks. This refactor implements the Open/Closed Principle for the governance layer, allowing new hooks to be added without modifying the core `HookEngine`. The technical approach involves defining standardized `IPreHook` and `IPostHook` interfaces and refactoring the currently monolithic `preToolUse` and `postToolUse` methods into a registry-delegated chain.

## Technical Context

**Language/Version**: TypeScript (Node.js)  
**Primary Dependencies**: OrchestrationService, StateMachine  
**Storage**: N/A (In-memory registry)  
**Testing**: Jest  
**Target Platform**: VS Code Extension (Roo Code)
**Project Type**: TypeScript Single Project  
**Performance Goals**: <5ms overhead per hook; strictly sequential post-hooks.  
**Constraints**: MUST reside in `src/hooks/engine/HookRegistry.ts`; MUST preserve 100% of existing behavior.  
**Scale/Scope**: ~15 existing hooks across two phases.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **Invariant 2: Hook Execution Guarantee** - PASS. Registry delegation preserves the middleware boundary.
2. **Invariant 9: Three-State Execution Flow** - PASS. Intent validation logic remains mandatory.
3. **Law 3.1.5: Execution Budgets** - PASS. Budget checking continues as a prioritized pre-hook.
4. **Law 3.2.1: Scope as Hard Boundary** - PASS. Scope enforcement logic is preserved.

## Project Structure

### Documentation (this feature)

```text
specs/020-hook-registry/
├── plan.md              # This file
├── research.md          # Investigation of inline logic and priority mapping
├── data-model.md        # IHook interfaces and Registry state
├── quickstart.md        # Usage examples for developers
├── contracts/
│   └── registry.ts      # Functional API definition
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

```text
src/
├── hooks/
│   ├── engine/
│   │   └── HookRegistry.ts     # NEW: Central registry
│   ├── pre/                    # Existing hooks to be refactored
│   │   ├── FailSafeHook.ts     # EXTRACTED from HookEngine
│   │   ├── StateCheckHook.ts   # EXTRACTED from HookEngine
│   │   ├── ...
│   └── post/                   # Existing hooks
│       ├── MutationLogHook.ts  # EXTRACTED from HookEngine
│       ├── GeneralTraceHook.ts # EXTRACTED from HookEngine
│       └── ...
└── HookEngine.ts               # Refactored: Delegated to Registry
```

**Structure Decision**: Refactoring existing inline logic into the established `pre/` and `post/` directories while introducing an `engine/` subdirectory for the registry itself.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       |            |                                      |
