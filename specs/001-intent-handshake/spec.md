# Feature Specification: The Handshake (Reasoning Loop Implementation)

**Feature Branch**: `001-intent-handshake`  
**Created**: 2026-02-17  
**Updated**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "The Handshake (Reasoning Loop Implementation) — Solve the Context Paradox. Bridge the synchronous LLM with the asynchronous IDE loop."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The Reasoning Intercept (Priority: P1)

When a user submits a request to the AI agent (State 1: The Request), the agent enters the **Reasoning Intercept** (State 2). In this state, the agent's privilege boundary is constricted: all mutating tools (file writes, command execution) are disabled, and only the `select_active_intent` tool is available. The agent must analyze the request against the project's **Constitution** and **Soul** and select a valid intent ID from the orchestration registry. This ensures the "Silicon Worker" thinkers before they act.

**Why this priority**: Core architectural invariant (Invariant 9). Without this intercept, the system remains a "Vibe Coding" environment subject to cognitive debt and trust debt.

**Independent Test**: Verified by submitting a prompt and checking that the agent's tool availability is restricted to `select_active_intent` only, and that any attempt to bypass this state results in a "governance violation" block by the **Hook Engine**.

**Acceptance Scenarios**:

1. **Given** the agent is in State 1 (Request received), **When** it attempts to invoke any tool other than `select_active_intent`, **Then** the **Hook Engine** rejects the request with a "State Violation: Reasoning Intercept Required" error.
2. **Given** an agent session is initialized, **When** the system prompt is assembled, **Then** it must include the current list of available intents from `active_intents.yaml`.
3. **Given** the agent provides an invalid or completed intent ID, **When** `select_active_intent` is called, **Then** the system returns a validation error and stays in State 2.

---

### User Story 2 - Context Enrichment & Shared Brain Integration (Priority: P1)

Upon successful intent selection, the system transitions to **State 3: Contextualized Action**. The **Hook Engine** intercepts the transition and enriches the agent's context window with the intent's `owned_scope`, constraints, and history from `agent_trace.jsonl`. Crucially, it also injects relevant lessons from the **Shared Brain** (`AGENT.md`/`CLAUDE.md`), allowing the agent to inherit collective wisdom before starting the task.

**Why this priority**: Essential for solving the "Context Paradox." The agent needs to know its boundaries (Scope) and the rules of the house (Constitution/Shared Brain) to operate safely.

**Independent Test**: Verified by calling `select_active_intent` for a specific intent and checking that the returned tool result contains the correct scope globs, constraint list, and recent "Shared Brain" entries relevant to the task domain.

**Acceptance Scenarios**:

1. **Given** a valid intent ID is selected, **When** the context is returned, **Then** it MUST contain the `owned_scope` (explicit globs) and `constraints` from the `active_intents.yaml`.
2. **Given** relevant history exists in `agent_trace.jsonl`, **When** the context is enriched, **Then** it MUST provide a summary of recent mutations and their rationale.
3. **Given** the **Shared Brain** contains architectural guidelines, **When** the agent starts the task, **Then** those guidelines are injected as high-priority constraints.

---

### User Story 3 - Cryptographic Audit & Provenance (Priority: P2)

As the agent executes mutations (State 3), every file write or terminal execution is intercepted by the **Hook Engine**. Each mutation is recorded in the **Audit Ledger** (`agent_trace.jsonl`) with a SHA-256 content hash of the affected code block. This binds the code change to the intent ID with cryptographic proof, enabling "Retroactive Tracing" — the ability to explain why any line of code exists.

**Why this priority**: Eliminates "Trust Debt." It provides architectural assurance that the agent stayed within its mandate (Law 4.5: Tamper Evidence).

**Independent Test**: Perform a file write under an active intent, then verify that a new entry appears in `agent_trace.jsonl` with the correct intent ID, timestamp, contributor model, and a SHA-256 hash that matches the new file content.

**Acceptance Scenarios**:

1. **Given** a `write_to_file` call is permitted, **When** the write completes, **Then** the **PostToolUse** hook MUST compute the SHA-256 hash and update the ledger.
2. **Given** a line of code is later moved within the file, **When** a "provenance check" is run, **Then** the system MUST successfully re-link the code to its intent using the content hash (Spatial Independence).

---

### User Story 4 - Resource Governance & Execution Budgets (Priority: P3)

The system monitors the agent's token consumption, turn count, and loop patterns. If an agent enters an infinite loop or exceeds its allocated **Execution Budget** for an intent, the **Hook Engine** trips a **Circuit Breaker**, halting execution and requesting human intervention. This prevents resource exhaustion and "Context Rot."

**Why this priority**: Law 3.1.5: Efficiency is a governance concern. Prevents runaway agents from incurring excessive costs or corrupting local state through repeated failures.

**Independent Test**: Simulate an agent loop (3+ identical tool calls) and verify that the Hook Engine automatically denies the 4th call and terminates the session with a loop detection error.

**Acceptance Scenarios**:

1. **Given** an active intent has a turn limit, **When** the limit is reached, **Then** the **PreToolUse** hook denies further actions and marks the intent as `BLOCKED`.
2. **Given** the **PreCompact** hook detects potential context rot, **When** an LLM request is prepared, **Then** it summarizes historical trace data to maintain the reasoning integrity of the agent.

---

### Edge Cases

