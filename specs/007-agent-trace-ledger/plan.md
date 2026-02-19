# Implementation Plan: Agent Trace Ledger (Append-Only)

**Branch**: `007-agent-trace-ledger` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-agent-trace-ledger/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The goal is to implement a persistent, append-only semantic trace ledger (`agent_trace.jsonl`) located in the `.orchestration/` directory. This ledger will record every mutation performed by the agent, satisfying Invariant 3 of the System Constitution. The implementation will ensure that each mutation results in exactly one JSON Line entry, that existing data is never overwritten, and that append operations are atomic to prevent corruption during concurrent writes.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node.js 18+)
**Primary Dependencies**: Node.js `fs/promises`, `crypto` (for SHA-256 hashing)
**Storage**: Append-only JSONL file (`.orchestration/agent_trace.jsonl`)
**Testing**: Jest (unit and integration tests)
**Target Platform**: VS Code Extension (Roo-Code)
**Project Type**: Single project
**Performance Goals**: <50ms per write operation to avoid blocking agent turns
**Constraints**: Atomic appends, no data loss, no overwrites
**Scale/Scope**: Approximately 1KB per trace entry, growing linearly with mutations

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Invariant                                 | Status | Alignment/Justification                                                     |
| :---------------------------------------- | :----- | :-------------------------------------------------------------------------- |
| **Invariant 2: Hook Execution Guarantee** | Pass   | Ledger writes will be integrated into the `PostToolUse` hook phase.         |
| **Invariant 3: Immutable Audit Trail**    | Pass   | This feature directly implements the append-only audit ledger requirements. |
| **Invariant 4: Single Source of Truth**   | Pass   | Storage is within the mandated `.orchestration/` directory.                 |
| **Invariant 7: Cryptographic Integrity**  | Pass   | Trace entries will include SHA-256 hashes of mutations.                     |
| **Invariant 9: Three-State Flow**         | Pass   | Trace entries will record transitions in the execution flow.                |

## Project Structure

### Documentation (this feature)

```text
specs/007-agent-trace-ledger/
├── plan.md              # This file
├── research.md          # Implementation details research
├── data-model.md        # Trace entry schema design
├── quickstart.md        # Integration guide
├── contracts/           # Ledger interface definitions
└── tasks.md             # Implementation tasks (Phase 2)
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
│   ├── post/
│   │   ├── AgentTraceHook.ts    # New hook for trace logging
│   │   └── __tests__/
│   │       └── AgentTraceHook.test.ts
├── contracts/
│   └── AgentTrace.ts           # Trace entry interface
└── utils/
    └── orchestration/
        └── LedgerManager.ts     # Atomic append implementation
```

**Structure Decision**: Single Project structure. Implementing the ledger manager as a utility and integrating it via the existing hook system ensures governance is enforced on all mutation paths.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :-------- | :--------- | :----------------------------------- |
| None      | N/A        | N/A                                  |
