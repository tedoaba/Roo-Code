# Implementation Plan: Stale File Error Protocol

**Branch**: `011-stale-write-error` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-stale-write-error/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The objective of this feature is to standardize and enforce the rejection behavior when a stale write is detected (i.e., when a file's actual hash on disk differs from the expected hash computed when the file was last read). The system will prevent partial writes, return a deterministic and machine-readable JSON error payload, and log the conflict event strictly to the Agent Trace Ledger. This ensures Agent Controllers can explicitly trigger a `RE_READ_REQUIRED` flow rather than hallucinating logic based on untyped errors.

## Technical Context

**Language/Version**: TypeScript (Node.js/VSCode Extension context)
**Primary Dependencies**: `HookEngine`, `AgentTraceHook`, generic `vscode` FS APIs.
**Storage**: Agent Trace Ledger (`.orchestration/agent_trace.jsonl`) for audit logs.
**Testing**: Jest (Unit testing), ensuring zero data corruption and strict JSON schema adherence.
**Target Platform**: VSCode Extension Host / AI Agent execution environment.
**Project Type**: Single extension project
**Performance Goals**: Minimal overhead for write/rejection, O(1) error creation.
**Constraints**: Must strictly output exactly `{ error_type: "STALE_FILE", ... }` directly to the controller output without wrapper text. Must strictly prevent any partial writes.
**Scale/Scope**: Impacts all file mutation tools (e.g., `write_to_file`, `replace_file_content`).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **V1: Intent-Code Binding (Inv 1)**: Any mutations resolving stale write fixes will be performed under a specific intent. The rejection itself prevents unauthorized mutations. **PASS**.
- **V2: Hook Execution Guarantee (Inv 2)**: The check will be enforced in the Hook Pipeline (specifically the `OptimisticGuard` in `PreToolUse`), acting as the execution gateway. **PASS**.
- **V3: Immutable Audit Trail (Inv 3)**: Conflict events will be logged to `agent_trace.jsonl` using the `AgentTraceHook`/`LedgerManager` to ensure traceability of rejections. **PASS**.
- **V4: Security & Privilege Separation (Part IV)**: Rejection of writes guarantees isolation and prevents corruption of other systems or scopes. **PASS**.
- **V5: Fail-Safe Default (Inv 8)**: The system defaults to denial of action (rejection) when hash mismatches occur, preventing ungoverned mutations. **PASS**.

The plan conforms completely to the Constitution.

## Project Structure

### Documentation (this feature)

```text
specs/011-stale-write-error/
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
│   └── concurrency/
│       ├── types.ts          (update error types)
│       └── OptimisticGuard.ts (update to throw the specific error format)
└── hooks/
    ├── errors/
    │   └── StaleWriteError.ts (new custom Error class)
    ├── AgentTraceHook.ts      (update to listen for StaleWriteError and log to ledger)
    └── HookEngine.ts          (update to format generic rejection text as raw JSON)
```

**Structure Decision**: The logic integrates naturally into the existing `src/core/concurrency` and `src/hooks` structure established in features `009-optimistic-locking-guard` and `007-agent-trace-ledger`.

## Complexity Tracking

No violations. Alternative architectures are not necessary; this simply enforces a strict JSON output constraint and audit logging policy for an existing mechanism (optimistic locks).
