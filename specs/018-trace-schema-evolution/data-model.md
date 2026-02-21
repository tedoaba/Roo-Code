# Data Model: Agent Trace Schema Evolution

**Feature**: 018-trace-schema-evolution
**Date**: 2026-02-21

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AgentTraceEntry                            │
│  (Canonical: src/contracts/AgentTrace.ts)                       │
├─────────────────────────────────────────────────────────────────┤
│  trace_id:        string         (UUID v4, required)            │
│  timestamp:       string         (ISO 8601, required)           │
│  mutation_class:  string         (required)                     │
│  intent_id:       string | null  (FK → ActiveIntent.id)         │
│  related:         string[]       (intent/spec references)       │
│  ranges:          TraceRanges    (required, inline object)      │
│  actor:           string         (legacy identifier, required)  │
│  summary:         string         (required)                     │
│  contributor?:    Contributor    (NEW — structured attribution)  │
│  state?:          ExecutionState (REQUEST|REASONING|ACTION)      │
│  action_type?:    string         (e.g. TOOL_EXECUTION)          │
│  payload?:        any            (operation input)               │
│  result?:         any            (operation output)              │
│  metadata?:       TraceMetadata  (typed when present)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TraceRanges                              │
│  (Inline object within AgentTraceEntry)                         │
├─────────────────────────────────────────────────────────────────┤
│  file:            string         (relative path, required)      │
│  content_hash:    string         (SHA-256 or "n/a", required)   │
│  start_line:      number         (1-indexed, required)          │
│  end_line:        number         (-1 = EOF, required)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Contributor (NEW)                        │
│  (Inline object within AgentTraceEntry)                         │
├─────────────────────────────────────────────────────────────────┤
│  entity_type:     "AI" | "HUMAN" (required when present)        │
│  model_identifier?: string       (e.g. "claude-3-5-sonnet")    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TraceMetadata                              │
│  (Inline object within AgentTraceEntry, optional overall)       │
├─────────────────────────────────────────────────────────────────┤
│  session_id:      string         (required when metadata present)│
│  vcs_ref?:        string         (git SHA)                      │
│  [key: string]:   any            (extensible index signature)   │
│                                                                 │
│  NOTE: metadata.contributor is DEPRECATED.                      │
│  Use top-level contributor object instead.                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ExecutionState (MOVED)                     │
│  (Now defined in contracts/AgentTrace.ts, re-exported)          │
├─────────────────────────────────────────────────────────────────┤
│  "REQUEST" | "REASONING" | "ACTION"                             │
└─────────────────────────────────────────────────────────────────┘
```

## Relationships

```
AgentTraceEntry.intent_id ──FK──► ActiveIntent.id
                                  (defined in services/orchestration/types.ts)

AgentTraceEntry.related[] ──refs──► Intent IDs, Spec IDs (REQ-*)

AgentTraceEntry.ranges.file ──path──► Project filesystem
                                      (relative to project root)

AgentTraceEntry.ranges.content_hash ──SHA256──► File content at mutation time
```

## Field Consolidation Matrix

Shows how each field from both existing definitions merges into the canonical type.

| Field            | `contracts/AgentTrace.ts` (current)            | `services/orchestration/types.ts` (current)                                      | Canonical (new)                                                            | Notes                                                                                    |
| ---------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `trace_id`       | `string` (required)                            | `string` (required)                                                              | `string` (required)                                                        | Identical                                                                                |
| `timestamp`      | `string` (required)                            | `string` (required)                                                              | `string` (required)                                                        | Identical                                                                                |
| `mutation_class` | `string` (required)                            | `string` (required)                                                              | `string` (required)                                                        | Identical                                                                                |
| `intent_id`      | `string \| null` (required)                    | `string \| null` (required)                                                      | `string \| null` (required)                                                | Identical                                                                                |
| `related`        | `string[]` (required)                          | `string[]` (required)                                                            | `string[]` (required)                                                      | Identical                                                                                |
| `ranges`         | `{ file, content_hash, start_line, end_line }` | `{ file, content_hash, start_line, end_line }`                                   | `{ file, content_hash, start_line, end_line }`                             | Identical                                                                                |
| `actor`          | `string` (required)                            | `string` (required)                                                              | `string` (required)                                                        | Identical                                                                                |
| `summary`        | `string` (required)                            | `string` (required)                                                              | `string` (required)                                                        | Identical                                                                                |
| `state`          | `string?` (optional)                           | `ExecutionState?` (optional)                                                     | `ExecutionState?` (optional)                                               | Upgraded: was `string`, now typed                                                        |
| `action_type`    | `string?` (optional)                           | `string?` (optional)                                                             | `string?` (optional)                                                       | Identical                                                                                |
| `payload`        | `any?` (optional)                              | `any?` (optional)                                                                | `any?` (optional)                                                          | Identical                                                                                |
| `result`         | `any?` (optional)                              | `any?` (optional)                                                                | `any?` (optional)                                                          | Identical                                                                                |
| `metadata`       | `Record<string, any>?` (optional)              | `{ session_id: string; vcs_ref?: string; contributor?: string; ... }` (required) | `{ session_id: string; vcs_ref?: string; [key: string]: any }?` (optional) | Merged: optional from contracts, typed from services. `metadata.contributor` deprecated. |
| `contributor`    | _(absent)_                                     | _(absent)_                                                                       | `{ entity_type: "AI" \| "HUMAN"; model_identifier?: string }?` (optional)  | **NEW** — added per FR-004                                                               |

## Validation Rules

1. **trace_id**: Must be a valid UUID v4 string.
2. **timestamp**: Must be a valid ISO 8601 datetime string.
3. **intent_id**: Must be either `null` (for system events) or a valid intent ID string.
4. **ranges.content_hash**: Must be a SHA-256 hex string prefixed with `sha256:`, or `"n/a"` for non-file events.
5. **contributor.entity_type**: Must be exactly `"AI"` or `"HUMAN"` when the `contributor` object is present.
6. **metadata.session_id**: Must be a non-empty string when `metadata` is present.

## State Transitions

No state transitions apply to `AgentTraceEntry` itself — it is an immutable record. Once written to `agent_trace.jsonl`, it is never modified (Invariant 3).

The `state` field within an entry records the `ExecutionState` at the time of the event, not a mutable state of the entry itself.

## Backward Compatibility

- **Legacy entries without `contributor`**: Valid. Field is optional.
- **Legacy entries without `metadata`**: Valid. Field is optional.
- **Legacy entries with `metadata.contributor` (string)**: Valid. The `[key: string]: any` index signature accommodates the legacy field. Readers should prefer the top-level `contributor` object when present.
- **Legacy entries with `state: string` (non-typed)**: Valid. TypeScript's structural typing accepts the existing string values.
