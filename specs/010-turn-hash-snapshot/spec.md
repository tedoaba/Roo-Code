# Feature Specification: Agent Turn Hash Snapshot

**Feature Branch**: `010-turn-hash-snapshot`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Implement Agent Turn Hash Snapshot: Create a mechanism to snapshot file hashes when an agent begins execution. When agent reads a file, compute SHA-256 hash and store in memory. Hash must remain immutable during the turn. Expose getter get_initial_hash(file_path). Constraints: No recomputation mid-turn, snapshot reflects disk state at read time, memory-scoped to agent execution turn."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Initial File State Capture (Priority: P1)

As an agent, when I first read a file during my turn, I want to capture its current SHA-256 hash so that I have a reliable baseline for optimistic locking.

**Why this priority**: This is the core functionality required to enable optimistic locking and prevent unintentional overwrites.

**Independent Test**: Can be fully tested by reading a file once and verifying that a SHA-256 hash is correctly calculated and stored in the turn's memory.

**Acceptance Scenarios**:

1. **Given** a new agent execution turn starts, **When** the agent reads `file_A.ts` for the first time, **Then** a SHA-256 hash of `file_A.ts` is computed and stored.
2. **Given** a hash has been stored for `file_A.ts`, **When** the agent requests the initial hash for `file_A.ts`, **Then** the exactly same hash value is returned.

---

### User Story 2 - Hash Immutability During Turn (Priority: P1)

As an agent, I want the initial hash of a file to remain unchanged during my entire turn, even if the file on disk is modified by an external process or tool.

**Why this priority**: Required for consistency. Optimistic locking relies on knowing what the file looked like when it was _first_ encountered in the current turn.

**Independent Test**: Read a file, modify it externally, and verify that `get_initial_hash` still returns the first hash.

**Acceptance Scenarios**:

1. **Given** a hash for `file_B.ts` is stored (Hash1), **When** `file_B.ts` is modified on disk by an external process, **Then** `get_initial_hash(file_B.ts)` continues to return Hash1.
2. **Given** a hash for `file_B.ts` is stored, **When** the agent reads the file again in the same turn, **Then** the system does not recompute the hash from disk.

---

### User Story 3 - Turn-Scoped Memory Management (Priority: P2)

As a system, I want to ensure that file hash snapshots are cleared at the end of an agent turn so that memory is not leaked across sessions and fresh states are captured for the next turn.

**Why this priority**: Prevents stale data from affecting subsequent turns and ensures efficient memory usage.

**Independent Test**: Capture a hash in one turn, end the turn, start a new turn, and verify the snapshot is empty.

**Acceptance Scenarios**:

1. **Given** an agent turn (Turn 1) has captured hashes for several files, **When** Turn 1 completes and a new Turn 2 begins, **Then** the snapshot for Turn 2 is empty.
2. **Given** a new turn starts, **When** a file previously seen in a past turn is read, **Then** a fresh hash is computed reflecting the current disk state.

### Edge Cases

- **File Deletion**: What happens when a file is deleted from disk AFTER the first read?
    - _Response_: `get_initial_hash` should still return the hash captured at the time of the first read.
- **Permission Errors**: What happens if a file cannot be read for hashing?
    - _Response_: The system should handle read failures gracefully, potentially storing an "error" state or null hash, but the failure must not crash the turn.
- **Empty Files**: How does the system handle zero-byte files?
    - _Response_: It should compute and store the valid SHA-256 hash of an empty string.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST compute a SHA-256 hash of a file's content upon its first read access within an agent turn.
- **FR-002**: System MUST store the computed hash in a memory-based snapshot keyed by the absolute file path.
- **FR-003**: System MUST ensure that once a hash is stored for a file path in a turn, it remains immutable for the remainder of that turn.
- **FR-004**: System MUST expose a public interface `get_initial_hash(file_path)` to retrieve the stored hash for a given file.
- **FR-005**: System MUST automatically clear or replace the hash snapshot when an agent turn ends or a new one begins.
- **FR-006**: System MUST NOT recompute the hash from disk if a hash already exists in the turn's snapshot for the requested file path.

### Key Entities _(include if feature involves data)_

- **Turn Snapshot**: A dictionary or map-like structure stored in memory, mapping absolute file paths to their initial content hashes.
- **Hash Entry**: A string representation of the SHA-256 hash (hexadecimal) associated with a specific file path.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of files read by the agent have their hash snapshoted on the first read.
- **SC-002**: `get_initial_hash` returns the correct initial value with 0% deviation throughout the turn duration, even if content changes on disk.
- **SC-003**: 0% memory leakage of hash snapshots between separate agent execution turns.
- **SC-004**: Retrieval of a stored hash (hitting the snapshot) is significantly faster (sub-millisecond) than recomputing from disk.
