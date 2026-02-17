# Feature Specification: The Handshake (Reasoning Loop Implementation)

**Feature Branch**: `001-intent-handshake`  
**Created**: 2026-02-17  
**Status**: Draft  
**Input**: User description: "The Handshake (Reasoning Loop Implementation) — Solve the Context Paradox. Bridge the synchronous LLM with the asynchronous IDE loop."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Agent Must Declare Intent Before Acting (Priority: P1)

When a user submits a request to the AI agent (e.g., "Refactor the auth middleware"), the agent is unable to immediately write code. Instead, the system forces the agent's first action to be an intent selection step. The agent analyzes the user's request, identifies the relevant business intent, and calls `select_active_intent` with the appropriate intent ID. Only after this "handshake" succeeds — and the agent receives the enriched context about constraints, scope, and history — can it proceed to make changes.

**Why this priority**: This is the foundational behavioral contract. Without this gate, the entire governance model is bypassed — the agent can write arbitrary code without scope awareness, constraint knowledge, or traceability. Every other feature in the system depends on this handshake occurring first.

**Independent Test**: Can be fully tested by submitting any user request and verifying that the agent's first tool call is always `select_active_intent`, and that any attempt to call another tool before this is rejected. Delivers the core value of context-aware, intent-driven development.

**Acceptance Scenarios**:

1. **Given** a user submits a coding request and one or more active intents exist, **When** the agent processes the request, **Then** the agent's first action MUST be a call to `select_active_intent` with a valid intent ID.
2. **Given** the agent attempts to call `write_to_file`, `execute_command`, or any mutation tool before calling `select_active_intent`, **When** the system intercepts that call, **Then** the call is blocked and the agent receives an error message: "You must cite a valid active Intent ID."
3. **Given** the agent calls `select_active_intent` with an intent ID that does not exist in the active intents registry, **When** the system validates the ID, **Then** the call is rejected with an error identifying the invalid ID and listing available intents.

---

### User Story 2 - Context Enrichment on Intent Selection (Priority: P1)

When the agent successfully calls `select_active_intent`, the system intercepts this call and reads the orchestration data for the selected intent. It assembles a consolidated context block containing the intent's constraints, owned scope boundaries, acceptance criteria, and relevant recent history. This enriched context is returned to the agent as the tool result, giving the agent full situational awareness before it writes a single line of code.

**Why this priority**: Equal to P1 because intent selection alone is meaningless without context injection. The entire value proposition — solving the "Context Paradox" — depends on the agent receiving rich, targeted context at this moment. Without it, the handshake is just a gate with no payload.

**Independent Test**: Can be fully tested by triggering `select_active_intent` for a known intent and verifying the returned context block contains the correct constraints, scope, acceptance criteria, and recent history entries. Delivers the value of bridging synchronous LLM reasoning with asynchronous project state.

**Acceptance Scenarios**:

1. **Given** the agent calls `select_active_intent` with a valid intent ID, **When** the system intercepts the call, **Then** it reads the orchestration state for that intent and returns a structured context block containing: intent name, status, constraints, owned scope, acceptance criteria, and related specification references.
2. **Given** the selected intent has prior agent trace history (previous edits, commands executed), **When** the context block is assembled, **Then** it includes a summary of recent actions taken under this intent so the agent does not repeat or conflict with prior work.
3. **Given** the selected intent has entries in the spatial map (intent-to-file mappings), **When** the context block is assembled, **Then** it includes the list of files already touched and their current state hashes.

---

### User Story 3 - System Prompt Enforcement of Protocol (Priority: P2)

Before any prompt is sent to the LLM, the system modifies the agent's instructions to include the handshake protocol. The system prompt clearly states that the agent is an "Intent-Driven Architect," that its first action must be to analyze the user request and select an active intent, and that code writing is prohibited until intent selection is complete. This ensures the agent understands the protocol at the instruction level, not just at the enforcement level.

**Why this priority**: P2 because the behavioral enforcement (P1 stories above) already guarantees compliance through hard gating. System prompt engineering is the "soft" complement — it ensures the agent cooperates willingly rather than fighting the constraints, improving response quality and reducing wasted LLM turns.

**Independent Test**: Can be tested by inspecting the system prompt sent to the LLM before any request and verifying it contains the intent-driven protocol instructions, the mandate to call `select_active_intent` first, and the prohibition on immediate code writing.

**Acceptance Scenarios**:

1. **Given** the system is preparing a prompt for the LLM, **When** the prompt assembly pipeline runs, **Then** the system prompt includes a governance section stating: "You are an Intent-Driven Architect. You CANNOT write code immediately. Your first action MUST be to analyze the user request and call select_active_intent to load the necessary context."
2. **Given** active intents exist in the orchestration state, **When** the system prompt is assembled, **Then** the governance section lists available intents with their names and brief descriptions so the agent can make an informed selection.
3. **Given** an intent has already been selected for the current session, **When** the system prompt is assembled for subsequent LLM calls, **Then** the governance section reflects the active intent and its scope boundaries rather than repeating the selection mandate.

