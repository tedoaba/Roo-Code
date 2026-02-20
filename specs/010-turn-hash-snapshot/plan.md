# Implementation Plan: Agent Turn Hash Snapshot

**Branch**: `010-turn-hash-snapshot` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification for Agent Turn Hash Snapshot.

## Summary

This feature implements an immutable "First-Read" snapshotting mechanism for file hashes within an agent's execution turn. This provides a reliable baseline for the **Optimistic Locking Guard** (009), ensuring that if a file is modified externally after the agent first encounters it, the conflict is detected accurately.

The implementation will extend `ITurnContext` to support immutable snapshotting, providing `startTurn()`/`endTurn()` lifecycle methods and `get_initial_hash()` retrieval. It will use the `generate_content_hash` utility (005) and implement an atomic "Compute-If-Absent" pattern to handle concurrent tool reads safely.

**Language/Version**: TypeScript 5.0+  
**Primary Dependencies**: `fs/promises`, SHA-256 Utility (`src/utils/hashing.ts`)  
**Storage**: In-memory `Map<string, string | Promise<string | null>>`  
**Testing**: Vitest (Unit & Lifecycle tests)  
**Target Platform**: Extension Host (Visual Studio Code / Roo-Code)
**Project Type**: Core Logic / Concurrency Utilities  
**Performance Goals**: Sub-millisecond retrieval for cached hashes; SHA-256 computation bound by file size (target <50ms for 1MB).  
**Constraints**: Memory-scoped to turn; total immutability after first read; 0% leakage between turns.  
**Scale/Scope**: Managed within `TurnContext` in `src/core/concurrency/`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Invariant 6: Deterministic Conflict Resolution**: This feature is a direct enabler of deterministic conflict resolution by providing the immutable baseline needed for optimistic locking.
- **Invariant 7: Cryptographic Content Integrity**: Uses the SHA-256 hashing standard defined in the constitution.
- **Law 5.2: Atomic State Transitions**: Implementation must use atomic "Compute-If-Absent" patterns for snapshot creation to prevent race conditions during concurrent tool execution.
- **Law 7.4: Rollback Integrity**: While this is a read-only state, it supports rollback integrity by ensuring mutation validation is based on a fixed point in time.

## Project Structure

### Documentation (this feature)

```text
specs/010-turn-hash-snapshot/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── core/
│   └── concurrency/
│       ├── types.ts          # Updated Interfaces
│       ├── TurnContext.ts    # Extended Implementation
│       └── __tests__/
│           └── TurnLifecycle.test.ts
└── utils/
    └── hashing.ts            # Existing utility
```

**Structure Decision**: Enhancing existing `src/core/concurrency` module as this is an evolution of the `TurnContext` and `OptimisticGuard` infrastructure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |
