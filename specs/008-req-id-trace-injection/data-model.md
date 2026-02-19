# Data Model: REQ-ID Injection Enforcement

## 1. Entities

### 1.1 `AgentTraceEntry` (Updated)

Extends the single mutation record in the trace ledger to formalize requirement linkage.

**Fields**:

- `timestamp` (string): ISO-8601 timestamp.
- `agentId` (string): Identity of the agent.
- `intentId` (string): The identifier of the intent (`REQ-ID`).
- **`related` (string[])**: **[NEW]** Array containing the associated `REQ-ID` to explicitly satisfy Law 3.3.1.
- `mutation` (Object): Details.
    - `type` ("write" | "delete" | "rename" | "create")
    - `target` (string)
    - `hash` (string)
- `vcsRevision` (string): Git revision ID.
- `attribution` (string): Contributor identity.
- `metadata` (Record<string, any>?): Optional metadata.

**Validation Rules**:

- `intentId` MUST match `/^REQ-[a-zA-Z0-9\-]+$/`
- `related` MUST contain `intentId`.

---

### 1.2 `TraceabilityError`

A custom exception class denoting a blocked execution resulting from a governance violation regarding requirement traceability.

**Fields**:

- `name` (string): "TraceabilityError"
- `message` (string): Human-readable error identifying the missing or malformed `REQ-ID`.
- `toolName` (string): The tool that was intercepted and blocked.
- `intentId` (string?): The offending or missing identifier.

**Usage**:

- Thrown exclusively by `HookEngine.preToolUse` during the authorization phase for any tool identified as `DESTRUCTIVE`.
