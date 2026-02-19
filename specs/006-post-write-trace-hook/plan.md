# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: VS Code Extension API (`vscode`), Node.js `fs`/`crypto` (for hashing and file ops)  
**Storage**: Local File System, `.orchestration/agent_trace.jsonl`  
**Testing**: Mocha/Chai (VS Code Test Runner)  
**Target Platform**: VS Code Extension Environment  
**Project Type**: VS Code Extension (Single Project)  
**Performance Goals**: <50ms per trace generation (to not block the main write pipeline synchronously)  
**Constraints**: synchronous/asynchronous file writes must not be blocked or crash if trace formatting fails.  
**Scale/Scope**: Local file modifications made by the agent process.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Invariant 2: Hook Execution Guarantee**: All trace generation is inherently part of the `PostToolUse` Hook Pipeline. **PASS**.
- **Invariant 3: Immutable Audit Trail**: This feature directly implements the creation of the immutable audit trail with proper `content_hash` relationships. **PASS**.
- **Law 3.3.1: Mutation-Intent Link**: The feature specification mandates injecting the `intent_id` (via Request ID / intent mapping) into the trace event. **PASS**.
- **Law 3.1.5: Execution Budgets**: Trace generation is a bounded sync/async process using native crypto logic. **PASS**.
- **Invariant 8: Fail-Safe Default**: Spec explicitly handles formatting failures by ensuring the base write completes safely. **PASS**.

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

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── hooks/
│   ├── base/
│   └── post/
├── utils/
│   └── crypto/
└── core/

tests/
├── hooks/
├── core/
└── utils/
```

**Structure Decision**: The project is a single VS Code Extension codebase. The file structure resides predominantly inside `src/`. Hooks will be organized in a hierarchical middleware directory `src/hooks`, with specific unit tests matching the structure inside the `tests/` directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
