# AI-Native IDE — System Constitution

> _"A system without declared intent is a system without accountability."_

**Version**: 1.2.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-18

---

## Preamble

This Constitution is the supreme governing document of the AI-Native IDE system. It defines the inviolable principles, architectural invariants, governance laws, and operational constraints under which all system components — human, machine, and autonomous agent — must operate. No feature, optimization, refactor, or expedient may contradict the laws herein. Amendments require explicit ratification and a documented migration plan demonstrating zero regression against existing invariants.

This document does not describe features. It defines **system laws**.

---

## Part I — Core Philosophy

### Article 1: Raison d'Être

This system exists to solve three foundational failures of AI-assisted software development:

1. **Cognitive Debt** — The accumulation of code changes whose original intent, rationale, and scope boundaries have been lost, rendering the codebase incomprehensible to both humans and machines.
2. **Trust Debt** — The erosion of confidence caused by AI agents that operate without auditable constraints, transparent mutation logs, or verifiable scope adherence.
3. **Orchestration Chaos** — The collapse of system integrity when multiple autonomous agents operate concurrently without deterministic conflict resolution, privilege boundaries, or shared state guarantees.

### Article 2: Foundational Axioms

The following axioms are self-evident truths upon which all subsequent laws are predicated:

1. **Intent precedes action.** No mutation to any artifact — code, configuration, documentation, or state — shall occur without a prior, machine-readable declaration of intent.
2. **Every mutation is evidence.** The system shall treat every file write, state transition, and tool invocation as a forensic event subject to immutable logging and cryptographic content verification.
3. **Governance is not optional.** Governance hooks are load-bearing architectural components, not advisory middleware. Bypassing governance is a system violation, not a user preference.
4. **Machines orchestrate; humans govern.** The system shall manage scheduling, conflict resolution, and state transitions autonomously. Humans define policy, approve escalations, and ratify intent.
5. **Traceability is a first-class property.** The ability to trace any line of code back to a declared intent, through every intermediate mutation, is not a debugging convenience — it is a structural requirement.
6. **Efficiency is a governance concern.** Resource exhaustion, context rot, and infinite loops are not just operational failures; they are governance violations. The system SHALL enforce resource budgets as strictly as scope boundaries.

### Article 3: System Identity

This system is not a code editor with AI features. It is a **governed development environment** in which:

- AI agents are first-class participants with defined privileges, not unconstrained tools.
- The orchestration layer is the single source of truth for system state.
- Git is not merely a version control backend but a **cryptographic audit ledger**.
- The IDE surface is a view into governed state, not an unmediated file editor.

---

## Part II — Architectural Invariants

The following invariants must hold at all times, in all execution paths, under all configurations. Violation of any invariant constitutes a system failure requiring immediate remediation.

### Invariant 1: Intent–Code Binding

Every code mutation SHALL be bound to exactly one declared intent. There SHALL exist no code change in the system's history that cannot be traced to a specific, validated intent declaration. An intent declaration, once activated, defines immutable scope boundaries that constrain all subsequent mutations under its authority.

### Invariant 2: Hook Execution Guarantee

All tool invocations, file writes, and state transitions SHALL pass through the Hook Engine (`src/hooks/`). There SHALL exist no execution path — including internal, administrative, or recovery paths — that bypasses the hook pipeline. The Hook Engine operates as a strict middleware boundary between the Extension Host's core logic and all mutating operations (see `ARCHITECTURE_NOTES.md` §6). The Hook Engine is not middleware; it is the **sole execution gateway**.

### Invariant 3: Immutable Audit Trail

Every mutation event SHALL be recorded in the append-only audit ledger (`.orchestration/agent_trace.jsonl`) with, at minimum: a timestamp, the acting agent identity, the originating intent identifier, the target artifact, a cryptographic content hash (SHA-256) of the modified code block, the VCS revision ID, and contributor attribution. Content hashes SHALL be computed over **artifact content, not line numbers**, to achieve spatial independence — ensuring trace validity survives positional shifts from upstream edits (see `ARCHITECTURE_NOTES.md` §7.2). Audit records SHALL NOT be modified, deleted, or truncated during normal operation.

### Invariant 4: Single Source of Orchestration Truth

