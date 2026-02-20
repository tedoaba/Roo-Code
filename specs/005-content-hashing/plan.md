**Branch**: `005-content-hashing` | **Date**: 2026-02-19 | **Spec**: [specs/005-content-hashing/spec.md](spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementation of a deterministic SHA-256 content hashing utility for the IDE's traceability system. The utility will compute 64-character hexadecimal digests of string content to support **Invariant 3** and **Invariant 7** of the System Constitution, enabling spatial independence and cryptographic audit logging.

**Technical Approach**:

- Use Node.js built-in `crypto` module for SHA-256.
- Strict input validation (reject non-strings).
- Enforce 1GB maximum payload size to prevent memory exhaustion.
- Explicitly deterministic with no external dependencies.

**Language/Version**: TypeScript 5.8+ (Node.js 20.x runtime)
**Primary Dependencies**: Node.js `crypto` module (built-in)
**Storage**: N/A (Pure stateless utility)
**Testing**: `vitest` (Project standard)
**Target Platform**: VS Code Extension Host (Windows/macOS/Linux)
**Project Type**: Core utility for architectural trace system
**Performance Goals**: < 50ms for 1MB content payloads
**Constraints**: 1GB max string input, deterministic, 100% local, no network
**Scale/Scope**: High-frequency call potential within the trace system (audit ledger)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Rule            | Requirement                                                    | Status |
| :-------------- | :------------------------------------------------------------- | :----- |
| **Invariant 3** | Use SHA-256 for cryptographic content hashing in trace events. | PASS   |
| **Invariant 7** | Compute hashes over full artifact content.                     | PASS   |
| **Axiom 2.2**   | Treat every file write as a forensic event (requires hashing). | PASS   |
| **Law 3.3.3**   | Support cryptographic proof of content integrity.              | PASS   |
| **Law 4.5**     | Provide base for tamper-evident mechanisms.                    | PASS   |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── index.ts                 # Main entry point (exports hashing)
└── utils/
    ├── hashing.ts           # Implementation (generate_content_hash)
    └── __tests__/
        └── hashing.test.ts  # Vitest unit tests
```

**Structure Decision**: Single project core utility. Fits within existing `src/utils/` pattern for stateless helpers.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
