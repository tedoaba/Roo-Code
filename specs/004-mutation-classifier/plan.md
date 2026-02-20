# Implementation Plan: Semantic Mutation Classifier

**Branch**: `004-mutation-classifier` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-mutation-classifier/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a deterministic mutation classification module to distinguish between semantic refactors (`AST_REFACTOR`) and functional changes (`INTENT_EVOLUTION`). The module will use an extensible AST-based comparison architecture, initially supporting TypeScript/JavaScript, to enforce high-fidelity governance of code mutations.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: `typescript` (AST parser), `ts-morph` (optional, for easier AST traversal) or native TS Compiler API.  
**Storage**: N/A (Stateless library)  
**Testing**: `mocha` + `assertion` library (standard for Roo-Code)  
**Target Platform**: Node.js (Extension Host)
**Project Type**: Core Library / Service  
**Performance Goals**: < 500ms for 1000 LOC comparison.  
**Constraints**: STRICTLY deterministic logic; zero AI/probabilistic decisions.  
**Scale/Scope**: Handles all file writes in the system via integration with `HookEngine`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Invariant / Law                     | Status | Rationale                                                                        |
| :---------------------------------- | :----- | :------------------------------------------------------------------------------- |
| **Invariant 11 (AST-to-Intent)**    | ✅     | This feature is the direct implementation of this invariant.                     |
| **Invariant 8 (Fail-Safe Default)** | ✅     | Defaults to `INTENT_EVOLUTION` on parsing failures.                              |
| **Article 2.3 (Governance Axiom)**  | ✅     | Enables automatic approval of low-risk refactors without bypassing hooks.        |
| **Law 4.4 (Human Approval)**        | ✅     | Distinguishes when changes are "evolutionary" and thus may need higher scrutiny. |

## Project Structure

### Documentation (this feature)

```text
specs/004-mutation-classifier/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── core/
│   ├── mutation/
│   │   ├── MutationClassifier.ts      # Main Entry point (Singleton/Service)
│   │   ├── engines/
│   │   │   ├── BaseEngine.ts          # Extensible base for languages
│   │   │   └── TypeScriptEngine.ts    # TS/JS Implementation
│   │   └── types.ts                    # Internal interface definitions
└── shared/
    └── types.ts                        # Shared MutationClass and data entities

src/core/mutation/__tests__/
└── MutationClassifier.test.ts          # Unit tests
```

**Structure Decision**: Integrated into `src/core/mutation` to serve as a foundational service for the `HookEngine`.

## Complexity Tracking

> **No violations detected.**
