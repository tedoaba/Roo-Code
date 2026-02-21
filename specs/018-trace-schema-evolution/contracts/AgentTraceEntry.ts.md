# Contract: AgentTraceEntry (Canonical Type)

**Location**: `src/contracts/AgentTrace.ts`
**Feature**: 018-trace-schema-evolution

## Type Definition (Target State)

```typescript
/**
 * Execution state for the Three-State Flow (Invariant 9).
 * Moved to contracts to avoid circular dependency.
 */
export type ExecutionState = "REQUEST" | "REASONING" | "ACTION"

/**
 * Structured contributor attribution for trace entries.
 * Satisfies Invariant 3's contributor attribution requirement.
 */
export interface Contributor {
	/** Whether this action was performed by an AI agent or a human. */
	entity_type: "AI" | "HUMAN"
	/** Model identifier when entity_type is "AI" (e.g., "claude-3-5-sonnet"). */
	model_identifier?: string
}

/**
 * Represents a single mutation record in the agent trace ledger.
 * Follows Invariant 3 of the System Constitution.
 *
 * This is the CANONICAL definition. All code MUST import from this file.
 * Do NOT define AgentTraceEntry elsewhere.
 */
export interface AgentTraceEntry {
	trace_id: string
	timestamp: string
	mutation_class: string
	intent_id: string | null
	related: string[]

	/** Spatial hashing and range data */
	ranges: {
		/** Path to the file modified, relative to project root */
		file: string
		/** Cryptographic hash (SHA-256) of the resulting content */
		content_hash: string
		/** Starting line of change (1-indexed) */
		start_line: number
		/** Ending line of change (inclusive, -1 = EOF) */
		end_line: number
	}

	/** Identity of the contributor (human or system process) — legacy field */
	actor: string

	/** Brief summary of the change */
	summary: string

	/**
	 * Structured contributor attribution (NEW).
	 * Identifies whether the change was made by AI (with model identifier) or human.
	 * Optional for backward compatibility with legacy entries.
	 */
	contributor?: Contributor

	/** Execution state at time of event */
	state?: ExecutionState
	action_type?: string
	payload?: any
	result?: any

	/**
	 * Optional metadata. When present, session_id is required.
	 * NOTE: metadata.contributor (string) is DEPRECATED.
	 * Use the top-level contributor object instead.
	 */
	metadata?: {
		session_id: string
		vcs_ref?: string
		[key: string]: any
	}
}

/**
 * Service interface for managing the append-only ledger.
 *
 * SECURITY NOTE: Implementations MUST ONLY be invoked by the Hook Engine
 * to satisfy Invariant 4 (Single Source of Orchestration Truth).
 */
export interface ILedgerManager {
	/**
	 * Appends a trace entry to the ledger file.
	 * MUST ensure atomicity and MUST NOT overwrite existing entries.
	 */
	append(entry: AgentTraceEntry): Promise<void>
}
```

## Migration Contract

### Re-export in `services/orchestration/types.ts`

After removing the duplicate `AgentTraceEntry` interface from `types.ts`, add:

```typescript
/**
 * @deprecated Import AgentTraceEntry directly from '../../contracts/AgentTrace' instead.
 * This re-export exists for backward compatibility during migration and will be removed.
 */
export { AgentTraceEntry, ExecutionState, type Contributor } from "../../contracts/AgentTrace"
```

Note: `ExecutionState` was previously defined in `types.ts` as `export type ExecutionState = "REQUEST" | "REASONING" | "ACTION"`. It will be moved to `contracts/AgentTrace.ts` and re-exported from `types.ts` for compatibility.

### Producer Update Contract

All producer sites MUST construct entries with the `contributor` field:

```typescript
// Standard AI contributor object for all agent-generated entries
const contributor: Contributor = {
	entity_type: "AI",
	model_identifier: "roo-code", // or dynamic model name when available
}
```

### LedgerManager.recordMutation Extension

```typescript
async recordMutation(params: {
    actor: string
    intentId: string
    mutationClass: string
    type: "write" | "delete" | "rename" | "create"
    target: string
    summary: string
    metadata?: Record<string, any>
    contributor?: Contributor  // NEW parameter
}): Promise<void>
```

## Affected Import Sites

| #   | File                                                  | Current Import Path                     | Change Required                                   |
| --- | ----------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| 1   | `utils/orchestration/LedgerManager.ts`                | `../../contracts/AgentTrace`            | ✅ Already correct — no change                    |
| 2   | `utils/orchestration/__tests__/LedgerManager.test.ts` | `../../../contracts/AgentTrace`         | ✅ Already correct — no change                    |
| 3   | `utils/orchestration/__tests__/performance.test.ts`   | `../../../contracts/AgentTrace`         | ✅ Already correct — no change                    |
| 4   | `hooks/post/AgentTraceHook.ts`                        | `../../contracts/AgentTrace`            | ✅ Already correct — no change                    |
| 5   | `services/orchestration/OrchestrationService.ts`      | `./types`                               | 🔄 Re-export covers this (no change needed)       |
| 6   | `core/tools/SelectActiveIntent.ts`                    | `../../services/orchestration/types`    | 🔄 Re-export covers this (or update to contracts) |
| 7   | `core/state/StateMachine.ts`                          | `../../services/orchestration/types`    | 🔄 Re-export covers this (or update to contracts) |
| 8   | `core/prompts/sections/intent-handshake.ts`           | `../../../services/orchestration/types` | 🔄 Re-export covers this (or update to contracts) |