There SHALL exist exactly one authoritative orchestration state at any point in time, stored in the `.orchestration/` sidecar directory. This state — comprising `active_intents.yaml` (intent specifications), `agent_trace.jsonl` (audit ledger), `intent_map.md` (spatial mapping), and `AGENT.md`/`CLAUDE.md` (shared brain) — SHALL be the sole arbiter of: which intents are active, which agents are authorized, which scopes are locked, and which operations are permitted. No component SHALL maintain shadow state that contradicts or supplements the orchestration state without synchronization. Only the Hook Engine SHALL read from or write to the `.orchestration/` directory (see `ARCHITECTURE_NOTES.md` §7).

### Invariant 5: Agent Isolation

Each autonomous agent SHALL operate within an explicitly granted privilege boundary. An agent SHALL NOT read, write, or lock any artifact outside its authorized scope. Agent-to-agent communication SHALL occur exclusively through the orchestration layer — never through direct invocation, shared memory, or file-system side channels.

### Invariant 6: Deterministic Conflict Resolution

When two or more agents contend for the same resource, the system SHALL resolve the conflict deterministically using a predefined resolution policy. The resolution outcome SHALL be logged. No conflict SHALL be resolved by silent overwrite, last-write-wins, or undefined behavior.

### Invariant 7: Cryptographic Content Integrity

All content hashes SHALL be computed over the full artifact content, not metadata or path alone. The hash algorithm, once selected for a given ledger epoch, SHALL NOT be changed without a formal migration that re-hashes all referenced artifacts and documents the algorithm transition.

### Invariant 8: Fail-Safe Default

In any ambiguous, unrecoverable, or undefined state, the system SHALL default to **denial of action** rather than permissive execution. It is always safer to refuse an operation and require human intervention than to permit an ungoverned mutation.

### Invariant 9: Three-State Execution Flow

