# Research: Relaxed Handshake Analysis

## Decision Log

### Decision: Relocate `COMMAND_CLASSIFICATION`

- **Decision**: Move `COMMAND_CLASSIFICATION` from `HookEngine.ts` to `src/services/orchestration/types.ts`.
- **Rationale**: `HookEngine` depends on `StateMachine`, and the request requires `StateMachine` to use `COMMAND_CLASSIFICATION`. Moving it to the types file (where `CommandClassification` type is already defined) prevents circular dependencies.
- **Alternatives considered**: Passing classification as an argument to `isToolAllowed`. Rejected because other parts of the system (like `build-tools.ts`) also need access to this classification mapping, and a centralized constant is cleaner.

### Decision: StateMachine.isToolAllowed Update

- **Decision**: Modify `isToolAllowed` to check the classification.
- **Rationale**: This allows us to maintain the three-state flow (Invariant 9) while permitting `SAFE` tools in `REASONING` and `REQUEST` states.
- **Invariants**: `DESTRUCTIVE` tools will still return `allowed: false` unless the state is `ACTION`.

### Decision: build-tools.ts Filtering

- **Decision**: Update `buildNativeToolsArrayWithRestrictions` to filter for `SAFE` tools when `options.isIntentActive` is false.
- **Rationale**: This ensures the model only sees and calls allowed tools during the handshake, preventing "State Violation" errors before they happen.

## Implementation Details

### circular Dependency Resolution

- Target: `src/services/orchestration/types.ts`
- Move `COMMAND_CLASSIFICATION` constant here.
- Update `HookEngine.ts` to import it from here.
- Update `StateMachine.ts` to import it from here.

### StateMachine.ts logic

```typescript
isToolAllowed(toolName: string): { allowed: boolean; reason?: string } {
    const classification = COMMAND_CLASSIFICATION[toolName] || "DESTRUCTIVE";

    // SAFE tools are always allowed to facilitate analysis and task completion
    if (classification === "SAFE") {
        return { allowed: true };
    }

    switch (this.currentState) {
        case "REQUEST":
        case "REASONING":
            // Only select_active_intent is allowed for non-SAFE tools (though it is SAFE itself)
            if (toolName === "select_active_intent") {
                return { allowed: true }
            }
            return {
                allowed: false,
                reason: `State Violation: Intent Handshake required for DESTRUCTIVE actions. Call 'select_active_intent' first.`
            }
        case "ACTION":
            return { allowed: true };
        default:
            return { allowed: false, reason: `Unknown state: ${this.currentState}` }
    }
}
```

### build-tools.ts logic

```typescript
// Enforcement Hook: If no intent is active, only allow SAFE tools
if (options.isIntentActive === false) {
	filteredTools = filteredTools.filter((tool) => {
		const name = getToolName(tool)
		return COMMAND_CLASSIFICATION[name] === "SAFE"
	})
}
```
