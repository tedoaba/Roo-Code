# Feature Specification: Missing Post-Hooks Implementation

**Feature Branch**: `019-post-hooks-impl`  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "Missing Post-Hooks Implementation: IntentProgress, ScopeDrift, SharedBrain. Task ID: REQ-ARCH-019. Implement the three missing post-tool-use hooks specified in ARCHITECTURE_NOTES.md §6.3: IntentProgressHook (automated acceptance criteria checking), ScopeDriftDetectionHook (mutation boundary monitoring), and SharedBrainHook (comprehensive lessons learned recording beyond verification failures)."

## Clarifications

### Session 2026-02-21

- Q: How should the hook technically evaluate if an acceptance criterion is satisfied by the trace entries? → A: Simple string/substring match against recent trace entries.
- Q: How should the system programmatically define the threshold for what constitutes "near the boundary"? → A: Parent directory (`dirname(path)`) of any explicitly mapped scope path.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Intent Progress Tracking (Priority: P1)

The system automatically checks if all acceptance criteria for the current intent have been met after a mutation, transitioning the intent to COMPLETED if they are satisfied.

**Why this priority**: Ensures the system can automatically transition an intent to COMPLETED when its acceptance criteria are fully met, increasing agent autonomy.

**Independent Test**: Can be fully tested by simulating test suite passes and verifying the intent state transitions and logs in agent_trace.jsonl.

**Acceptance Scenarios**:

1. **Given** an active intent with specific acceptance criteria, **When** all criteria are met via string/substring matching in the recent trace entries after a mutation, **Then** the intent status transitions to COMPLETED and the transition is logged to agent_trace.jsonl.
2. **Given** an active intent with specific acceptance criteria, **When** only some criteria are met after a mutation, **Then** the hook acts as a no-op and the intent status remains unchanged.

---

### User Story 2 - Scope Drift Detection (Priority: P2)

The system detects when a file mutation touches files near the scope boundaries or expands the scope without prior mapping, logging an observational warning without blocking.

**Why this priority**: Helps maintain mutation boundaries and prevents the agent from making structural changes outside its defined scope without breaking the loop.

**Independent Test**: Can be fully tested by simulating file mutations at the scope boundary and outside the initially defined intent_map.md, verifying that appropriate warnings are logged.

**Acceptance Scenarios**:

1. **Given** a file mutation, **When** the file is within scope but near the boundary (defined as the parent directory of any mapped scope path), **Then** a warning is logged in the agent trace.
2. **Given** a file mutation, **When** the file targets a path matching the scope but not listed in intent_map.md, **Then** a "scope expansion" note is logged.
3. **Given** any file mutation, **When** a boundary violation or scope expansion is detected, **Then** the hook only logs a warning and never blocks the execution.

---

### User Story 3 - Shared Brain Governance and Scope Lessons (Priority: P2)

The system records comprehensive lessons to the shared knowledge base for governance violations and scope conflicts, complementing existing verification failure records.

**Why this priority**: Provides comprehensive lesson recording for governance violations and scope conflicts, beyond just verification failures, improving learning over time.

**Independent Test**: Can be fully tested by simulating DENY responses and scope conflicts, verifying that structured lessons are atomically appended to AGENT.md.

**Acceptance Scenarios**:

1. **Given** a tool execution, **When** a governance violation (DENY response) occurs, **Then** the hook records a lesson in AGENT.md about what triggered the violation and how to avoid it.
2. **Given** a tool execution, **When** a scope conflict is detected (file ownership contention), **Then** the hook records a coordination note in AGENT.md.
3. **Given** a verification failure, **When** the existing VerificationFailureHook records the failure, **Then** the SharedBrainHook does not interfere, handling only the broader trigger set.

---

### Edge Cases

- What happens when the underlying trace logging fails during a state transition? The hook must catch the error, log it, and fail gracefully without crashing the agent loop.
- What happens when multiple file mutations occur in a single tool use that spans multiple directories within the scope? The ScopeDriftDetectionHook must correctly evaluate boundary conditions for all paths and log relevant warnings.
- What happens when multiple hooks trigger concurrently during postToolUse()? Execution must not fail the overall tool return even if one hook encounters an internal exception.
- What happens when appending to AGENT.md fails due to concurrent access? The system relies on existing atomic append features to ensure safety, or catches and swallows the error if locking totally fails.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST systematically track and evaluate acceptance criteria against recent tool executions after each mutation using string/substring matching.
- **FR-002**: System MUST update the intent status to COMPLETED if and only if all acceptance criteria are met.
- **FR-003**: System MUST log any intent state transitions to the agent trace log without auto-transitioning without a trace.
- **FR-004**: System MUST monitor file mutations against the defined scope boundaries.
- **FR-005**: System MUST issue a warning log if a mutation occurs near the boundary (parent directory) of the defined scope or expands the expected scope, without blocking execution.
- **FR-006**: System MUST capture and record lessons for any governance violations or scope conflicts encountered during tool execution.
- **FR-007**: System MUST guarantee atomic appends when writing new lessons to the shared knowledge base.
- **FR-008**: System MUST ensure all post-hooks fail gracefully, catching and logging any internal errors without disrupting the core agent loop.
- **FR-009**: System MUST integrate all three new hooks into the existing postToolUse lifecycle.

### Key Entities

- **ActiveIntent**: Represents the current task, including acceptance_criteria, owned_scope, and status.
- **ToolResult**: Represents the outcome of an executed tool, which is evaluated by the hooks.
- **Lesson**: A structured note indicating a learned rule or observation, appended to the shared knowledge base.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of satisfied intents automatically transition to COMPLETED without manual intervention, verifiable via trace logs.
- **SC-002**: Scope drift detection emits a warning for 100% of defined boundary condition triggers without ever blocking execution.
- **SC-003**: Governance violations and scope conflicts result in successful structured appends to the shared knowledge base 100% of the time, verifiable by checking AGENT.md content.
- **SC-004**: 0% of agent loops crash due to errors originating within the post-hooks when tested against mocked failure conditions.
