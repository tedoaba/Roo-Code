# Research: Sidecar Data Model Alignment

## Technical Context Analysis

The `.orchestration/` directory contains sidecar files that track the system's state. There is a documented mismatch between the architecture specification and the current implementation regarding:

1. The presence and initial content of `intent_map.md`.
2. The root key in `active_intents.yaml`.

### Unknowns & Findings

#### Intent Map Schema

- **Requirement**: `intent_map.md` should be created during initialization with a specific header and placeholder.
- **Findings**: `OrchestrationService.initializeOrchestration()` currently creates it with a table format, which contradicts the §7.3 requirement in the current feature spec.
- **Decision**: Update the initialization template to:

    ```markdown
    # Intent Map

    _No intents have been mapped yet._
    ```

#### Active Intents YAML Root Key

- **Requirement**: Root key should be `active_intents:` instead of `intents:`.
- **Findings**:
    - `OrchestrationService.ts` defines `ActiveIntentsFile` with `intents`.
    - `getActiveIntents()` directly accesses `data.intents`.
    - `saveIntents()` writes `{ intents }`.
- **Decision**:
    - Update `ActiveIntentsFile` to support both.
    - Implement a prioritized lookup in `getActiveIntents()` (as per clarification session 2026-02-21).
    - Canonicalize to `active_intents:` in `saveIntents()`.

## Best Practices

### Graceful Migration

When changing data schemas in persistent storage, it's critical to avoid breaking existing data.

- **Decision**: The reader will check for the canonical key first, then fall back to the legacy key. The writer will always use the canonical key, effectively migrating the file on the next write operation.

### Non-Destructive Initialization

`initializeOrchestration()` should be idempotent and not overwrite existing user-authored or valid system documentation.

- **Decision**: Use `fs.access` (or similar check) before writing each file, as already partially implemented, but ensure it covers all required files correctly.

## Alternatives Considered

- **Forced Migration**: A one-time script to migrate all files. Rejected because it may be intrusive if run in a shared environment and simple code-level fallback is more resilient.
- **Combined Keys**: Storing both in the file. Rejected as it adds unnecessary clutter and duplication.
