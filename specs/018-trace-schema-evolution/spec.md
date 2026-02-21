# Feature Specification: Agent Trace Schema Evolution

**Feature Branch**: `018-trace-schema-evolution`  
**Task ID**: REQ-ARCH-018  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "Consolidate the duplicate AgentTraceEntry type definitions and evolve the agent trace schema to align with the architecture document's specification, or formally document the chosen flat design as an accepted deviation with rationale."

## Assumptions

- **Approach B (Document Deviation) is chosen.** The flat schema is a pragmatic simplification that currently meets the system's operational needs. The deeply nested `files[].conversations[].ranges[]` schema from ARCHITECTURE_NOTES.md §7.2 provides multi-file, multi-conversation granularity, but this capability is not yet required — the Hook Engine processes one file mutation per PostToolUse event, not multi-file atomic transactions. Evolving to the nested schema would be a significant breaking change with no immediate consumer. Instead, the flat schema will be formally documented, ARCHITECTURE_NOTES.md §7.2 will be updated to reflect reality, and the nested schema will be preserved as a "Future Evolution" target.
- **The canonical definition will live in `src/contracts/AgentTrace.ts`.** This is the architecturally correct location: the `contracts/` directory represents cross-cutting type definitions. The `services/orchestration/types.ts` file will re-export from `contracts/AgentTrace.ts` for backward compatibility during the migration, then the re-export will be removed once all imports are redirected.
- **Contributor fields will be added as optional.** Since `entity_type` and `model_identifier` are new fields being introduced to existing entries, they must be optional to maintain backward compatibility with entries already written to `agent_trace.jsonl`. New entries SHOULD populate these fields.
- **The existing string `actor` field is retained alongside the new structured `contributor` object.** The `actor` field continues to serve as a simple identifier for existing consumers. The `contributor` object provides richer attribution data (entity type + model identifier) as required by Invariant 3 and ARCHITECTURE_NOTES.md §7.2.

## Clarifications

### Session 2026-02-21

- Q: How should the canonical `metadata` field be shaped — fully flexible `Record<string, any>`, optional-but-typed, or required-and-typed? → A: **Optional but typed** — `metadata?: { session_id: string; vcs_ref?: string; [key: string]: any }`. Optional overall (legacy entries may omit it), but when present, `session_id` is required for current consumers.
- Q: Should this feature include updating trace entry producers to populate the new `contributor` field, or only add the type definition? → A: **Yes, update producers** — `AgentTraceHook` (and any other entry constructors) MUST be updated to populate `contributor` with `entity_type` and `model_identifier` when creating new entries.
- Q: How should the naming collision between `metadata.contributor` (string) and the new top-level `contributor` (object) be resolved? → A: **Deprecate `metadata.contributor`** — remove `contributor` from the typed `metadata` shape; legacy entries with it remain valid via `[key: string]: any`. The top-level `contributor` object becomes the sole canonical attribution field.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Single Canonical Type Definition (Priority: P1)

As a developer working on the codebase, I should be able to import `AgentTraceEntry` from exactly one location (`src/contracts/AgentTrace.ts`). There should be no second, competing definition in `src/services/orchestration/types.ts`. This eliminates confusion, prevents subtle bugs from type drift, and ensures all consumers share the same contract.

**Why this priority**: Duplicate type definitions cause silent divergence — one location has `metadata` as optional, the other has it as required with a structured shape. This is the root cause of potential runtime errors and is the most impactful issue to resolve first.

**Independent Test**: Can be fully tested by verifying that all TypeScript files in the codebase import `AgentTraceEntry` from `src/contracts/AgentTrace.ts` (or a re-export thereof), and that no second interface named `AgentTraceEntry` exists anywhere. The project must compile successfully after consolidation.

**Acceptance Scenarios**:

1. **Given** the codebase has two `AgentTraceEntry` definitions (in `src/contracts/AgentTrace.ts` and `src/services/orchestration/types.ts`), **When** consolidation is complete, **Then** exactly one `AgentTraceEntry` interface exists in `src/contracts/AgentTrace.ts` and all files that previously imported from `src/services/orchestration/types.ts` now import from the canonical location (directly or via re-export).
2. **Given** the consolidated type definition, **When** the project is compiled with `tsc --noEmit`, **Then** zero type errors are produced.
3. **Given** the `src/services/orchestration/types.ts` file, **When** a developer inspects it after consolidation, **Then** it either re-exports `AgentTraceEntry` from `src/contracts/AgentTrace.ts` (temporary compatibility) or does not contain any `AgentTraceEntry` definition at all (final state).

