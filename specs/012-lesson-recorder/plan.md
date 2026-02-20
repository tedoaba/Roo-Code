# Implementation Plan: Automated Lessons Learned Recorder

**Branch**: `012-lesson-recorder` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-lesson-recorder/spec.md`

## Summary

Implement a recording tool that captures verification failures (linter, tests, static analysis) and appends them to a "Lessons Learned" section in `AGENT.md`. The tool will receive metadata (cause, resolution, rule) from the calling AI agent, perform atomic appends, and handle de-duplication to maintain a lean, high-value log for system self-improvement.

## Technical Context

**Language/Version**: TypeScript / Node.js (v20+)
**Primary Dependencies**: `node:fs`, `node:path`, `node:crypto` (for hashing/de-duplication)
**Storage**: Flat file (`AGENT.md`) with structured Markdown blocks.
**Testing**: Jest (Unit and Integration tests)
**Target Platform**: Local development environment (Node.js)
**Traceability**: MUST log all mutations to `.orchestration/agent_trace.jsonl` using `LedgerManager`.
**Project Type**: System Utility / Agent Middleware
**Performance Goals**: Append operations < 50ms; Deduplication check < 20ms.
**Constraints**: MUST be atomic; MUST NOT crash the main agent flow on write failure; MUST handle concurrent execution (file locking); MUST truncate error summaries to 500 chars.
**Scale/Scope**: Support for thousands of entries in `AGENT.md`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| ID          | Law / Invariant            | Status | Alignment / Violation Rationale                                                                                  |
| :---------- | :------------------------- | :----- | :--------------------------------------------------------------------------------------------------------------- |
| Axiom 2     | Every mutation is evidence | PASS   | Feature provides a structured log of tool failures and their resolution, enriching the system's evidence base.   |
| Invariant 3 | Immutable Audit Trail      | PASS   | The recorder uses append-only logic and deterministic formatting, serving as a persistent memory of failures.    |
| Invariant 4 | Single Source of Truth     | PASS   | `AGENT.md` is explicitly part of the shared brain/orchestration state. This feature populates it systematically. |
| Law 3.3.1   | Mutation-Intent Link       | PASS   | Every recorded lesson should include the intent ID under which the failure occurred for full traceability.       |
| Law 6.4     | Self-Describing System     | PASS   | Improves the system's ability to self-correct by providing a persistent history of previous mistakes and rules.  |

## Project Structure

### Documentation (this feature)

```text
specs/012-lesson-recorder/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (generated separately)
```

### Source Code (repository root)

```text
src/
├── core/
│   └── lessons/
│       ├── LessonRecorder.ts   # Core logic for writing to AGENT.md
│       ├── Deduplicator.ts     # Logic for [File+Error] signature matching
│       └── types.ts            # Lesson entity definitions
├── cli/
│   └── record-lesson.ts       # CLI entry point for agents to call
└── hooks/
    └── PostVerificationHook.ts # Potential integration point for automated triggers
tests/
├── unit/
│   ├── LessonRecorder.test.ts
│   └── Deduplicator.test.ts
└── integration/
    └── record-lesson.test.ts
```

**Structure Decision**: Single project structure within the existing `src/` hierarchy. The logic is encapsulated in `src/core/lessons/` to allow for both CLI and direct programmatic usage.
