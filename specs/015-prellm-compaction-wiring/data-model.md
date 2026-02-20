# Data Model: Pre-LLM Context Compaction Wiring

**Feature**: 015-prellm-compaction-wiring  
**Date**: 2026-02-20

## Overview

This feature introduces no new data entities. It wires existing components together. This document catalogs the existing data structures involved in the wiring.

## Existing Entities (No Changes)

### Task (src/core/task/Task.ts)

The core LLM orchestration unit. Relevant fields for this feature:

| Field                  | Type                   | Access            | Line | Purpose                                                         |
| ---------------------- | ---------------------- | ----------------- | ---- | --------------------------------------------------------------- |
| `hookEngine`           | `HookEngine`           | `public readonly` | 350  | Provides access to `preLLMRequest()`                            |
| `activeIntentId`       | `string \| undefined`  | `public`          | 351  | Passed to `preLLMRequest()` as the intent identifier            |
| `orchestrationService` | `OrchestrationService` | `public readonly` | 347  | Underlying service used by HookEngine (no direct access needed) |

### HookEngine.preLLMRequest() (src/hooks/HookEngine.ts:432-456)

| Parameter   | Type                      | Description                                                |
| ----------- | ------------------------- | ---------------------------------------------------------- |
| `intentId`  | `string \| undefined`     | The active intent ID; returns null if undefined            |
| **Returns** | `Promise<string \| null>` | Compacted summary string, or null if compaction not needed |

**Internal logic**:

1. Returns null if `intentId` is falsy
2. Fetches intent context via `orchestrationService.getIntentContext(intentId)`
3. Returns null if context missing or history < 20 entries
4. Builds a formatted summary of the last 20 history actions
5. Returns the summary string
6. Catches all errors internally, returns null

### PreCompactHook.compact() (src/hooks/pre/PreCompactHook.ts:27-78)

| Parameter   | Type                      | Description                                                                         |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------- |
| `intentId`  | `string`                  | The active intent ID (required, non-null)                                           |
| **Returns** | `Promise<string \| null>` | Detailed compaction summary with tool usage, file mutations, success/failure counts |

**Threshold**: `maxHistoryBeforeCompaction = 20`

## Data Flow

```
Task.attemptApiRequest()
  │
  ├─ systemPrompt = await this.getSystemPrompt()    // L4046
  │
  ├─ compaction = await this.hookEngine              // NEW: ~L4047
  │       .preLLMRequest(this.activeIntentId)
  │
  ├─ if (compaction) {                               // NEW
  │     effectiveSystemPrompt = compaction + "\n\n" + systemPrompt
  │   } else {
  │     effectiveSystemPrompt = systemPrompt
  │   }
  │
  └─ this.api.createMessage(                         // L4307
         effectiveSystemPrompt,                      // CHANGED: was systemPrompt
         cleanConversationHistory,
         metadata
       )
```

## State Transitions

No new state transitions. The compaction hook runs within the existing ACTION state when `preLLMRequest()` is called, and within REASONING state it gracefully returns null due to `activeIntentId` being undefined.
