# Feature Specification: Define and Enforce Stale File Error Protocol

**Feature Branch**: `011-stale-write-error`  
**Created**: 2026-02-20  
**Status**: Ready for Planning

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Stale Write Detection & Rejection (Priority: P1)

As an AI Agent or Agent Controller attempting to edit a file, I need the system to detect if the file has been modified since it was last read and reject my modification if so, so that I don't accidentally overwrite changes I wasn't aware of.

**Why this priority**: Stale writes introduce data corruption or loss of concurrent updates. Preventing this is the core value proposition of an optimistic locking system.

**Independent Test**: Can be fully tested by simulating a read, modifying the file on disk externally, and then attempting to write back using the original snapshot hash. The system should reject the write.

**Acceptance Scenarios**:

1. **Given** an agent reading file A with hash H1, **When** file A is updated externally to hash H2 and the agent attempts to write to A with expected hash H1, **Then** the write is rejected and no partial modification happens.
2. **Given** a rejected write attempt, **When** the error is generated, **Then** the system logs the conflict event for audit.

---

### User Story 2 - Machine-Readable Error Propagation (Priority: P1)

As an Agent Controller, I need to receive a structured, machine-readable error payload when my write is rejected, so that I can automatically trigger a re-read and retry process without human intervention.

**Why this priority**: Without structured errors, the agent might hallucinate fixes or get stuck parsing natural language errors. A machine-readable contract allows deterministic automated recovery.

**Independent Test**: Can be fully tested by evaluating the error payload produced on rejection. It must match the expected JSON schema.

**Acceptance Scenarios**:

1. **Given** a rejected stale write, **When** the error is propagated up to the controller, **Then** it must exactly match the JSON structure containing `error_type: "STALE_FILE"`, `file_path`, `expected_hash`, `actual_hash`, and `resolution: "RE_READ_REQUIRED"`.

---

### Edge Cases

- What happens when the file was deleted concurrently? (Should return actual_hash as empty, null, or a specific deleted representation, while still maintaining the STALE_FILE error structure).
- What happens when a user modifies the file externally while the agent is in the middle of executing a large multi-replace block? (The entire operation must be treated as atomic; rejection must happen before ANY partial changes are written to disk).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST detect mismatched expected vs actual file hashes during any file modification attempt.
- **FR-002**: The system MUST prevent any partial writes to the file when a hash mismatch is detected (atomic guarantee).
- **FR-003**: The system MUST generate a structured error response formatted exactly as a predefined JSON object upon rejection.
- **FR-004**: The system MUST propagate this structured error directly back to the Agent Controller without wrapping it in untyped string messages that break parsing.
- **FR-005**: The system MUST log the stale conflict event containing the file path, expected hash, and actual hash into the central operational logs or trace ledger.
- **FR-006**: The system MUST support representing the structured error in a way that the Agent Controller explicitly recognizes and triggers its internal `RE_READ_REQUIRED` handling flow.

### Key Entities

- **StaleFileErrorPayload**: Represents the structured response for a conflict.
    - Attributes: `error_type` (constant "STALE_FILE"), `file_path` (string), `expected_hash` (string), `actual_hash` (string), `resolution` (constant "RE_READ_REQUIRED").

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of tested stale write scenarios result in the exact requested machine-readable JSON structure without extraneous text.
- **SC-002**: 100% of rejected writes leave the target files unmodified (zero data corruption or partial writes).
- **SC-003**: Automated tests demonstrate the Agent Controller can deterministically capture the error and transition to a re-read state.
- **SC-004**: All stale write conflicts emit exactly one structured log event for auditing.
