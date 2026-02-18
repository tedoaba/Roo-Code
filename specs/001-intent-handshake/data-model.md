# Data Model: Orchestration State

**Feature**: The Handshake (Reasoning Loop Implementation)
**Status**: Draft

## Active Intent Registry (`.orchestration/active_intents.yaml`)

This file stores the active mandates being tracked by the orchestration system.

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
      budget:
          max_turns: <number>
          max_tokens: <number>
          consumed_turns: <number>
          consumed_tokens: <number>
      assigned_agent: <string> # Contributor model ID
      created_at: <iso8601>
      updated_at: <iso8601>
```

## Audit Ledger (`.orchestration/agent_trace.jsonl`)

This append-only cryptographic ledger records every event in the Three-State flow.

```json
{
	"timestamp": "<iso8601>",
	"agent_id": "<string>",
	"intent_id": "<uuid | null>",
	"state": "REQUEST | REASONING | ACTION",
	"action_type": "TOOL_EXECUTION | CONTEXT_LOAD | INTENT_SELECTION | SCOPE_VIOLATION | BUDGET_EXHAUSTED | STATE_TRANSITION",
	"payload": {
		"tool_name": "<string (optional)>",
		"tool_input": "<object (optional)>",
		"target_files": ["<string (optional)>"],
		"reasoning": "<string (optional)>",
		"hash": "<sha256 (mandatory for mutations)>"
	},
	"result": {
		"status": "SUCCESS | FAILURE | DENIED",
		"output_summary": "<string>",
		"error_message": "<string (optional)>"
	},
	"metadata": {
		"session_id": "<string>",
		"contributor": "<string>"
	}
}
```

## Spatial Map (`.orchestration/intent_map.md`)

Maps physical artifacts to intent provenance with content hashes. **Policy**: Only one active intent can "Own" a file at a time; attempts by other intents to mutate a locked file are blocked.

```markdown
# Intent Map

| File Path                   | Owning Intent ID | Last Hash        | Prov. Locked? |
| :-------------------------- | :--------------- | :--------------- | :------------ |
| `src/auth/login.ts`         | `intent-123`     | `sha256:a1b2...` | Yes           |
| `src/components/Header.tsx` | `intent-456`     | `sha256:c3d4...` | No            |
```

## Hook Engine Interface

```typescript
interface HookEngine {
	// Lifecycle Hooks
	preToolUse(task: Task, req: ToolRequest): Promise<HookResponse>
	postToolUse(task: Task, res: ToolResult): Promise<void>
	preLLMRequest(task: Task, prompt: Prompt): Promise<Prompt>

	// State Management
	getCurrentState(): ExecutionState
	transitionTo(state: ExecutionState): void
}

interface OrchestrationService {
	// Intent & Budget
	getIntent(id: string): Promise<ActiveIntent>
	updateBudget(id: string, turns: number, tokens: number): Promise<void>

	// Audit & Hashing
	logMutation(intentId: string, filePath: string, content: string): Promise<string>
	verifyIntegrity(filePath: string): Promise<boolean>
}
```
