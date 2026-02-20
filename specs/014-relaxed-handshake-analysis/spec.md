# Feature Specification: Relaxed Handshake for Analysis Tools

**Feature Branch**: `014-relaxed-handshake-analysis`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Relaxed Handshake for Analysis Tools. Task ID: REQ-ORCH-002"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Analysis Before Intent (Priority: P1)

As an Architect, I want to explore the codebase using read-only tools before I commit to a specific intent, so that I can provide an accurate and well-informed intent description and scope.

**Why this priority**: This is the primary objective of the feature. It resolves the current deadlock where the Architect cannot analyze the code to determine which intent to select.

**Independent Test**: Start a new task, use `list_files` or `read_file` before calling `select_active_intent`. The tools should execute successfully.

**Acceptance Scenarios**:

1. **Given** the agent is in the `REASONING` state and no intent is active, **When** the agent calls `list_files`, **Then** the command should be permitted and return the file list.
2. **Given** the agent is in the `REASONING` state and no intent is active, **When** the agent calls `read_file`, **Then** the command should be permitted and return the file content.
3. **Given** the agent is in the `REQUEST` state and no intent is active, **When** the agent calls `codebase_search`, **Then** the command should be permitted.

---

### User Story 2 - Mutation Protection (Priority: P2)

As a system governor, I want to ensure that no destructive actions (writes, deletes, command execution) are performed until a clear intent has been selected and approved, maintaining the "No mutation without intent" invariant.

**Why this priority**: Security and safety are critical. We must ensure that relaxing the handshake for analysis doesn't compromise the governance of destructive actions.

**Independent Test**: Start a new task, attempt to `write_to_file` before calling `select_active_intent`. The command should be blocked with a State Violation.

**Acceptance Scenarios**:

1. **Given** the agent is in the `REASONING` state and no intent is active, **When** the agent calls `write_to_file`, **Then** it should be blocked with a `StateViolationError` indicating that an intent is required for mutations.
2. **Given** the agent is in the `REQUEST` state and no intent is active, **When** the agent calls `run_command` (if classified as destructive), **Then** it should be blocked.

---

### Edge Cases

- **Tool Classification Changes**: If a tool's classification is changed from `SAFE` to `DESTRUCTIVE` in `HookEngine.ts`, it should automatically be blocked during the handshake phase.
- **MCP Tools**: MCP tools that are not explicitly classified in `COMMAND_CLASSIFICATION` default to `DESTRUCTIVE` and should be blocked.
- **Fail-Safe Default**: If the orchestration directory is missing, even `SAFE` tools (except `select_active_intent`) should be blocked as per Invariant 8.

## Clarifications

### Session 2026-02-20

- Q: Is it permissible for the agent to use `attempt_completion` or provide a final answer while still in the `REASONING` state? → A: Yes, allow completion directly from `REASONING` state if only `SAFE` tools were used.
- Q: How should file access be governed for `SAFE` tools during the Handshake phase? → A: Allow `SAFE` tools to access any file within the project root if no intent is active (read-only).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST identify tool classifications based on `COMMAND_CLASSIFICATION` defined in `src/hooks/HookEngine.ts`.
- **FR-002**: `StateMachine.isToolAllowed` MUST permit tools classified as `SAFE` in both `REASONING` and `REQUEST` states even if no intent is active.
- **FR-003**: `StateMachine.isToolAllowed` MUST block all tools NOT classified as `SAFE` in `REASONING` and `REQUEST` states unless an intent is active, with the exception of `select_active_intent`.
- **FR-004**: `build-tools.ts` MUST include all tools classified as `SAFE` in the available toolset when `isIntentActive` is false.
- **FR-005**: The Intent Handshake system prompt MUST be updated to clarify that "Analysis and read-only actions are permitted, but an active intent is still required for mutations (writes/commands)."
- **FR-006**: Invariant 2 (Sole Execution Gateway) MUST be maintained; all tool calls must continue to pass through the `HookEngine`.
- **FR-007**: Law 4.1 (Least Privilege) MUST be maintained; `DESTRUCTIVE` tools must remain blocked until `onIntentSelected` transitions the state to `ACTION`.
- **FR-008**: System MUST permit `attempt_completion` (as a `SAFE` tool) during the handshake phase to allow answering informational queries without mandatory intent selection.
- **FR-009**: System MUST permit project-wide read access for `SAFE` tools during the `REQUEST` and `REASONING` states while maintaining global protections (e.g., .intentignore).

### Key Entities _(include if feature involves data)_

- **Tool Classification**: A mapping of tool names to their safety classification (`SAFE` or `DESTRUCTIVE`).
- **Execution State**: One of `REQUEST`, `REASONING`, or `ACTION`, determining allowed actions.
- **Intent**: A validated goal that authorizes destructive actions within a specific scope.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of tools classified as `SAFE` in `HookEngine.ts` are executable during the handshake phase (`REQUEST` and `REASONING` states) without an active intent.
- **SC-002**: 100% of tools classified as `DESTRUCTIVE` or unknown (default `DESTRUCTIVE`) remain blocked during the handshake phase without an active intent.
- **SC-003**: The agent receives a clear instruction in the system prompt about the availability of analysis tools and the requirement for an intent for mutations.
- **SC-004**: The Architect can successfully perform a `list_files` call before selecting an intent in a fresh session.
- **SC-005**: The agent can successfully call `attempt_completion` to finalize an informational task without ever selecting an intent.
