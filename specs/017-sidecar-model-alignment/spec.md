# Feature Specification: Sidecar Data Model Alignment

**Feature Branch**: `017-sidecar-model-alignment`  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "Sidecar Data Model Alignment. Task ID: REQ-ARCH-017. Align the .orchestration/ sidecar data model with the architecture specification by: (1) creating intent_map.md during orchestration initialization, and (2) fixing the active_intents.yaml root key from 'intents:' to 'active_intents:' as documented."

## Clarifications

### Session 2026-02-21

- Q: Mixed Keys Precedence → A: Prioritize `active_intents:` (canonical) and ignore `intents:` (legacy) if both are present.
- Q: Initialization Overwrite Policy → A: Only create `intent_map.md` if the file is missing; preserve content if it already exists.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Initial Sidecar State (Priority: P1)

As a developer inspecting the `.orchestration/` directory for the first time, I should see all documented sidecar files present with sensible defaults so that I understand the spatial mapping of intents.

**Why this priority**: Correct initialization is foundational for architectural compliance and developer trust. Without `intent_map.md`, the sidecar state is incomplete according to the specification.

**Independent Test**: Can be fully tested by running orchestration initialization in a clean directory and verifying the existence and contents of `.orchestration/intent_map.md`.

**Acceptance Scenarios**:

1. **Given** a directory without orchestration, **When** `initializeOrchestration` is called, **Then** `.orchestration/intent_map.md` must be created.
2. **Given** a newly created `intent_map.md`, **When** its content is read, **Then** it must contain the header "# Intent Map" and the placeholder text "_No intents have been mapped yet._".

---

### User Story 2 - Canonical Data Format (Priority: P1)

As a tool or developer reading `active_intents.yaml`, I should see the root key `active_intents:` as documented in the architecture specification, ensuring the implementation matches the documentation.

**Why this priority**: Consistency between implementation and documentation (single source of truth) is a core constitutional requirement.

**Independent Test**: Can be tested by inspecting the content of `active_intents.yaml` after intents are saved.

**Acceptance Scenarios**:

1. **Given** an active intent, **When** it is saved to `active_intents.yaml`, **Then** the root key in the YAML file must be `active_intents:`.
2. **Given** a new orchestration instance, **When** initialized, **Then** the initial `active_intents.yaml` must use the `active_intents:` root key.

---

### User Story 3 - Graceful Migration (Priority: P2)

As a user with an existing project using the old `intents:` root key, I should be able to continue working without errors, with the system silently accepting the legacy format until the next save.

**Why this priority**: Avoids breaking existing user workspaces during the transition to the canonical format.

**Independent Test**: Can be tested by providing an `active_intents.yaml` file with the old `intents:` key and verifying the system parses it correctly.

**Acceptance Scenarios**:

1. **Given** an `active_intents.yaml` with the root key `intents:`, **When** the system loads active intents, **Then** it must successfully parse the list of intents without error.
2. **Given** a legacy `active_intents.yaml` file, **When** an intent is added or updated, **Then** the file should be migrated to use the `active_intents:` root key upon the next save.

---

### Edge Cases

- **Mixed Keys**: If a file contains both `active_intents:` and `intents:`, the system MUST prioritize the canonical `active_intents:` key and ignore the legacy one.
- **Initialization Overwrite**: `OrchestrationService.initializeOrchestration()` MUST NOT overwrite existing `intent_map.md` or `active_intents.yaml` files if they already exist, ensuring non-destructive initialization.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `OrchestrationService.initializeOrchestration()` MUST create `.orchestration/intent_map.md` if it does not exist.
- **FR-002**: The default content for `intent_map.md` MUST match the schema:

    ```markdown
    # Intent Map

    _No intents have been mapped yet._
    ```

- **FR-003**: The `ActiveIntentsFile` interface MUST be updated to use `active_intents` as the primary property name.
- **FR-004**: The YAML parser for active intents MUST prioritize `active_intents` property; if missing, it MUST fall back to `intents` for backward compatibility.
- **FR-005**: All intent-saving operations MUST use the canonical `active_intents:` root key.
- **FR-006**: Existing test fixtures and mocks MUST be updated to use the canonical key where appropriate, or retained to test backward compatibility.

### Key Entities

- **Intent Map**: A markdown file (`intent_map.md`) that tracks the spatial mapping between active intents and the files they modify.
- **Active Intents File**: A YAML file (`active_intents.yaml`) that stores the current state of active intents in the orchestration layer.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `intent_map.md` is present in 100% of new orchestration initializations.
- **SC-002**: 100% of newly generated `active_intents.yaml` files use the `active_intents:` root key.
- **SC-003**: 0% regression in parsing existing `active_intents.yaml` files using the legacy `intents:` key.
- **SC-004**: All unit tests pass, including new tests for initialization and backward compatibility.