---

### User Story 2 — Contributor Attribution in Trace Entries (Priority: P2)

As an auditor reviewing `agent_trace.jsonl`, I should be able to determine from each entry whether the change was made by an AI agent (and which model performed it) or by a human. This enables provenance tracking as required by Invariant 3 and the contributor attribution design in ARCHITECTURE_NOTES.md §7.2.

**Why this priority**: Contributor attribution is a constitutional requirement (Invariant 3 mandates "contributor attribution"). Without it, auditors cannot distinguish AI-generated changes from human-generated ones, undermining trust and forensic capability.

**Independent Test**: Can be fully tested by creating trace entries with the new `contributor` field and verifying the field structure is accepted by the type system, that entries without the field (legacy entries) remain valid, and that entries with the field correctly identify the entity type and model.

**Acceptance Scenarios**:

1. **Given** the consolidated `AgentTraceEntry` interface, **When** a developer inspects its type definition, **Then** it includes a `contributor` object with `entity_type` (accepting `"AI"` or `"HUMAN"`) and an optional `model_identifier` (string).
2. **Given** a trace entry written by the AgentTraceHook after a file mutation, **When** the entry is read from `agent_trace.jsonl`, **Then** it contains a `contributor` object with `entity_type` set to `"AI"` and `model_identifier` set to the model name that generated the change.
3. **Given** a legacy trace entry in `agent_trace.jsonl` that lacks a `contributor` field, **When** a reader processes the file, **Then** the reader handles the absent field gracefully (the field is optional in the type definition).

---

### User Story 3 — Documentation Alignment (Priority: P3)

As a schema reader or new contributor, the documentation in ARCHITECTURE_NOTES.md §7.2 should accurately describe the actual structure of entries in `agent_trace.jsonl`. The documented schema should match the code's type definition so there is no confusion about what format entries actually take.

**Why this priority**: Documentation–implementation mismatch is a governance violation under Law 6.3 (Knowledge Currency). While it does not break runtime behavior, it misleads developers and auditors and increases cognitive debt. This is lower priority than the type consolidation and contributor fields because it is a documentation-only change.

**Independent Test**: Can be tested by comparing the JSON example in ARCHITECTURE_NOTES.md §7.2 against the `AgentTraceEntry` interface definition — every field in the documented example should correspond to a field in the type, and vice versa.

**Acceptance Scenarios**:

1. **Given** the updated ARCHITECTURE_NOTES.md §7.2, **When** a reader compares the documented JSON schema example to the `AgentTraceEntry` interface in `src/contracts/AgentTrace.ts`, **Then** every field in the example maps to a field in the interface with matching name, type, and optionality.
2. **Given** the updated ARCHITECTURE_NOTES.md §7.2, **When** a reader looks for the previously documented nested `files[].conversations[].ranges[]` structure, **Then** they find it relocated to a "Future Evolution" note explaining it is the target schema for multi-file atomic operations when that capability is needed.
3. **Given** the documentation update, **When** the "Critical Design Properties" section of §7.2 is reviewed, **Then** it retains the descriptions of Spatial Independence via Content Hashing, the Golden Thread to SpecKit, and Contributor Attribution — updated to reflect the flat schema's approach to each.

---

### Edge Cases

