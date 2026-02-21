# Implementation Plan: Verification Failure Detection Hook

**Branch**: `013-verification-failure-hook` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-verification-failure-hook/spec.md`

## Summary

Implement a high-fidelity detection hook that automatically captures linter and test runner failures. The hook will intercept non-zero exit codes from whitelisted tools (eslint, jest, vitest), perform "smart filtering" on the error output to identify affected files and concise error summaries, and record these as "raw lessons" in `AGENT.md` using the existing `LessonRecorder`.

## Technical Context

**Language/Version**: TypeScript / Node.js 20+
**Primary Dependencies**: Node.js `fs`, `path`, `crypto`. Existing `LessonRecorder`.
**Storage**: Append-only markdown (`AGENT.md`, `.lessons/`).
**Testing**: Vitest
**Target Platform**: Node.js / CLI
**Project Type**: single
**Performance Goals**: Hook overhead < 200ms per tool invocation.
**Constraints**: Must NOT block or crash the main AI tool-execution loop. Recording is a side-effect.
**Scale/Scope**: Globally monitors all `execute_command` tool calls within the task lifecycle.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **Invariant 2 (Hook Execution Guarantee)**: The feature is implemented as a post-tool hook within the `HookEngine`, ensuring it cannot be bypassed. (PASS)
2. **Invariant 3 (Immutable Audit Trail)**: Recorded lessons serve as persistent evidence of failures, linked to the active `intent_id`. (PASS)
3. **Invariant 8 (Fail-Safe Default)**: Implementation uses a try/catch wrapper and async execution to ensure recorder failures do not halt the system. (PASS)
4. **Invariant 4 (Single Orchestration Truth)**: The hook reads from the `HookEngine`'s context to determine the active intent and tool results. (PASS)

## Project Structure

### Documentation (this feature)

```text
specs/013-verification-failure-hook/
├── plan.md              # This file
├── research.md          # Post-Tool Hook research
├── data-model.md        # VerificationFailure & Lesson updates
├── quickstart.md        # User/Dev guide
├── contracts/           # N/A (Internal Hook)
└── tasks.md             # Implementation tasks
```

### Source Code

```text
src/
├── core/
│   ├── lessons/
│   │   ├── types.ts           # Update Lesson schema
│   │   └── LessonRecorder.ts  # Add validation for raw lessons
├── hooks/
│   ├── post/
│   │   └── VerificationFailureHook.ts # NEW: The detection logic
│   └── HookEngine.ts          # Integrate NEW hook into postToolUse
```

**Structure Decision**: Single project structure. Logic is split between the governance layer (`src/hooks`) and the lessons domain (`src/core/lessons`).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :-------- | :--------- | :----------------------------------- |
| N/A       |            |                                      |
