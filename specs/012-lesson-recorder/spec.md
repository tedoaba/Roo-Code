# Feature Specification: Automated Lessons Learned Recorder

**Feature Branch**: `012-lesson-recorder`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Implement Automated Lessons Learned Recorder. Create a tool that records failures into AGENT.md under a structured “Lessons Learned” section. Trigger Condition: If verification step fails (Linter, Test, Static analysis). Behavior: Append Timestamp, Failure Type, Cause, Resolution, File involved, Error summary, Suggested corrective rule to AGENT.md. Atomic append, avoid duplicates, deterministic formatting."

## Clarifications

### Session 2026-02-20

- Q: Data Model - Field Mapping Consistency (Resolution vs. Suggested corrective rule) → A: Keep both (Option A)
- Q: Scope - Granularity of Failure Entries → A: Atomic: Create a separate entry for each unique failure (unique file + error signature) (Option B)
- Q: Formatting - Entry Structure & Header Level → A: List-based: Bold labels for fields within a bulleted list (Option A)
- Q: Lifecycle - Verification vs. Recording Order → A: Immediate: The AI agent MUST record the lesson as soon as the failure is analyzed and fixed during the same turn (Option A).
- Q: Truncation - Large Error Summaries → A: Bound: Truncate error summaries at 500 characters and append "..." to maintain ledger readability.

### Session 2026-02-20 (Part 2)

- Q: Functional Scope - Source of Intelligence → A: Agent Provided (Option A)
- Q: Observability - Automated Feedback Loop → A: Prompt-Based: Automatically inject relevant lessons into context (Option A)
- Q: Functional Scope - Lesson Aging and Cleanup → A: Persistent: Keep all lessons indefinitely. Rely on the injection logic to filter relevance. (Option B)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Automatic Recording of Verification Failures (Priority: P1)

As a development system, I want to automatically record failed verification steps (like linting or tests) into a persistent log so that I can avoid making the same mistakes in the future and provide better context for self-improvement.

**Why this priority**: This is the core functionality that enables the system to "remember" mistakes across turns and sessions, providing the foundation for self-improvement.

**Independent Test**: Can be fully tested by intentionally triggering a linter failure and verifying that a new entry appears in `AGENT.md` with the correct metadata.

**Acceptance Scenarios**:

1. **Given** a codebase with a linting error, **When** the linter is executed and fails, **Then** a new lesson entry is appended to the "Lessons Learned" section in `AGENT.md`.
2. **Given** a failing test suite, **When** tests are run, **Then** the failure details (file, error summary, cause) are accurately captured in `AGENT.md`.

---

### User Story 2 - Self-Healing Ledger Infrastructure (Priority: P2)

As a system, I want to ensure the "Lessons Learned" section exists in `AGENT.md`, creating it or the file itself if necessary, so that recording always succeeds regardless of the initial state of the environment.

**Why this priority**: Ensures robustness and that the feature works "out of the box" without manual setup.

**Independent Test**: Delete `AGENT.md` or remove the "Lessons Learned" section, trigger a failure, and verify that the file/section is recreated correctly.

**Acceptance Scenarios**:

1. **Given** `AGENT.md` does not exist, **When** a failure is recorded, **Then** `AGENT.md` is created with the "## Lessons Learned" header followed by the new entry.
2. **Given** `AGENT.md` exists but lacks a "Lessons Learned" section, **When** a failure is recorded, **Then** the section header is appended to the file followed by the entry.

---

### User Story 3 - Duplicate Prevention and Ledger Cleanliness (Priority: P3)

As a user, I want the recorder to avoid cluttering `AGENT.md` with duplicate entries for the same failure instance so that the log remains readable and useful.

**Why this priority**: Improves usability and prevents the log from growing uncontrollably with redundant information during iterative debugging.

**Independent Test**: Trigger the same specific linter failure multiple times in succession and verify that only one entry is added to `AGENT.md`.

**Acceptance Scenarios**:

1. **Given** a failure that was just recorded, **When** the exact same failure occurs again in the same file with the same error summary, **Then** no new entry is appended.

### Edge Cases

- **Concurrent Failures**: How does the system handle multiple tools failing simultaneously? (Atomic append ensures serial log integrity).
- **Disk Full/Write Protected**: If the system cannot write to `AGENT.md`, it MUST attempt exactly one retry after a 100ms delay. If it still fails, it MUST fail silently to the main process (logging the failure only to an internal debug trace) to avoid blocking the user story.
- **Massive Errors**: How does the system handle extremely long error summaries? (Should truncate or summarize to keep `AGENT.md` manageable).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support recording triggered by verification failures (Linter, Test suite, Static analysis) by automatically suggesting lesson capture or providing hooks for recording.
- **FR-002**: System MUST capture specific metadata for each failure as defined in `data-model.md` (Timestamp, Type, File, Error Summary, Cause, Resolution, Corrective Rule, Intent ID).
- **FR-003**: System MUST record failures into `AGENT.md` under a structured "## Lessons Learned" section.
- **FR-004**: System MUST perform atomic file appends to prevent data corruption or partial writes.
- **FR-005**: System MUST create the `AGENT.md` file and/or the "## Lessons Learned" section header if they do not exist.
- **FR-006**: System MUST append new entries to the end of the section without overwriting or modifying previous entries, maintaining a permanent record of all lessons learned.
- **FR-007**: System MUST use a deterministic Markdown format for entries as per the template in `data-model.md`.
    - Each lesson MUST start as a top-level bullet point with a timestamp.
    - Metadata MUST be labeled using bold identifiers (e.g., **Failure Type:**, **Cause:**, etc.).
    - Indentation MUST be used to group metadata under the main lesson bullet.
- **FR-008**: System MUST implement a de-duplication mechanism based on [File + Error Summary] signature to avoid redundant logs for the same issue.
- **FR-009**: System MUST record each distinct failure as a separate entry if a tool returns multiple failures (e.g., multiple linting errors or test case failures).
- **FR-010**: The recording tool MUST expose a CLI interface that strictly enforces the `contracts/cli.json` schema, requiring a valid `intent-id`.
- **FR-011**: The system MUST support a mechanism to automatically retrieve and inject relevant lessons (e.g., most recent or contextually similar) from `AGENT.md` into the agent's context (Prompt-Based injection) to ensure self-correction.
- **FR-012**: System MUST log all recording operations to the central audit ledger (`.orchestration/agent_trace.jsonl`) per Invariant 3.

### Key Entities _(include if feature involves data)_

- **Lesson**: Represents a single failure event and its resolution. Attributes: `timestamp`, `type`, `file`, `error_summary`, `cause`, `resolution` (specific fix), `corrective_rule` (general guidance).
- **Lesson Ledger**: The append-only Markdown file (`AGENT.md`) that serves as the persistent memory of mistakes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of detected verification failures result in a correctly formatted entry in `AGENT.md` within 5 seconds of failure detection.
- **SC-002**: Zero instances of existing log data being lost or overwritten during new entry appends.
- **SC-003**: Audit of `AGENT.md` after 50 consecutive failures shows zero duplicates for identical failure signatures.
- **SC-004**: The `AGENT.md` file size does not impact system performance (e.g., reads/writes remains under 100ms).