- What happens when an existing `agent_trace.jsonl` file contains entries written under the old schema (no `contributor` field)? The reader must tolerate the absence — the `contributor` field is optional.
- What happens when `metadata` is omitted from a legacy entry? The consolidated type must define `metadata` as optional (matching the contracts version) since legacy entries may not include it.
- What happens if both `actor` (legacy string field) and `contributor` (new structured object) are present on an entry? Both are retained. `actor` is the backward-compatible simple identifier; `contributor` provides richer attribution. Neither is derived from the other. Note: the legacy `metadata.contributor` string is deprecated — new entries MUST NOT write to `metadata.contributor`; the top-level `contributor` object supersedes it.
- What happens if a downstream consumer imports `AgentTraceEntry` from the old `services/orchestration/types.ts` path after consolidation? During the migration period, a re-export ensures backward compatibility. After migration, the import path will produce a compile error, guiding the developer to the canonical location.
- What happens if the `state` field references `ExecutionState` from `services/orchestration/types.ts`? **Resolved (see research.md RQ-1):** `ExecutionState` is defined as a string literal union (`"REQUEST" | "REASONING" | "ACTION"`) directly in `contracts/AgentTrace.ts` to avoid circular imports. The `services/orchestration/types.ts` file re-exports it for backward compatibility.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST have exactly one canonical `AgentTraceEntry` interface definition, located in `src/contracts/AgentTrace.ts`.
- **FR-002**: The canonical `AgentTraceEntry` interface MUST be a superset of both existing definitions — retaining all fields from both the contracts version and the operational version, with the most permissive optionality (fields that are optional in either definition remain optional in the canonical version).
- **FR-003**: All source files that import `AgentTraceEntry` MUST reference the canonical definition (directly or via a temporary re-export from `src/services/orchestration/types.ts`).
- **FR-004**: The canonical `AgentTraceEntry` MUST include a `contributor` object with the following shape: `{ entity_type: "AI" | "HUMAN"; model_identifier?: string }`. This field MUST be optional to maintain backward compatibility with existing JSONL entries.
- **FR-005**: The `metadata` field in the canonical definition MUST be optional (`metadata?: ...`) to maintain backward compatibility with entries that omit it. When present, it MUST have a typed shape where `session_id` is required.
- **FR-006**: The `metadata` field shape MUST be `metadata?: { session_id: string; vcs_ref?: string; [key: string]: any }` — optional overall for legacy tolerance, but typed when present so that current consumers retain compile-time guarantees on `session_id`.
- **FR-007**: ARCHITECTURE_NOTES.md §7.2 MUST be updated to show the actual flat schema as the current implementation, with the nested `files[].conversations[].ranges[]` schema preserved as a documented "Future Evolution" target.
- **FR-008**: The `ILedgerManager` interface MUST remain in `src/contracts/AgentTrace.ts` alongside the canonical `AgentTraceEntry`, using the consolidated type for its `append()` method signature.
- **FR-009**: Existing entries in `agent_trace.jsonl` MUST NOT be modified, deleted, or re-formatted — per Invariant 3 (Immutable Audit Trail).
- **FR-010**: All existing tests MUST continue to pass after the type consolidation and import migration.
- **FR-011**: New tests MUST verify that all codebase imports of `AgentTraceEntry` resolve to the single canonical definition.
- **FR-012**: The re-export from `src/services/orchestration/types.ts` (if used during migration) MUST include a deprecation comment directing developers to the canonical import path.
- **FR-013**: All trace entry producers (including `AgentTraceHook` and any code that constructs `AgentTraceEntry` objects) MUST be updated to populate the `contributor` field with `entity_type` (set to `"AI"` for agent-generated entries) and `model_identifier` (set to the active model name) when creating new trace entries.
- **FR-014**: The `metadata.contributor` string field is deprecated. New trace entries MUST NOT populate `metadata.contributor`; the top-level `contributor` object is the sole canonical attribution field. Legacy entries that contain `metadata.contributor` remain valid and readable via the `[key: string]: any` index signature on the metadata type.

### Key Entities

- **AgentTraceEntry**: The canonical type representing a single mutation record in the agent trace ledger. Core fields include: `trace_id`, `timestamp`, `mutation_class`, `intent_id`, `related`, `ranges` (with `file`, `content_hash`, `start_line`, `end_line`), `actor`, `summary`, and the new `contributor` object. Optional fields include `state`, `action_type`, `payload`, `result`, and `metadata`.
- **Contributor**: A structured attribution object identifying the author of a trace entry. Contains `entity_type` (`"AI"` or `"HUMAN"`) and an optional `model_identifier` (string naming the specific model, e.g., `"claude-3-5-sonnet"`).
- **ILedgerManager**: The service interface for the append-only ledger, co-located with `AgentTraceEntry` in the contracts file. Defines the `append(entry: AgentTraceEntry)` method contract.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Exactly one `AgentTraceEntry` interface definition exists across the entire codebase (verified by a grep/search returning exactly one `export interface AgentTraceEntry` match).
- **SC-002**: 100% of source files importing `AgentTraceEntry` resolve to the canonical definition in `src/contracts/AgentTrace.ts` (verified by import analysis).
- **SC-003**: The `contributor` field is present in the canonical type definition with the correct shape (`entity_type: "AI" | "HUMAN"`, `model_identifier?: string`), verifiable by type inspection.
- **SC-004**: ARCHITECTURE_NOTES.md §7.2 contains a JSON example that exactly matches the canonical `AgentTraceEntry` field structure (verified by manual comparison).
- **SC-005**: All existing automated tests pass without modification to test logic (test files may update import paths only).
- **SC-006**: Zero TypeScript compilation errors after the consolidation (`tsc --noEmit` exits with code 0).
