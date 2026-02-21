# AGENTS.md

This file provides guidance to agents when working with code in this repository.

- Settings View Pattern: When working on `SettingsView`, inputs must bind to the local `cachedState`, NOT the live `useExtensionState()`. The `cachedState` acts as a buffer for user edits, isolating them from the `ContextProxy` source-of-truth until the user explicitly clicks "Save". Wiring inputs directly to the live state causes race conditions.

## Hook Middleware & Security Boundary

- **Intent Handshake**: You MUST select an active intent using `select_active_intent` before executing any destructive tools (write, delete, execute).
- **Scope Enforcement**: All file mutations must stay within the `owned_scope` defined in the active intent.
- **Intent Ignore**: Files matched by patterns in `.intentignore` are strictly read-only and cannot be modified even if in scope.
- **User Approval**: Every destructive tool execution will trigger a UI-blocking "Approve/Reject" dialog. You must wait for approval before proceeding.
- **Standardized Recovery**: If a tool is rejected or blocked by scope, you will receive a JSON error. Use this to self-correct (e.g., expand scope or cite a different file).
- **Lessons Learned Ledger**: The system automatically records linter and test failures into `AGENT.md`. Review these entries to avoid repeating the same mistakes. You can manually enrich these entries with `Cause`, `Resolution`, and `Corrective Rule`.
