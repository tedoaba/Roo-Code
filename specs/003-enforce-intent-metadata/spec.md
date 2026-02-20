# Feature Specification: Enforce Intent Metadata in write_to_file Tool

**Feature Branch**: `003-enforce-intent-metadata`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "Write Tool Schema Upgrade Title: Enforce Intent Metadata in write_to_file Tool Prompt for Agent: Implement a schema upgrade for the write_to_file tool to enforce mutation traceability. Requirements Modify the tool schema to require: intent_id: string (required) mutation_class: enum (required) Allowed values for mutation_class: AST_REFACTOR INTENT_EVOLUTION Add validation: Reject write requests missing either field. Reject invalid enum values. Fail fast with clear error message. Constraints No backward compatibility mode. All writes must comply. Unit tests must cover validation failures. Success Criteria Writes without required metadata are blocked. Schema validation is deterministic. Tests pass."

## Clarifications

### Session 2026-02-19

- Q: How should the system handle an empty string for `intent_id`? → A: Reject empty strings: Treat `""` as missing/invalid and block the write.
- Q: How should the system handle case sensitivity for the `mutation_class` enum? → A: Strict Uppercase: Only accept `AST_REFACTOR` and `INTENT_EVOLUTION`. Reject lowercase with an error.
- Q: What should be the format of the error message when validation fails? → A: Clear Descriptive Message: "Missing required field: [X]" or "Invalid value for [Y]. Allowed values: [A, B]".
- Q: When should the validation logic be executed? → A: Unified Validation: Validate schema (presence/enum) and value (non-empty) in a single step before execution.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Secure and Traceable Code Writes (Priority: P1)

As a system auditor, I want every file write to be associated with a specific intent and mutation class so that I can trace why and how the codebase is evolving.

**Why this priority**: Fundamental for mutation traceability and governance. Ensuring that every change has an "audit trail" is a core security requirement.

**Independent Test**: Can be fully tested by attempting a `write_to_file` call with valid `intent_id` and `mutation_class`, verifying that the file is written correctly.

**Acceptance Scenarios**:

1. **Given** the agent has a valid `intent_id` ("INT-123"), **When** it calls `write_to_file` with `intent_id: "INT-123"` and `mutation_class: "AST_REFACTOR"`, **Then** the file should be successfully created/modified.

---

### User Story 2 - Enforcement of Metadata Requirements (Priority: P1)

As a governance engine, I want to block any attempt to write files that lacks the necessary traceability metadata so that unauthorized or non-compliant changes are prevented.

**Why this priority**: This is the core "enforcement" aspect of the requirement. Without this, the metadata is optional and unenforceable.

**Independent Test**: Can be tested by calling `write_to_file` without `intent_id` or without `mutation_class` and verifying that the system returns a validation error and no file is changed.

**Acceptance Scenarios**:

1. **Given** a `write_to_file` request is missing `intent_id`, **When** the tool is executed, **Then** the system MUST return a clear error indicating `intent_id` is required and MUST NOT write the file.
2. **Given** a `write_to_file` request is missing `mutation_class`, **When** the tool is executed, **Then** the system MUST return a clear error indicating `mutation_class` is required and MUST NOT write the file.

---

### User Story 3 - Validating Mutation Classification (Priority: P2)

As a developer, I want to ensures that changes are only categorized into allowed classes so that the evolution data remains consistent and reports are meaningful.

**Why this priority**: Prevents "noisy" or "garbage" data from entering the traceability logs.

**Independent Test**: Call `write_to_file` with an invalid `mutation_class` (e.g., "MOP_UP") and verify it is rejected.

**Acceptance Scenarios**:

1. **Given** a `write_to_file` request has an invalid `mutation_class` value like "USER_TYPO", **When** the tool is executed, **Then** the system MUST return an error listing the allowed values (AST_REFACTOR, INTENT_EVOLUTION).

---

### Edge Cases

- **Empty Strings**: The `intent_id` MUST be a non-empty string. Providing an empty string (`""`) MUST be treated as a validation failure.
- **Case Sensitivity**: The `mutation_class` enum is STRICTLY case-sensitive. Only uppercase values (`AST_REFACTOR`, `INTENT_EVOLUTION`) are accepted. Lowercase or mixed-case inputs MUST be rejected.
- **Concurrent Writes**: Does the validation handle multi-file operations? (Requirement: `write_to_file` is single file, but if called rapidly, each must independently validate).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `write_to_file` tool schema MUST be updated to include `intent_id` as a required, non-empty string property.
- **FR-002**: The `write_to_file` tool schema MUST be updated to include `mutation_class` as a required enum property.
- **FR-003**: The `mutation_class` enum MUST only accept the values: `AST_REFACTOR` and `INTENT_EVOLUTION` (case-sensitive).
- **FR-004**: The system MUST perform a unified validation step (schema + content) before executing any file write logic.
- **FR-005**: All `write_to_file` requests failing validation MUST be rejected with a clear descriptive error message identifying the exact failure (e.g., "Missing required field: intent_id" or "Invalid value for mutation_class. Allowed values: AST_REFACTOR, INTENT_EVOLUTION").
- **FR-006**: The system MUST NOT support a "legacy" or "backward compatibility" mode where these fields are optional.

### Key Entities _(include if feature involves data)_

- **WriteRequest**: The data structure sent to the `write_to_file` tool, now containing file path, content, intent_id, and mutation_class.
- **MutationClass**: An enumeration defining the nature of the code change (Refactor vs Evolution).
- **Traceability Metadata**: The combination of `intent_id` and `mutation_class` used for auditing.

### Assumptions & Dependencies

- **Assumption 1**: The `intent_id` will be provided by the system's orchestration Orchestrator and passed to the agent.
- **Assumption 2**: This change is restricted to the `write_to_file` tool for this phase; other file modification tools are out of scope.
- **Assumption 3**: Schema validation is performed on the server-side (or tool execution host) to ensure compliance.
- **Dependency 1**: Requires the tool definition registry to support required fields and enums (standard in most agent tool protocols).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of tool calls to `write_to_file` missing `intent_id` or `mutation_class` are blocked and return a descriptive error message identifying the missing field.
- **SC-002**: 100% of tool calls with invalid `mutation_class` values are blocked.
- **SC-003**: Zero files are written when metadata validation fails.
- **SC-004**: 100% of existing and new unit tests for `write_to_file` validation pass.
