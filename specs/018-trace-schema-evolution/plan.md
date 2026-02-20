# Implementation Plan: Agent Trace Schema Evolution

**Branch**: `018-trace-schema-evolution` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-trace-schema-evolution/spec.md`

## Summary

Consolidation of the duplicate `AgentTraceEntry` interface into a single canonical definition in `src/contracts/AgentTrace.ts`, addition of structured contributor attribution (`entity_type`, `model_identifier`), migration of all 8 import sites, deprecation of `metadata.contributor` in favor of the new top-level `contributor` object, update of all trace entry producers to populate the new field, and alignment of ARCHITECTURE_NOTES.md §7.2 with the actual flat schema.

## Technical Context

**Language/Version**: TypeScript 5.x (VS Code extension, Node.js runtime)
**Primary Dependencies**: VS Code Extension API, Node.js `fs/promises`, `crypto` (randomUUID, SHA-256)
**Storage**: Append-only JSONL file (`.orchestration/agent_trace.jsonl`)
**Testing**: Vitest (unit + integration tests)
**Target Platform**: VS Code Extension Host (Node.js, cross-platform)
**Project Type**: Single project (VS Code extension with `src/` source tree)
**Performance Goals**: Trace entry append < 10ms (current baseline, unchanged by this feature)
**Constraints**: Zero breaking changes to existing JSONL entries (Invariant 3); zero compile errors after migration
**Scale/Scope**: 8 import sites, 2 type definitions to consolidate, ~12 producer call sites to update, 1 documentation file to update

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Constitutional Law                           | Assessment | Rationale                                                                                                                 |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Invariant 1** (Intent–Code Binding)        | PASS       | No change to the intent–code binding mechanism. Trace entries continue to carry `intent_id` and `related[]`.              |
| **Invariant 2** (Hook Execution Guarantee)   | PASS       | No change to hook execution flows. Only the data shape passing through hooks changes.                                     |
| **Invariant 3** (Immutable Audit Trail)      | PASS       | FR-009 explicitly preserves existing entries. New `contributor` field enriches attribution per Invariant 3's requirement. |
| **Invariant 4** (Single Orchestration Truth) | PASS       | No change to the orchestration state structure. Only the type definition used for trace entries is consolidated.          |
| **Invariant 7** (Cryptographic Integrity)    | PASS       | No change to content hashing algorithm or computation. `content_hash` remains SHA-256.                                    |
| **Invariant 8** (Fail-Safe Default)          | PASS       | New fields are optional; absence defaults to graceful handling. No permissive execution introduced.                       |
| **Law 6.3** (Knowledge Currency)             | PASS       | FR-007 directly addresses documentation–implementation drift by updating ARCHITECTURE_NOTES.md §7.2.                      |
| **Law 8.2** (Backward Compatibility)         | PASS       | All new fields are optional. Legacy entries remain valid and interpretable. No retroactive invalidation.                  |

**Gate Result**: ✅ PASS — All relevant invariants and laws are satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/018-trace-schema-evolution/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Technical research & decisions
├── data-model.md        # Phase 1: Data model specification
├── quickstart.md        # Phase 1: Implementation quickstart guide
├── contracts/           # Phase 1: API contracts
│   └── AgentTraceEntry.ts.md  # Canonical type contract specification
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── contracts/
│   └── AgentTrace.ts              # CANONICAL: Consolidated AgentTraceEntry + ILedgerManager
├── services/orchestration/
│   ├── types.ts                   # MODIFIED: Remove AgentTraceEntry, add re-export + deprecation
│   └── OrchestrationService.ts    # MODIFIED: Update logTrace calls with contributor
├── hooks/
│   ├── post/
│   │   ├── AgentTraceHook.ts      # MODIFIED: Populate contributor in recordMutation calls
│   │   └── AuditHook.ts           # MODIFIED: Replace metadata.contributor → top-level contributor
│   ├── pre/
│   │   ├── ScopeEnforcementHook.ts  # MODIFIED: Add contributor to logTrace calls
│   │   ├── ContextEnrichmentHook.ts # MODIFIED: Add contributor to logTrace calls
│   │   └── BudgetHook.ts           # MODIFIED: Add contributor to logTrace calls
│   ├── HookEngine.ts              # MODIFIED: Remove `as any` casts, add contributor
│   └── __tests__/                 # MODIFIED: Update mocks and assertions
├── core/
│   ├── tools/
│   │   └── SelectActiveIntent.ts  # MODIFIED: Import from contracts, add contributor
│   ├── state/
│   │   └── StateMachine.ts        # MODIFIED: Import from contracts, add contributor
│   ├── prompts/sections/
│   │   └── intent-handshake.ts    # MODIFIED: Import from contracts
│   └── lessons/
│       └── LessonAuditLogger.ts   # MODIFIED: Add contributor to recordMutation
├── utils/orchestration/
│   ├── LedgerManager.ts           # UNCHANGED: Already imports from contracts
│   └── __tests__/                 # MODIFIED: Update test entry shapes
├── ARCHITECTURE_NOTES.md          # MODIFIED: §7.2 updated to flat schema
```