- **Circuit Breaker Trip**: If a circuit breaker is triggered due to loop detection (FR-009) or budget exhaustion (FR-011), the intent status MUST be set to `BLOCKED`. Execution cannot resume until a human manually resets the status to `IN_PROGRESS` in `active_intents.yaml`.
- **Missing Orchestration Directory**: If `.orchestration/` is deleted, the **Hook Engine** must enter **Fail-Safe Default** mode (Invariant 8): deny all mutating actions and halt the system until the state is restored or re-initialized.
- **Scope Leakage**: If an agent attempts to write to a file `src/secret.ts` when its `owned_scope` is only `src/components/**`, the **ScopeEnforcementHook** must reject the write and log a governance violation.
- **Stale Intent State**: If an intent is marked `COMPLETED` by a human or supervisor agent, any worker agent still using that ID in an active session must be immediately blocked and forced to State 2 (Reasoning Intercept).
- **Ownership Contention**: If an agent attempts to mutate a file already "Locked" by another active intent in the `intent_map.md`, the **Hook Engine** MUST deny the action and return an error: `Governance Violation: File owned by Intent [ID]`.
- **Broad Scope Rejection**: To prevent un-auditable "mega-changes," the **Hook Engine** MUST reject any intent that uses broad root-level globs (e.g., `src/**/*`, `**/*.ts`) or covers more than 20 files.

## Clarifications

### Session 2026-02-18

- Q: What should happen if an agent attempts to mutate a file owned by a different active intent? → A: Block & Signal: Deny the mutation and return an error identifying the current owning Intent ID.
- Q: How should the system handle the recovery after a circuit breaker trips? → A: Human Manual Reset: The intent is marked `BLOCKED` and requires a human edit to `active_intents.yaml` to resume.
- Q: Should the system allow broad intent scopes like `src/**/*`? → A: Hard Limit: Block intents that cover more than X files (Max: 20) or broad root-level recursive globs.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: **Hook Engine Middleware**: System MUST implement a `src/hooks/` engine that intercepts all tool calls and LLM requests, acting as the **sole execution gateway** (Invariant 2).
- **FR-002**: **Three-State State Machine**: System MUST enforce the flow: State 1 (Request) → State 2 (Reasoning Intercept) → State 3 (Contextualized Action).
- **FR-003**: **Mandatory Handshake Tool**: System MUST define `select_active_intent` as the only tool available during the Reasoning Intercept.
- **FR-004**: **Orchestration Source of Truth**: System MUST read/write intent and trace state exclusively from the `.orchestration/` sidecar directory (Invariant 4).
- **FR-005**: **Scope Enforcement**: System MUST hard-block any mutation (PreToolUse) targeting an artifact outside the active intent's `owned_scope` globs (Law 3.2.1). The **Hook Engine** MUST also reject the selection of intents with excessively broad scopes (e.g., `*`, `src/**/*`) to ensure granular traceability.
- **FR-006**: **Cryptographic Audit Log**: System MUST append mutation records to `agent_trace.jsonl` with **SHA-256 Content Hashes** for spatial independence (Invariant 7).
- **FR-007**: **State-Aware System Prompts**: System MUST dynamically build the system prompt to reflect the current state (listing available intents in State 2, or displaying active scope/constraints in State 3).
- **FR-008**: **Context Compaction (PreCompact)**: System MUST implement a hook to summarize tool history before LLM requests to prevent context limit exhaustion (Law 3.1.6).
- **FR-009**: **Circuit Breakers**: System MUST halt agents that repeat identical tool calls 3+ times (Law 4.6).
- **FR-010**: **Shared Brain Sync**: System MUST append significant lessons/failures to `AGENT.md`/`CLAUDE.md` after State 3 completion.
- **FR-011**: **Execution Budgets**: System MUST enforce turn/token limits per intent as defined in `active_intents.yaml`.
- **FR-012**: **Retroactive Linkage**: System MUST maintain `intent_map.md` to map files to intents semantically.

### Key Entities

- **Hook Engine**: The governance boundary (middleware) that intercepts and validates all operations.
- **Active Intent**: A machine-readable requirement (ID, Name, Status, Scope, Constraints, Acceptance Criteria).
- **Audit Ledger (`agent_trace.jsonl`)**: The append-only record of mutations tied to intents with cryptographic hashes.
- **Spatial Map (`intent_map.md`)**: The bridge between files and the intents that produced them.
- **Shared Brain (`AGENT.md`)**: The persistent knowledge base shared across all agent sessions.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: **Zero-Bypass Enforcement**: 100% of mutating tool calls are blocked by the Hook Engine if no valid intent is active.
- **SC-002**: **Cryptographic Completeness**: 100% of recorded mutations in the ledger contain a valid SHA-256 content hash and a foreign-key link to an intent.
- **SC-003**: **Reasoning Integrity**: The context returned to the agent after the handshake includes 100% of the constraints and scope boundaries defined for that intent.
- **SC-004**: **Spatial Independence**: The system can successfully map a moved code block back to its original intent using only its content hash in the audit ledger.
- **SC-005**: **Fail-Safe Default**: System successfully enters "Denial of Action" mode within 100ms of detecting a corrupted or missing orchestration state.
- **SC-006**: **Efficiency**: Handshake latency (State 2) adds no more than 1 second to the total initial response time compared to an ungoverned agent.
