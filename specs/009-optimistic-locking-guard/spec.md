# Feature Specification: Optimistic Locking Guard

**Feature Branch**: `009-optimistic-locking-guard`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Implement File-Level Optimistic Concurrency Control. Implement optimistic locking to prevent parallel overwrite conflicts. Objective: Block stale writes when a file has changed since the agent began its turn."

## Clarifications

### Session 2026-02-20

- Q: Should blocked write attempts (concurrency conflicts) be recorded in the `AgentTraceLedger`? → A: Record `STALE_FILE` events in the `AgentTraceLedger` as rejected mutation attempts.
- Q: How should the system handle a file that existed when the agent read it, but has been deleted before the write? → A: Block the write and return a `STALE_FILE` error (Target missing).
- Q: Should the guard track hashes for ALL files written by the agent, or only those it previously read in the current turn? → A: Only check files that have been explicitly read by the agent during the current turn.
- Q: Should the `STALE_FILE` error message include the `current_disk_hash` to help with diagnostics? → A: Include `current_disk_hash` in the `STALE_FILE` error JSON.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Prevent Stale Overwrites (Priority: P1)

As an agent, I want to be stopped from overwriting a file that has been modified by someone else while I was thinking, so that I don't accidentally revert external changes or create inconsistent states.

**Why this priority**: Core safety feature. Preventing data loss/corruption from race conditions is the primary goal.

**Independent Test**: Simulate a parallel edit between the agent's read and write operations. Verify the write is blocked and a `STALE_FILE` error is returned.

**Acceptance Scenarios**:

1. **Given** the agent has read `file_a.txt` (Initial Hash: `H1`), **When** an external process modifies `file_a.txt` (Disk Hash becomes `H2`), **And** the agent attempts to write to `file_a.txt`, **Then** the write MUST be blocked, **And** the file content MUST remain as `H2`, **And** the agent MUST receive a `STALE_FILE` error.
2. **Given** the agent has read `file_b.txt` (Initial Hash: `H3`), **When** no external changes occur, **And** the agent attempts to write to `file_b.txt`, **Then** the write MUST succeed, **And** the file content MUST be updated.

---

### User Story 2 - Conflict Recovery Flow (Priority: P2)

As an agent, I want to be able to recover from a blocked write by re-reading the file to see the latest changes.

**Why this priority**: Essential for the agent to continue working after a conflict is detected.

**Independent Test**: Block a write, then perform a new read, then attempt another write. Verify the second write succeeds if the disk hasn't changed again.

**Acceptance Scenarios**:

1. **Given** a write was blocked due to a `STALE_FILE` conflict, **When** the agent re-reads the file, **Then** the `initial_content_hash` MUST be updated to the current disk hash, **And** subsequent writes MUST be allowed (provided the file doesn't change again).

---

### Edge Cases

- **File Deletion**: If a file is deleted after the agent reads it but before it writes, the hash comparison MUST fail and block the write with a `STALE_FILE` error (Target missing).
- **Read-Only Access**: If the agent reads a file but never writes to it, the hash is still stored but no concurrency check is performed (no overhead except storage).
- **Directory Writes**: If the tool target is a directory instead of a file, the guard should handle it gracefully (likely N/A or block if not supported).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST store a SHA-256 hash (the `initial_content_hash`) for every file read by the agent during its current execution turn.
- **FR-002**: System MUST calculate the SHA-256 hash of the target file (the `current_disk_hash`) immediately before executing a write operation.
- **FR-003**: System MUST compare `initial_content_hash` with `current_disk_hash` before every file modification.
- **FR-004**: System MUST block the write execution if `initial_content_hash` does not match `current_disk_hash`.
- **FR-005**: System MUST NOT modify the file on disk if a mismatch is detected.
- **FR-006**: When a write is blocked, the system MUST return a structured error with:
    - `error_type`: "STALE_FILE"
    - `message`: "File modified by another actor. Re-read required."
    - `details`:
        - `path`: "<absolute_file_path>"
        - `baseline_hash`: "<hash_agent_saw_last>"
        - `current_disk_hash`: "<current_hash_on_disk>"
    - `recovery_hint`: "Perform a new 'read_file' to see the latest changes before attempting to write again."
- **FR-007**: System MUST update the stored `initial_content_hash` whenever a file is successfully read or written, to ensure the next write has a valid baseline.
- **FR-008**: Detection MUST integrate with the existing write validation pipeline (e.g., hooks or tool middleware).
- **FR-009**: All blocked write attempts MUST be recorded in the `AgentTraceLedger` as rejected mutation attempts.

### Key Entities _(include if feature involves data)_

- **Turn Context**: A transient storage mapping file paths to their `initial_content_hash` for the duration of the agent's turn.
- **Optimistic Guard**: The logic that performs hash comparison and write gating.

---

## Assumptions

- **Turn Lifecycle**: A "turn" is defined as the period between the agent receiving a user request and providing a final response. Hash storage is reset at the start of each turn.
- **Initial Read Baseline**: If the agent reads the same file multiple times in a turn, the hash from the _first_ read is used as the baseline unless a write has since occurred.
- **Hashing Utility**: The system has an existing, performant SHA-256 implementation available for use.
- **Scope**: Only files accessed via the agent's read/write tools are covered. Direct filesystem access outside of these tools is out of scope for this guard.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: **100% Reliability**: Zero instances of "lost updates" (stale overwrites) allowed in parallel modification simulations.
- **SC-002**: **No False Positives**: 100% of write attempts for unmodified files must succeed.
- **SC-003**: **Low Overhead**: Hash calculation and comparison must add less than 50ms of latency to file write operations for files under 1MB.
- **SC-004**: **Structured Feedback**: All concurrency errors must strictly follow the defined JSON-like structure for programmatic handling.
