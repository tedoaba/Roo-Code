# Feature Specification: Verification Failure Detection Hook

**Feature Branch**: `013-verification-failure-hook`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Integrate Verification Failure Detection. Implement detection hook that triggers Lesson Recording when verification fails. Monitor: Linter exit code, Test runner exit code. On non-zero exit: Capture tool name, error output, affected files. Invoke Lesson Recording tool. Ensure Hook runs automatically. Does not crash system. Success Criteria: Failures automatically recorded. No manual intervention required. Lessons accurately reflect failure context."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Automated Linter Failure Recording (Priority: P1)

As an AI developer, I want the system to automatically record a lesson when a linter check fails, so that I can learn from formatting or syntax mistakes without manual effort.

**Why this priority**: High value for automated self-improvement. Prevents the same linting errors from being repeated in future turns.

**Independent Test**: Can be tested by running a command that fails linting (e.g., `npm run lint` on a file with intentional errors) and verifying a new lesson file is created in the `.lessons` directory.

**Acceptance Scenarios**:

1. **Given** a TypeScript file has a linting error (e.g., unused variable), **When** the AI executes `npm run lint`, **Then** the tool returns exit code 1 AND a lesson is automatically recorded containing the lint error message.
2. **Given** a linting check is running, **When** it finishes with exit code 0, **Then** no lesson is recorded.

---

### User Story 2 - Automated Test Failure Recording (Priority: P1)

As an AI developer, I want the system to automatically record a lesson when a test suite fails, so that I can capture the regression or bug context for future prevention.

**Why this priority**: Critical for capturing regression context. Test failures often contain complex logic errors that are essential to document as lessons.

**Independent Test**: Can be tested by running `npm test` on a failing test case and verifying the `LessonRecorder` is invoked with the test failure output.

**Acceptance Scenarios**:

1. **Given** a unit test is failing, **When** the AI executes the test runner, **Then** the non-zero exit code triggers an automatic lesson recording that includes the failing test name and failure diff.

---

### User Story 3 - Robust Failure Handling (Priority: P2)

As a system component, the hook must ensure that failures in the recording process itself do not prevent the user from seeing the original error or continuing their work.

**Why this priority**: Ensures system stability. The "recorder" should be a side-effect that does not break the primary "tool execution" loop.

**Independent Test**: Mock the `LessonRecorder` to throw an error and verify that the `ExecuteCommandTool` still returns the original linter/test output to the AI.

**Acceptance Scenarios**:

1. **Given** the `LessonRecorder` fails (e.g., disk full), **When** a verification tool fails, **Then** the system still reports the verification failure to the AI without crashing.

---

### Edge Cases

- **Large Output**: What happens when the error output is extremely large (e.g., 100+ test failures)? The system should truncate or summarize the output to avoid bloated lesson files.
- **Ambiguous Commands**: How does the system handle commands that are NOT verification tools? The hook should likely use a whitelist of command patterns.
- **Multiple Failures**: If multiple files fail in one run, all affected files should be captured in the lesson metadata.

## Dependencies & Assumptions

- **Dependency**: Requires an existing lesson recording system that can accept external failure data.
- **Assumption**: The system can distinguish between "verification tools" (lint/test) and "general tools" (ls/cat/etc.) based on the command string or context.
- **Assumption**: The AI has permission to read the output of the tools it executes.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST intercept the completion of CLI-based tool execution.
- **FR-002**: System MUST identify "Verification Tools" based on command patterns (e.g., those matching linter or test runner signatures).
- **FR-003**: System MUST detect non-zero exit codes from monitored tools.
- **FR-004**: System MUST capture the name of the tool or command being executed.
- **FR-005**: System MUST capture the error messages (stderr/stdout) produced by the failing tool.
- **FR-006**: System MUST attempt to extract file paths mentioned in the error output to identify affected files.
- **FR-007**: System MUST automatically invoke the lesson recording mechanism upon detection of a verification failure.
- **FR-008**: The recording process MUST NOT block or crash the main tool execution flow if it fails.

### Key Entities

- **Verification Failure**: A data structure representing the failure event, containing command, exit code, output, and identified files.
- **Lesson**: The resulting artifact recorded by the `LessonRecorder`, now including failure context automatically.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of detected lint/test failures trigger an automatic recording attempt.
- **SC-002**: Zero (0) system crashes or task interruptions caused by recording failures.
- **SC-003**: Lessons recorded from failures include at least the tool name and a snippet of the error output.
- **SC-004**: Automatic identification of at least one affected file path for 80% of standard linter/test outputs.
- **SC-005**: Time added to tool execution by the detection hook is less than 200ms (excluding the actual recording write time).