---

### User Story 4 - Context Pre-Loading Before Prompt Dispatch (Priority: P2)

Before the extension sends a prompt to the LLM, the system intercepts the outgoing payload. It reads the orchestration state (active intents, agent trace entries for the active intent) and prepares a consolidated intent context. This pre-loaded context is injected into the prompt so the LLM always has awareness of the current project state, without the agent needing to manually query for it.

**Why this priority**: P2 because while P1 handles the initial handshake, this story ensures that subsequent LLM calls (in the same session, after intent selection) also carry forward the intent context. This prevents context loss across the multi-turn conversation loop.

**Independent Test**: Can be tested by inspecting the prompt payload before it is sent to the LLM on any turn after intent selection, and verifying it includes the pre-loaded intent context block with current constraints, scope, and recent history.

**Acceptance Scenarios**:

1. **Given** an intent is active for the current session, **When** a prompt is about to be sent to the LLM, **Then** the system injects the active intent's constraints and scope into the prompt payload.
2. **Given** the agent has made changes under the active intent in prior turns, **When** the next prompt is sent, **Then** the injected context includes an updated summary of actions taken so far under this intent.

---

### User Story 5 - Gatekeeper Blocks Unvalidated Execution (Priority: P3)

When the system's pre-processing hook runs before prompt dispatch, it verifies that the agent has declared a valid intent ID for the current session. If no valid intent is active — either because the agent never selected one, or the selected intent has been completed or abandoned — the system blocks execution entirely and returns a clear error message instructing the agent to select an intent.

**Why this priority**: P3 because U1 and U2 handle the primary enforcement path. This story addresses the edge case of session state corruption, intent lifecycle transitions mid-session, or implementation bugs where the gatekeeper provides a final safety net.

**Independent Test**: Can be tested by simulating a session where no intent has been selected (or where the previously selected intent has been marked as COMPLETED) and verifying that the system blocks all LLM requests with an appropriate error.

**Acceptance Scenarios**:

1. **Given** no intent has been selected in the current session, **When** the system's pre-hook runs before prompt dispatch, **Then** execution is blocked and the agent receives: "You must cite a valid active Intent ID."
2. **Given** the previously selected intent has transitioned to COMPLETED status, **When** the agent attempts to continue working without selecting a new intent, **Then** the system blocks execution and prompts the agent to select a new active intent.
3. **Given** the agent provides an intent ID that has been marked ABANDONED, **When** the system validates the intent, **Then** the call is rejected with an error explaining the intent is no longer active.

---

### Edge Cases

- What happens when no active intents exist in the orchestration state? The system should inform the agent that no intents are available and guide toward intent creation.
- How does the system handle the agent selecting an intent that is currently assigned to another agent? The system should either deny the selection with a conflict message or allow it based on configurable policy (default: deny).
- What happens if the orchestration state file is missing or corrupted? The system should fail gracefully, log the error, and inform the agent that orchestration state is unavailable.
- How does the system behave when the agent's conversation context window is truncated mid-session? The system should re-inject intent context on every LLM call, ensuring context is never lost even after truncation.
- What happens if the LLM ignores the system prompt and attempts to call tools without selecting an intent? The hard enforcement gate (pre-hook) catches this regardless of LLM compliance.

## Clarifications

### Session 2026-02-17

- **Q:** Should the agent be allowed to switch intents mid-session? → **A:** **Lock Session**. Once an intent is selected, the agent is bound to it for the entire session. To work on a different intent, the agent must start a new session. This enforces a clean "one session = one task" model.
- **Q:** How should the system handle attempts to write files outside the active intent's scope? → **A:** **Hard Block**. Any attempt to write/edit a file outside the active intent's `owned_scope` is strictly denied by the Hook Engine.
- **Q:** How is `owned_scope` defined? → **A:** **Explicit Globs**. The intent must explicitly list file paths or glob patterns (e.g., `src/auth/**/*.ts`) in `active_intents.yaml`. Anything not matching is out of scope.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST define a tool called `select_active_intent` that accepts an intent ID parameter and returns enriched context for the selected intent.
- **FR-002**: System MUST block all mutating tool calls (file writes, command execution, file edits) until the agent has successfully called `select_active_intent` with a valid intent ID.
- **FR-003**: System MUST intercept the `select_active_intent` call, read the orchestration state for the specified intent, and return a structured context block containing the intent's name, status, constraints, owned scope, acceptance criteria, related specifications, and recent agent trace history.
- **FR-004**: System MUST modify the system prompt before every LLM request to include a governance section enforcing the intent-driven protocol, stating the agent must select an intent before acting.
- **FR-005**: System MUST list available active intents (with names and descriptions) in the system prompt governance section so the agent can make an informed selection.
- **FR-006**: System MUST inject the active intent's context (constraints, scope, recent history) into the prompt payload on every LLM call after intent selection, ensuring context persistence across turns.
- **FR-007**: System MUST validate the intent ID provided to `select_active_intent` against the current orchestration state, rejecting invalid, completed, or abandoned intents with descriptive error messages.
- **FR-008**: System MUST restrict the tools available to the LLM to only `select_active_intent` until an intent has been successfully selected, restoring the full tool set afterward.
- **FR-009**: System MUST return a clear, actionable error message ("You must cite a valid active Intent ID.") when the agent attempts any tool call without an active intent.
- **FR-010**: System MUST re-inject intent context on every LLM call to prevent context loss due to conversation truncation or context window limits.
- **FR-011**: System MUST handle missing or corrupted orchestration state files gracefully, logging the error and informing the agent that orchestration is unavailable.
- **FR-012**: System MUST update the system prompt governance section to reflect the active intent and its scope boundaries once an intent has been selected, replacing the selection mandate with active-intent guidance.
- **FR-013**: System MUST enforce a "Lock Session" policy where an agent cannot switch intents once one is selected during a session. Attempts to call `select_active_intent` a second time MUST be rejected with a message instructing to start a new session.
- **FR-014**: System MUST strictly enforce `owned_scope` boundaries defined by explicit glob patterns in `active_intents.yaml`. Any file mutation targeting a path not matching these patterns MUST be hard-blocked with a "Scope Violation" error.
- **FR-015**: System MUST treat any file creation or deletion as a scope-checked operation; new files must match an existing positive glob pattern (e.g., `src/components/**`) to be allowed.

