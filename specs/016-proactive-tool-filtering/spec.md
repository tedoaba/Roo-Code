# Feature Specification: Proactive Tool Filtering for Intent Handshake

**Feature Branch**: `016-proactive-tool-filtering`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Proactive Tool Filtering for Intent Handshake"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - REASONING State Restrictions (Priority: P1)

As an AI Assistant in the planning (REASONING) state, I should only see read-only (SAFE) tools and handshake-specific tools in my available tools list, preventing me from generating blocked action-oriented tool calls prematurely.

**Why this priority**: It is the core of the problem. Presenting destructive tools before an intent is selected causes confusion, wasted token usage, and rejected actions, slowing down the problem-solving process.

**Independent Test**: Can be fully tested by starting a new request, remaining in the early reasoning phase without selecting an intent, and verifying that the AI's provided tool catalog only contains non-destructive data gathering and intent selection capabilities.

**Acceptance Scenarios**:

1. **Given** the agent is in the initial pre-intent state (REQUEST/REASONING), **When** a prompt is built for the agent to take action, **Then** only tools classified as SAFE (e.g. file reading, searching) and the intent selection tool are presented.
2. **Given** the agent attempts to write a file or execute a command while in a REASONING state, **When** no such tool was presented, **Then** the LLM naturally cannot invoke it, and any hallucinated invocation fails at the runtime layer.

---

### User Story 2 - ACTION State Visibility (Priority: P1)

As an AI Assistant in the execution (ACTION) state, I should see all available tools filtered only by the current operation mode permissions, enabling me to fulfill the selected intent.

**Why this priority**: Once an intent is established, full access to the necessary destructive and constructive tools is required to actually write code and execute commands.

**Independent Test**: Can be tested by selecting an intent to transition into the ACTION state, and verifying that the full suite of allowed tools (read, write, execute) is correctly restored in the provided tool catalog.

**Acceptance Scenarios**:

1. **Given** an intent has been formally selected and the system is in the ACTION state, **When** the prompt is built for the agent, **Then** the full array of tools permitted by the active mode is presented.

---

### User Story 3 - Token Budget Conservation (Priority: P2)

As a system owner managing the token budget, tool filtering should actively reduce token waste by omitting irrelevant tool descriptions from the prompt during phases where they cannot be used.

**Why this priority**: Reducing prompt size directly lowers API costs and speeds up response generation, creating a more efficient and responsive system.

**Independent Test**: Can be verified by comparing the token count of a prompt sent during the reasoning phase before and after the change, confirming a noticeable reduction.

**Acceptance Scenarios**:

1. **Given** a standard workflow session, **When** evaluating the total tokens sent in the prompt before an intent is selected, **Then** the token usage is demonstrably lower due to omitted destructive tool schemas.

### Edge Cases

- **Custom Mode Interactions**: When a user creates a highly custom mode that alters standard tool permissions, the state-based filtering must still correctly apply its REASONING vs ACTION restrictions on top of that mode's baseline permissions.
- **State Transition Failures**: If the system fails to transition states correctly and gets stuck in REASONING even after intent selection, the user must still have a way to recover or restart, as tools will remain restricted.
- **Missing Classifications**: If a newly added tool lacks a SAFE or DESTRUCTIVE classification, the system must default to a secure posture (treating it as DESTRUCTIVE and hiding it during REASONING).

### Assumptions & Dependencies

- **Assumptions**: The system relies on a reliable and accurate classification of all tools into SAFE or DESTRUCTIVE categories.
- **Dependencies**: The execution-state mechanism (State Machine) accurately tracking and broadcasting the current AI conversation state.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST actively filter the list of available tools provided to the LLM before transmission based on the current execution state.
- **FR-002**: System MUST restrict the tools list to only SAFE-classified tools and handshake tools when the system is in the REQUEST or REASONING states.
- **FR-003**: System MUST expose the full set of mode-permitted tools when the system transitions to the ACTION state.
- **FR-004**: System MUST NOT circumvent or replace the existing runtime security checks; it must augment them as a defense-in-depth UI/Agent restriction mechanism.
- **FR-005**: System MUST maintain the existing mode-based tool filtering, applying execution-state filtering as a compounding restriction.

### Key Entities

- **Execution State**: Represents the current phase of the AI's interaction lifecycle (REQUEST, REASONING, ACTION).
- **Tool Classification**: A mapping that categorizes each available tool as either SAFE (read-only, exploratory) or DESTRUCTIVE (mutating state, executing commands).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of LLM prompts sent during the pre-intent phase omit destructive tool schemas.
- **SC-002**: 100% of LLM prompts sent during the execution phase correctly include all destructive tool schemas permitted by the active mode.
- **SC-003**: The average token size for pre-intent prompts is measurably reduced due to eliminated tool schema descriptions.
- **SC-004**: Zero occurrences of the AI wasting a turn attempting to call a destructive tool before selecting an intent (due to the tool no longer being in its catalog).
