# Research: Agent Trace Ledger Implementation

## Research Tasks

### 1. Atomic File Appends in Node.js

**Decision**: Use `fs.appendFile` with a custom file handle or `fs.createWriteStream` with the `a` (append) flag. For small data chunks like JSONL lines, `fs.appendFile` is atomic at the OS level on most modern systems if the write size is below the PIPE_BUF limit (typically 4KB).
**Rationale**: Simple implementation with strong OS-level guarantees for small writes.
**Alternatives considered**:

- `fs.lockfile`: Too much overhead for simple logging.
- Database: Violation of Constitution Invariant 4 (must be in `.orchestration/` as a file).

### 2. JSONL Structure and Validation

**Decision**: Each entry will be a single-line JSON string followed by `\n`.
**Rationale**: Standard JSONL format allows efficient appending and easy parsing by external tools or system utilities.
**Alternatives considered**:

- Multi-line JSON: Difficult to append safely and parse as a stream.

### 3. Hook System Integration

**Decision**: Integrate into the `PostToolUse` phase of the `HookEngine`.
**Rationale**: Mutations are primarily triggered by tool uses. Capturing the result _after_ the tool executes ensures the ledger reflects the actual outcome and updated state (content hash).

### 4. Content Hashing (SHA-256)

**Decision**: Re-use the `hashing.ts` utility (from feature 005) to compute hashes of modified artifacts.
**Rationale**: Maintains consistency across features and adheres to Constitution Invariant 7.

## Decision Summary

| Component          | Choice                   |
| :----------------- | :----------------------- |
| **I/O Method**     | `fs/promises.appendFile` |
| **Format**         | JSON Lines (JSONL)       |
| **Directory**      | `.orchestration/`        |
| **Hook Event**     | `PostToolUse`            |
| **Hash Algorithm** | SHA-256                  |
