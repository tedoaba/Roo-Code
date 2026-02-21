# Quickstart: REQ-ID Trace Injection

## 1. Overview

The REQ-ID Injection Enforcement guarantees explicit requirement-level accountability for every single destructive mutation. The orchestration layer blocks operations where a requirement identifier (`REQ-ID`) is missing, ensuring long-term code maintainability.

## 2. Testing the Execution Gateway

You can verify the pre-execution blockade by submitting a malformed or missing REQ-ID to the `HookEngine`:

```typescript
import { HookEngine } from "src/hooks/HookEngine"

const req = {
	toolName: "write_to_file",
	params: { path: "hello.txt", content: "World" },
	intentId: "random-fix", // Invalid REQ-ID
}

try {
	await hookEngine.preToolUse(req)
} catch (err) {
	console.log(err.name) // TraceabilityError
	console.log(err.message) // Invalid REQ-ID format. Must start with 'REQ-'.
}
```

## 3. Auditing the Trace Ledger

Legitimate mutations successfully recorded by the system will have their related requirements explicitly documented within the context ledger:

```jsonl
{
	"timestamp": "2026-02-20T01:50:00Z",
	"agentId": "roo-code",
	"intentId": "REQ-001",
	"related": [
		"REQ-001"
	],
	"mutation": {
		"type": "write",
		"target": "hello.txt",
		"hash": "..."
	}
}
```
