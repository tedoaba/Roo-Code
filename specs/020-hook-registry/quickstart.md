# Quickstart: HookRegistry Integration

**Feature**: [spec.md](../spec.md)  
**Task ID**: REQ-ARCH-020

## Developer Guide

### 1. Registering a Pre-Hook

To block or validate a tool call:

```typescript
import { HookRegistry } from "./engine/HookRegistry"

const myHook = {
	id: "my-validator",
	priority: 50,
	execute: async (req, engine) => {
		if (req.toolName === "forbidden") {
			return { action: "DENY", reason: "Tool is forbidden" }
		}
		return { action: "CONTINUE" }
	},
}

hookRegistry.register("PRE", myHook)
```

### 2. Registering a Post-Hook

To log or analyze results (errors are isolated):

```typescript
const myLogger = {
	id: "my-logger",
	execute: async (result, engine) => {
		console.log(`Tool ${result.toolName} finished with success: ${result.success}`)
	},
}

hookRegistry.register("POST", myLogger)
```

### 3. Usage in HookEngine

The `HookEngine` now delegates its monolithic methods:

```typescript
// Inside HookEngine.ts
async preToolUse(req: ToolRequest): Promise<HookResponse> {
  return this.registry.executePre(req, this);
}
```
