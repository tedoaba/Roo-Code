# Quickstart: Hook Middleware & Security Boundary

## Overview

The Hook Middleware provides a security boundary for all tool executions. It classifies commands as **Safe** or **Destructive**, enforces **Intent Scopes**, and requires **User Approval** for all destructive actions.

## 1. Defining an Intent with Scope

To edit files, the agent must first activate an intent with a defined `owned_scope`.

```typescript
// The agent calls this tool first
await select_active_intent({
	id: "FEAT-123",
	name: "Add unit tests",
	owned_scope: ["tests/**/*", "src/utils/math.ts"],
})
```

## 2. Setting Global Exclusions (`.intentignore`)

Create an `.intentignore` file in your root to protect sensitive files from ALL intents.

```text
# .intentignore
config/secrets.json
.env
scripts/deploy.sh
```

## 3. Tool Execution Flow

1. **Agent Request**: Agent attempts `write_to_file`.
2. **Pre-Hook**: `HookEngine` checks:
    - Is an intent active? (If no → Fail)
    - Is it in `.intentignore`? (If yes → Fail)
    - Is it in `owned_scope`? (If no → Fail)
    - Is it "Destructive"? (If yes → Classification: DESTRUCTIVE)
3. **Approval**:
    - If DESTRUCTIVE, VS Code shows a warning message: "Approve/Reject execution of write_to_file for src/main.ts".
4. **Execution**: If Approved, the tool runs.
5. **Post-Hook**: `HookEngine` logs the mutation hash and updates the audit ledger.

## 4. Recovery from Failures

If the hook denies an action (e.g., Scope Violation), the agent receives a JSON error:

```json
{
	"error": "Scope Violation",
	"details": "FEAT-123 is not authorized to edit src/core/main.ts. Request scope expansion.",
	"recovery_hint": "Cite a different file or use 'select_active_intent' to expand scope."
}
```

The agent is trained to recognize this and ask the user for scope expansion or try a different approach.
