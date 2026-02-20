# Implementation Plan: Relaxed Handshake for Analysis Tools

**Branch**: `014-relaxed-handshake-analysis` | **Date**: 2026-02-20 | **Spec**: [specs/014-relaxed-handshake-analysis/spec.md](spec.md)
**Input**: Feature specification from `/specs/014-relaxed-handshake-analysis/spec.md`

## Summary

Modify the governance layer to allow `SAFE` classified tools (read-only) to execute during the `REQUEST` and `REASONING` states without an active intent. This resolves the Architect deadlock where it cannot analyze code to define an intent. The core approach involves updating `StateMachine.isToolAllowed` to permit `SAFE` tools, `build-tools.ts` to expose them when no intent is active, and updating the system prompt to reflect these new capabilities while strictly maintaining the "No mutation without intent" invariant for `DESTRUCTIVE` tools.

## Technical Context

**Language/Version**: TypeScript / Node.js
**Primary Dependencies**: VS Code Extension API, Orchestration Service, State Machine, Hook Engine
**Storage**: `.orchestration/` (Sidecar data model)
**Testing**: Unit and Integration tests (likely Vitest)
**Target Platform**: Roo Code Extension Host
**Project Type**: Single project (VS Code Extension core)
**Performance Goals**: <5ms overhead for state and classification checks during preToolUse hook.
**Constraints**: Must maintain Invariant 2 (Sole Execution Gateway).
**Scale/Scope**: Targeted changes to 4 core orchestration components.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Invariant / Law                     | Status | Rationale                                                                                                                            |
| :---------------------------------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Invariant 2** (Hook Execution)    | PASS   | All tool calls still pass through `HookEngine.preToolUse`.                                                                           |
| **Invariant 8** (Fail-Safe Default) | PASS   | Tools default to `DESTRUCTIVE` if not explicitly in the whitelist, and `SAFE` tools are still blocked if orchestration is unhealthy. |
| **Invariant 9** (Three-State Flow)  | PASS   | The states still exist and are followed; the _restriction_ within those states is refined based on safety.                           |
| **Law 3.1.1** (Mandatory Intent)    | PASS   | Mutations still strictly require an intent.                                                                                          |
| **Law 3.2.1** (Scope Enforcement)   | PASS   | Relaxed for `SAFE` tools to allow project-wide analysis as per `FR-009`.                                                             |
| **Law 4.1** (Least Privilege)       | PASS   | `DESTRUCTIVE` tools remain hard-blocked until the `ACTION` state.                                                                    |

## Project Structure

### Documentation (this feature)

```text
specs/014-relaxed-handshake-analysis/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Implementation details and decision log
├── data-model.md        # Classification and state mapping
├── quickstart.md        # Integration guide for the new flow
└── checklists/
    └── requirements.md  # Spec validation checklist
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── state/
│   │   └── StateMachine.ts    # Update isToolAllowed
│   ├── task/
│   │   └── build-tools.ts    # Update tool filtering
│   └── prompts/
│       └── sections/
│           └── intent-handshake.ts # Update system instructions
├── hooks/
│   └── HookEngine.ts          # Uses COMMAND_CLASSIFICATION
```

**Structure Decision**: Single project structure as this is a core logic modification within the existing Roo Code codebase.