Every agent interaction SHALL follow the mandatory Three-State Execution Flow: **The Request** (user prompt received) → **The Reasoning Intercept** (agent must call `select_active_intent` to declare and validate its intent before any other action) → **Contextualized Action** (governed tool execution within the validated intent's scope). There SHALL exist no execution path that permits an agent to reach Contextualized Action without first completing the Reasoning Intercept. The Reasoning Intercept SHALL pause execution, enrich the agent's context with intent constraints, scope boundaries, and operational history from the sidecar data model, and resume execution only once a valid intent is active (see `ARCHITECTURE_NOTES.md` §8).

### Invariant 10: Hierarchical Responsibility

In multi-agent scenarios, every agent SHALL have a clearly defined place in the hierarchy (e.g., Supervisor or Worker). A Supervisor Agent SHALL be responsible for the governance of its sub-agents, including their intent declarations, scope adherence, and final verification. The failure of a sub-agent is a failure of the Supervisor's orchestration.

### Invariant 11: AST-to-Intent Correlation

The mapping between code and intent SHALL be formalized at the AST level where possible. Every mutation SHALL identify the functional scope (function name, class, or module) affected, enabling a semantic "intent lineage" that survives non-functional code changes (refactoring).

---

## Part III — Governance Rules

### Chapter 1: Intent Governance

#### Law 3.1.1 — Mandatory Intent Declaration

No agent — human or machine — SHALL initiate a code-mutating operation without first declaring an intent through the system's intent registration protocol (`select_active_intent` tool, enforced by the Reasoning Intercept — see Invariant 9). An intent declaration SHALL specify, at minimum:

- A human-readable purpose statement (`name` field in `active_intents.yaml`)
- An enumerated scope boundary — files, directories, or glob patterns (`owned_scope` field)
- Operational constraints that bound the agent's behavior (`constraints` field)
- Acceptance criteria that define the "Definition of Done" (`acceptance_criteria` field)
- Agent assignment (`assigned_agent` field)
- Traceability links to upstream specifications (`related_specs` field)

#### Law 3.1.2 — Intent Validation

All intent declarations SHALL be validated against the current orchestration state before activation. Validation SHALL reject intents that:

- Overlap with the scope of any currently active intent without explicit co-tenancy authorization
- Lack a defined scope boundary
- Specify a scope that exceeds the agent's privilege grant
- Contain incoherent or self-contradictory specifications

#### Law 3.1.3 — Intent Lifecycle

An intent SHALL progress through, and only through, the following lifecycle states: `PENDING` → `IN_PROGRESS` → `COMPLETED` | `ABANDONED` | `BLOCKED`. Transitions between states SHALL be logged in `agent_trace.jsonl`. Reverse transitions (e.g., `IN_PROGRESS` → `PENDING`) are prohibited. An intent that enters `BLOCKED` state SHALL be escalated for human resolution. An intent that enters `ABANDONED` state SHALL release all scope locks and record the abandonment reason in the audit trail.

#### Law 3.1.4 — Intent Immutability

Once an intent enters the `IN_PROGRESS` state, its `owned_scope` boundaries SHALL NOT be expanded. An agent requiring broader scope SHALL declare a new, supplementary intent and obtain independent validation. The original intent's `owned_scope` SHALL remain unchanged.

#### Law 3.1.5 — Execution Budgets

Every active intent SHALL be assigned an execution budget (token count, turn count, and time duration). The Hook Engine SHALL monitor consumption through the `PreToolUse` hook and SHALL halt execution if any budget is exceeded.

#### Law 3.1.6 — Context Compaction

The Hook Engine SHALL implement a `PreCompact` hook to prevent context rot. Before an LLM request (PRE-1), historical tool results or redundant trace data SHALL be summarized or distilled to maintain the "Reasoning Integrity" of the agent without exceeding model context limits.

### Chapter 2: Scope Enforcement

#### Law 3.2.1 — Scope as Hard Boundary

The `owned_scope` declared in an active intent is a **hard boundary**, not a guideline. Any file write, deletion, or rename targeting an artifact outside the active intent's `owned_scope` SHALL be rejected by the Hook Engine's `ScopeEnforcementHook` (PreToolUse phase) before execution.

#### Law 3.2.2 — Scope Overlap Resolution

When a newly declared intent's scope overlaps with an already-active intent's scope, the system SHALL:

1.  Deny activation by default.
2.  Present the overlap to the human operator for explicit co-tenancy authorization.
3.  If co-tenancy is authorized, enforce file-level locking within the overlapping region such that only one agent may mutate a given file at any instant.

#### Law 3.2.3 — Scope Leakage Detection

The system SHALL continuously monitor for scope leakage — mutations to artifacts not covered by any active intent. Scope leakage events SHALL trigger an immediate halt of the offending agent, a log entry classified as a governance violation, and a notification to the human operator.

#### Law 3.2.4 — Hierarchical Co-tenancy

In hierarchical orchestration, sub-agents operating under the same Supervisor MAY be granted co-tenancy in the same scope, provided the Supervisor implements deterministic write-partitioning (partitioning by directory or AST-node).

### Chapter 3: Traceability Enforcement

#### Law 3.3.1 — Mutation–Intent Link

Every recorded mutation in `agent_trace.jsonl` SHALL carry a foreign-key reference (via the `related[]` array with `type: "intent"`) to the intent under whose authority it was executed. Orphaned mutations — those without a valid intent reference — are prohibited.

#### Law 3.3.2 — Commit–Intent Binding

Every Git commit produced by the system SHALL reference, in its metadata, the intent identifier(s) whose scope it fulfills. Commits that bundle mutations from multiple unrelated intents are prohibited unless explicitly authorized by a meta-intent declaration.

#### Law 3.3.3 — Retroactive Tracing

The system SHALL support retroactive querying: given any file, line, or hunk in the current codebase, the system SHALL be capable of returning the chain of intents that produced it, in chronological order, with cryptographic proof of content integrity at each step. The `intent_map.md` (see `ARCHITECTURE_NOTES.md` §7.3) SHALL provide the spatial mapping from files to intents, while `agent_trace.jsonl` SHALL provide the temporal chain with content hashes for integrity verification.

---

## Part IV — Security & Privilege Separation

The system enforces strict privilege separation across three domains: the **Webview** (restricted presentation), the **Extension Host** (core runtime), and the **Hook Engine** (governance middleware boundary). See `ARCHITECTURE_NOTES.md` §6.1 for the full privilege separation model.

### Law 4.1 — Principle of Least Privilege

Every agent SHALL be granted the minimum set of permissions required to fulfill its declared intent. Permissions SHALL be scoped to the `owned_scope` of the agent's active intent. During the Reasoning Intercept (State 2), the agent's tool access is restricted to `select_active_intent` only. During Contextualized Action (State 3), tools are restored but filtered to the intent's `owned_scope`. Blanket permissions are prohibited.

### Law 4.2 — Privilege Grant Authority

Only the orchestration layer — acting on validated policy or explicit human authorization — SHALL grant, revoke, or modify agent privileges. Agents SHALL NOT self-elevate, inherit privileges from other agents, or persist privileges beyond the lifecycle of their authorizing intent.

### Law 4.3 — Credential Isolation

Credentials, API keys, tokens, and secrets SHALL NOT be accessible to AI agents through any mechanism: environment variables, file reads, tool responses, or prompt injection. Credential-requiring operations SHALL be delegated to a trusted credential broker that executes outside the agent's address space.

### Law 4.4 — Human Escalation Requirement

Any operation classified as destructive (mass deletion, schema migration, production deployment, privilege escalation) SHALL require explicit human approval before execution. The system SHALL present a human-readable summary of the operation's scope and impact prior to requesting approval.

### Law 4.5 — Tamper Evidence

All governance-critical state — including the audit log, orchestration state, intent registry, and privilege grants — SHALL be protected by tamper-evident mechanisms. Any unauthorized modification to governance state SHALL be detectable and SHALL trigger a system-level alert.

### Law 4.6 — Circuit Breakers

The Hook Engine SHALL implement circuit breakers that automatically trip (deny execution) if an agent exhibits signs of an infinite loop (e.g., repeating the same tool call with same parameters 3+ times) or attempts privilege escalation (e.g., calling hooks directly).

---

## Part V — Parallel Orchestration Guarantees

### Law 5.1 — Safe Concurrency

The system SHALL support multiple concurrent agents operating on non-overlapping scopes without degradation of governance guarantees. Concurrency SHALL NOT weaken intent validation, scope enforcement, audit logging, or conflict resolution.

### Law 5.2 — Atomic State Transitions

All orchestration state transitions — intent activation, scope lock acquisition, privilege grant, conflict resolution — SHALL be atomic. A partial state transition is a system error. The system SHALL employ appropriate concurrency primitives (locks, transactions, compare-and-swap) to guarantee atomicity.

### Law 5.3 — Deadlock Prevention

The system SHALL implement a deterministic resource acquisition ordering to prevent deadlocks among concurrent agents. If a potential deadlock is detected, the system SHALL preemptively abort the lower-priority intent and notify the affected agent and the human operator.

### Law 5.4 — Progress Guarantee

No well-formed, validated intent SHALL be indefinitely starved of execution. The orchestration layer SHALL ensure fair scheduling such that every active intent makes forward progress within a bounded time window, or is explicitly suspended with documented reason.

### Law 5.5 — Isolation of Failure

The failure, crash, or timeout of one agent SHALL NOT corrupt the orchestration state, orphan scope locks, or prevent other agents from making progress. The system SHALL implement failure fencing such that each agent's failure domain is strictly contained.

---

## Part VI — Documentation & Living Knowledge

### Law 6.1 — Documentation as Governed Artifact

Documentation — including architecture notes, decision records, API specifications, and this Constitution — SHALL be treated as governed artifacts subject to the same intent declaration, scope enforcement, and audit logging as code.

### Law 6.2 — Decision Record Obligation

Every architectural decision, governance policy change, or invariant amendment SHALL be recorded in a machine-readable decision record that captures: the decision, the rationale, the alternatives considered, the deciding authority, and the date.

### Law 6.3 — Knowledge Currency

Documentation SHALL be kept current with the system's actual state. Stale documentation is a governance violation. The system SHOULD provide automated mechanisms to detect drift between documented behavior and actual behavior.

### Law 6.4 — Self-Describing System

The system SHALL be capable of producing, at any point in time, a machine-readable manifest of: all active intents, all authorized agents, all scope locks, all pending operations, and the current orchestration state. This manifest is the system's self-description and SHALL be consistent with the orchestration state defined in Invariant 4.

### Law 6.5 — Constitution Supremacy

This Constitution is the supreme governing document of the system. In any conflict between this Constitution and any other document — including specifications, implementation plans, task lists, or agent instructions — this Constitution prevails. All downstream documents SHALL declare their alignment with the Constitution and SHALL NOT contradict it.

---

## Part VII — Failure Handling & Recovery

### Law 7.1 — Graceful Degradation

The system SHALL degrade gracefully under partial failure. Loss of a single subsystem (e.g., one agent, one hook, one external service) SHALL NOT cascade into total system failure. The system SHALL continue to enforce governance for all unaffected components.

### Law 7.2 — Recovery to Known State

After any failure, the system SHALL recover to the last known consistent orchestration state. Recovery SHALL NOT invent state, merge conflicting states, or silently discard pending operations. If automatic recovery is not possible, the system SHALL halt and await human intervention.

### Law 7.3 — Failure Transparency

All failures SHALL be logged with: the failure type, the affected scope, the orchestration state at time of failure, and the recovery action taken (or the reason recovery was not attempted). No failure SHALL be silently swallowed.

### Law 7.4 — Rollback Integrity

If a mutation sequence under an active intent fails partway through, the system SHALL roll back all mutations in that sequence to restore the pre-intent artifact state. Partial mutations — where some files reflect the intent and others do not — are a prohibited system state.

### Law 7.5 — Quarantine Protocol

When an agent exhibits behavior that violates governance rules (scope leakage, unauthorized privilege use, audit trail corruption), the system SHALL immediately quarantine the agent: revoke all privileges, release all scope locks held by the agent, log the violation with full forensic detail, and notify the human operator. The quarantined agent SHALL NOT be re-authorized without human review.

---

## Part VIII — Amendment Protocol

### Law 8.1 — Amendment Requirements

This Constitution may be amended only through the following process:

1.  A formal amendment proposal SHALL be submitted as a governed artifact with a declared intent.
2.  The proposal SHALL include: the specific text to be changed, the rationale for the change, an impact analysis on existing invariants, and a migration plan.
3.  The amendment SHALL be ratified by the human project authority.
4.  Upon ratification, the Constitution version SHALL be incremented, the amendment date updated, and all downstream documents notified of the change.

### Law 8.2 — Backward Compatibility

No amendment SHALL retroactively invalidate audit records, intent histories, or mutation logs created under a prior version of this Constitution. Historical records SHALL remain interpretable under the rules that governed their creation.

### Law 8.3 — Invariant Protection

Architectural Invariants (Part II) carry the highest protection level. Amendment of any Invariant requires, in addition to the standard amendment process, a demonstrated proof that the proposed change does not introduce any of the three foundational failures defined in Article 1.

---

## Appendix A — Glossary of Normative Terms

| Term                    | Definition                                                                                                    |
| :---------------------- | :------------------------------------------------------------------------------------------------------------ |
| **SHALL**               | Absolute requirement. Non-compliance is a system violation.                                                   |
| **SHALL NOT**           | Absolute prohibition. Compliance is mandatory.                                                                |
| **SHOULD**              | Strong recommendation. Deviation requires documented justification.                                           |
| **MAY**                 | Optional behavior. No justification required for omission.                                                    |
| **Intent**              | A machine-readable declaration of purpose, scope, and expected outcome for a set of mutations.                |
| **Scope**               | The set of artifacts (files, directories, modules) that an intent authorizes for mutation.                    |
| **Mutation**            | Any write, delete, rename, or content modification to a governed artifact.                                    |
| **Agent**               | Any autonomous actor — human or machine — that initiates operations within the system.                        |
| **Hook**                | A governance checkpoint that intercepts and validates operations before execution.                            |
| **Orchestration State** | The single authoritative record of all active intents, scope locks, agent privileges, and pending operations. |
| **Cognitive Debt**      | The loss of intent and rationale information from the codebase's history.                                     |
| **Trust Debt**          | The erosion of confidence caused by ungoverned or unauditable agent actions.                                  |
| **Quarantine**          | The immediate revocation of all agent privileges and locks following a governance violation.                  |

---

## Appendix B — Invariant Quick Reference

| #   | Invariant                         | Failure Mode if Violated                   | Architecture Reference |
| --- | --------------------------------- | ------------------------------------------ | ---------------------- |
| 1   | Intent–Code Binding               | Cognitive Debt: untraceable code changes   | §7.1, §7.2             |
| 2   | Hook Execution Guarantee          | Trust Debt: ungoverned mutations           | §6.2, §6.4             |
| 3   | Immutable Audit Trail             | Forensic failure: unverifiable history     | §7.2                   |
| 4   | Single Orchestration Truth        | State corruption: conflicting system views | §7                     |
| 5   | Agent Isolation                   | Privilege escalation: unauthorized access  | §6.1, §9.2             |
| 6   | Deterministic Conflict Resolution | Data loss: silent overwrites               | §9.1                   |
| 7   | Cryptographic Content Integrity   | Tamper blindness: undetectable corruption  | §7.2                   |
| 8   | Fail-Safe Default                 | Ungoverned execution: trust collapse       | §6.2                   |
| 9   | Three-State Execution Flow        | Ungoverned action: scope bypass            | §8                     |
| 10  | Hierarchical Responsibility       | Orchestration chaos: unaccountable agents  | §10.1                  |
| 11  | AST-to-Intent Correlation         | Cognitive debt: semantic amnesia           | §11                    |

---

## Appendix C — Constitutional Law to Architecture Mapping

This appendix maps each constitutional law to its concrete architectural implementation as specified in `ARCHITECTURE_NOTES.md` v1.1.0.

| Constitutional Law                           | Architecture Mechanism                                                      | Architecture Section |
| -------------------------------------------- | --------------------------------------------------------------------------- | -------------------- |
| **Invariant 1** (Intent–Code Binding)        | `active_intents.yaml` + `agent_trace.jsonl` `related[]` array               | §7.1, §7.2           |
| **Invariant 2** (Hook Execution Guarantee)   | Hook Engine `PreToolUse` + `PostToolUse` phases                             | §6.2                 |
| **Invariant 3** (Immutable Audit Trail)      | `agent_trace.jsonl` with SHA-256 `content_hash`                             | §7.2                 |
| **Invariant 4** (Single Orchestration Truth) | `.orchestration/` sidecar (4 files)                                         | §7                   |
| **Invariant 9** (Three-State Execution Flow) | State 1→2→3 with `select_active_intent`                                     | §8.1, §8.2           |
| **Invariant 10** (Hierarchical Resp.)        | Supervisor/Sub-agent orchestration pattern                                  | §10.1                |
| **Invariant 11** (AST Correlation)           | Semantic mapping via content hashes/ranges                                  | §11                  |
| **Law 3.1.1** (Mandatory Intent Declaration) | `select_active_intent` tool in `src/hooks/tools/`                           | §6.3, §8.2           |
| **Law 3.1.3** (Intent Lifecycle)             | `status` field: `PENDING → IN_PROGRESS → COMPLETED \| ABANDONED \| BLOCKED` | §7.1                 |
| **Law 3.2.1** (Scope as Hard Boundary)       | `ScopeEnforcementHook` in `src/hooks/pre/`                                  | §6.3, §9.2           |
| **Law 3.3.1** (Mutation–Intent Link)         | `related[]` array in trace records                                          | §7.2                 |
| **Law 3.3.3** (Retroactive Tracing)          | `intent_map.md` + `agent_trace.jsonl` content hashes                        | §7.3, §7.2           |
| **Law 4.1** (Least Privilege)                | Three-domain privilege separation + `owned_scope` filtering                 | §6.1, §8.2           |
| **Law 4.2** (Privilege Grant Authority)      | Hook Engine `OrchestrationState` manager                                    | §6.3                 |
| **Law 5.2** (Atomic State Transitions)       | Optimistic locking with content hash comparison                             | §9.1                 |
| **Part VI** (Living Knowledge)               | `AGENT.md`/`CLAUDE.md` Shared Brain pattern                                 | §7.4                 |

---

_This Constitution is a living document governed by its own laws. It is the root of trust for the entire system. Respect it accordingly._
