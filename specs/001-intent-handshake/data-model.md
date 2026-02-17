# Data Model: Orchestration State

**Feature**: The Handshake (Reasoning Loop Implementation)
**Status**: Draft

## Active Intent Log (`.orchestration/active_intents.yaml`)

This file stores the active intents being tracked by the orchestration system.

```yaml
intents:
    - id: <uuid>
      name: <string>
      description: <string>
      status: PENDING | IN_PROGRESS | COMPLETED | ABANDONED | BLOCKED
      constraints:
          - <string>
      owned_scope:
          - <string> # Glob pattern or specific file path
      acceptance_criteria:
          - <string>
      related_specs:
          - <string> # Relative path to spec file
      assigned_agent: <string> # Agent ID or "human"
      created_at: <iso8601>
      updated_at: <iso8601>
```

## Agent Trace Log (`.orchestration/agent_trace.jsonl`)

This append-only log records every mutating action taken by an agent.

```json
{
	"timestamp": "<iso8601>",
	"agent_id": "<string>",
	"intent_id": "<uuid | null>",
	"action_type": "TOOL_EXECUTION | CONTEXT_LOAD | INTENT_SELECTION | SCOPE_VIOLATION | ERROR",
	"payload": {
		"tool_name": "<string (optional)>",
		"tool_input": "<object (optional)>",
		"target_files": ["<string (optional)>"],
		"command": "<string (optional)>"
	},
	"result": {
		"status": "SUCCESS | FAILURE | DENIED",
		"output_summary": "<string>",
		"content_hash": "<sha256 (optional)>",
		"error_message": "<string (optional)>"
	},
	"metadata": {
		"vcs_ref": "<string (optional)>",
		"session_id": "<string>"
	}
}
```

## Intent Map (`.orchestration/intent_map.md`)

Maps physical files to the intents that currently "own" or have modified them.

```markdown
# Intent Map

| File Path                   | Owning Intent ID | Last Modified By Intent ID | Content Hash |
| :-------------------------- | :--------------- | :------------------------- | :----------- |
| `src/auth/login.ts`         | `intent-123`     | `intent-123`               | `sha256:...` |
| `src/components/Header.tsx` | `intent-456`     | `intent-456`               | `sha256:...` |
```

## Orchestration Service Interface

```typescript
interface OrchestrationService {
	// Intent Management
	getActiveIntents(): Promise<ActiveIntent[]>
	getIntent(id: string): Promise<ActiveIntent | undefined>
	updateIntentStatus(id: string, status: IntentStatus): Promise<void>

	// Context & Trace
	getIntentContext(id: string): Promise<IntentContextBlock>
	logTrace(entry: AgentTraceEntry): Promise<void>

	// Scope Validation
	validateScope(intentId: string, filePath: string): Promise<ScopeValidationResult>
}
```