### Key Entities

- **Active Intent**: A registered business requirement or task with a unique ID, lifecycle status (PENDING, IN_PROGRESS, BLOCKED, COMPLETED, ABANDONED), constraints, owned file scope, and acceptance criteria. Stored in the orchestration state.
- **Intent Context Block**: A structured data package assembled at the moment of intent selection, containing the intent's constraints, owned scope, acceptance criteria, related specifications, and recent history. Returned to the agent as the tool result of `select_active_intent`.
- **Agent Trace Entry**: A record in the audit trail linking a specific agent action (file mutation, command execution) to the active intent ID. Used to build the "recent history" component of the Intent Context Block.
- **Orchestration State**: The collective state managed by the governance layer, including all active intents, the audit trail, and the spatial map. Read before every LLM call and every tool execution.
- **Governance Prompt Section**: A dynamically generated section of the system prompt that enforces the intent-driven protocol, lists available intents, and conveys active intent scope after selection.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of agent sessions begin with an intent selection step — no mutating action occurs before intent selection, verified across all test scenarios.
- **SC-002**: The intent context block returned to the agent contains all required fields (name, status, constraints, scope, acceptance criteria, related specs, recent history) in 100% of successful selections.
- **SC-003**: All attempts to call mutating tools before intent selection are blocked with the correct error message, with zero false negatives (zero bypass occurrences).
- **SC-004**: The system prompt contains the governance section in 100% of LLM requests, with correct content reflecting the current session state (pre-selection mandate OR active intent guidance).
- **SC-005**: Context injection persists across all turns in a multi-turn conversation — the agent never loses awareness of the active intent's constraints and scope, even after 10+ turns.
- **SC-006**: Invalid intent IDs (non-existent, completed, abandoned) are rejected with descriptive error messages in 100% of cases.
- **SC-007**: The system recovers gracefully from missing or corrupted orchestration state files without crashing, in 100% of error scenarios.
- **SC-008**: The end-to-end handshake flow (request → intent selection → context enrichment → contextualized action) completes within 2 seconds of additional latency compared to the ungoverne baseline.

## Assumptions

- The `.orchestration/active_intents.yaml` file and associated orchestration state (agent trace, intent map) already exist or will be initialized as a prerequisite before this feature is used in production. This feature does not handle the initial creation or population of intents — it consumes them.
- The agent trace data (`agent_trace.jsonl`) is available in the expected format and location. This feature reads trace entries but does not define the trace-writing mechanism (that belongs to the PostToolUse hooks).
- The existing tool execution pipeline (BaseTool, presentAssistantMessage) supports interception points where pre-hook logic can be inserted with minimal modification to core files.
- The system prompt construction pipeline (generatePrompt, addCustomInstructions) supports the addition of new dynamic sections injected at build time.
- Only one intent can be active per agent session at a time. Multi-intent concurrent work by a single agent is out of scope.
- The LLM providers support the tool restriction mechanism — specifically, that removing tools from the tools array sent to the LLM effectively prevents the LLM from calling them.
- Human users interacting with the IDE are not directly affected by the handshake mechanism — it governs AI agent behavior only.

## Dependencies

- **Orchestration State (`.orchestration/` sidecar)**: The active intents YAML file and agent trace must exist and be readable. Intent creation and lifecycle management are prerequisites.
- **Hook Engine Infrastructure**: The pre-hook and post-hook interception points described in the architecture must be available. If the Hook Engine is not yet implemented, it must be built first or in parallel.
- **System Prompt Pipeline**: The prompt construction pipeline must support dynamic section injection for the governance prompt section.
- **Tool Builder**: The `buildNativeToolsArray` function must support conditional filtering based on governance state (intent selected vs. not selected).
