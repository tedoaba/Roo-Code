# Data Model: Hook Middleware & Security Boundary

## 1. Intent Specification (`active_intents.yaml`)

Each intent is defined with the following schema, adhering to the project's governance laws.

```yaml
id: "REQ-001"
name: "Implement Login Flow"
description: "Adding OAuth2 login support to the web app."
status: "IN_PROGRESS" # PENDING, IN_PROGRESS, COMPLETED, ABANDONED, BLOCKED
constraints:
    - "Use existing auth-provider.ts"
    - "Do not modify database schema"
owned_scope:
    - "src/auth/**/*"
    - "src/ui/login.tsx"
acceptance_criteria:
    - "User can login with Google"
    - "Invalid tokens are rejected"
budget:
    max_turns: 50
    consumed_turns: 12
created_at: "2026-02-19T10:00:00Z"
updated_at: "2026-02-19T10:15:00Z"
```

## 2. `.intentignore` Pattern Logic

- **File Location**: `.intentignore` in workspace root.
- **Format**: Standard gitignore syntax.
- **Precedence**:
    1. If `path` matches `.intentignore` → **BLOCK**.
    2. If `path` matches `owned_scope` → **ALLOW**.
    3. Else → **BLOCK** (Fail-Close).

## 3. Command Classification Mapping

Implemented as a constant in `HookEngine`:

| Command                | Classification    | Automated Scope Check   |
| :--------------------- | :---------------- | :---------------------- |
| `write_to_file`        | Destructive       | Yes                     |
| `apply_diff`           | Destructive       | Yes                     |
| `edit_file`            | Destructive       | Yes                     |
| `execute_command`      | Destructive       | No (User Approval Only) |
| `read_file`            | Safe              | No                      |
| `list_files`           | Safe              | No                      |
| `select_active_intent` | Safe (Gatekeeper) | No                      |

## 4. Hook Response Model

Extended `HookResponse` to support classification:

```typescript
export interface HookResponse {
	action: "CONTINUE" | "DENY" | "HALT"
	classification: "SAFE" | "DESTRUCTIVE"
	reason?: string
}
```
