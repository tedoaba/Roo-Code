# Quickstart: Pre-LLM Context Compaction Wiring

**Feature**: 015-prellm-compaction-wiring  
**Date**: 2026-02-20

## What This Feature Does

Wires the existing `HookEngine.preLLMRequest()` into the Task's LLM loop so that context compaction runs automatically before every LLM API call. Long-running intents (20+ tool executions) get a compacted summary prepended to the system prompt, preventing context window overflow.

## Single Change Summary

**One file changed**: `src/core/task/Task.ts` — inside `attemptApiRequest()`, add ~10 lines between `getSystemPrompt()` and `createMessage()`.

## Implementation Steps

### 1. Add preLLMRequest() call in attemptApiRequest()

In `src/core/task/Task.ts`, locate `attemptApiRequest()` (line ~4014). After `systemPrompt` is built (line 4046), add:

```typescript
// Context compaction (Law 3.1.6 / Invariant 2)
let effectiveSystemPrompt = systemPrompt
try {
	if (this.hookEngine) {
		const compaction = await this.hookEngine.preLLMRequest(this.activeIntentId)
		if (compaction && compaction.length > 0) {
			effectiveSystemPrompt = compaction + "\n\n" + systemPrompt
		}
	}
} catch (error) {
	console.error(`[Task#${this.taskId}] preLLMRequest failed for intent ${this.activeIntentId}:`, error)
	// Fall through with original systemPrompt
}
```

### 2. Update createMessage() call to use effectiveSystemPrompt

Change line 4307-4308 from:

```typescript
const stream = this.api.createMessage(
    systemPrompt,
```

To:

```typescript
const stream = this.api.createMessage(
    effectiveSystemPrompt,
```

### 3. Also update the context management systemPrompt reference

The `manageContext()` call at line 4151 uses `systemPrompt` for context window calculations. This should continue using the original `systemPrompt` (not the compacted one) to avoid double-counting. No change needed here — the variable separation handles this automatically.

## Verification

```bash
# Run existing tests to verify no regressions
npx vitest run src/core/task/__tests__/Task.spec.ts

# Run all tests
npx vitest run
```

## Key Design Decisions

1. **Prepend to system prompt** — compaction summary goes before the existing system prompt
2. **Decorator Pattern** — single boundary call, no changes to HookEngine or PreCompactHook
3. **Defense-in-depth error handling** — outer try/catch even though preLLMRequest has internal handling
4. **Variable separation** — `effectiveSystemPrompt` keeps original `systemPrompt` intact for context management