**Structure Decision**: Single project. No structural changes — only type consolidation, import migration, and field addition within existing files.

## Post-Phase 1 Constitution Re-Check

_Re-evaluated after data-model.md, contracts/, and quickstart.md were produced._

| Constitutional Law                           | Pre-Phase 0 | Post-Phase 1 | Notes                                                                                            |
| -------------------------------------------- | ----------- | ------------ | ------------------------------------------------------------------------------------------------ |
| **Invariant 1** (Intent–Code Binding)        | PASS        | PASS         | Unchanged — `intent_id` and `related[]` preserved in canonical type.                             |
| **Invariant 2** (Hook Execution Guarantee)   | PASS        | PASS         | Unchanged — no new execution paths bypass hooks.                                                 |
| **Invariant 3** (Immutable Audit Trail)      | PASS        | PASS         | Strengthened — `contributor` field adds the attribution previously missing from the audit trail. |
| **Invariant 4** (Single Orchestration Truth) | PASS        | PASS         | Improved — eliminating the duplicate type definition removes a source of truth conflict.         |
| **Invariant 7** (Cryptographic Integrity)    | PASS        | PASS         | Unchanged — SHA-256 computation and `content_hash` field unchanged.                              |
| **Invariant 8** (Fail-Safe Default)          | PASS        | PASS         | Unchanged — optional fields default to absent, not permissive.                                   |
| **Law 6.3** (Knowledge Currency)             | PASS        | PASS         | Addressed — ARCHITECTURE_NOTES.md §7.2 update planned in quickstart Step 3.                      |
| **Law 8.2** (Backward Compatibility)         | PASS        | PASS         | Verified — data model's Field Consolidation Matrix confirms all fields are backward-compatible.  |

**Post-Design Gate Result**: ✅ PASS — No regressions introduced by the design phase.

## Complexity Tracking

No constitution violations detected. No complexity justifications required.

## Generated Artifacts

| Artifact               | Path                                                               | Status      |
| ---------------------- | ------------------------------------------------------------------ | ----------- |
| Implementation Plan    | `specs/018-trace-schema-evolution/plan.md`                         | ✅ Complete |
| Research               | `specs/018-trace-schema-evolution/research.md`                     | ✅ Complete |
| Data Model             | `specs/018-trace-schema-evolution/data-model.md`                   | ✅ Complete |
| Contract               | `specs/018-trace-schema-evolution/contracts/AgentTraceEntry.ts.md` | ✅ Complete |
| Quickstart             | `specs/018-trace-schema-evolution/quickstart.md`                   | ✅ Complete |
| Spec Quality Checklist | `specs/018-trace-schema-evolution/checklists/requirements.md`      | ✅ Complete |
