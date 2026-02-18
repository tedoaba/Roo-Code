# Research: Intent Handshake Implementation & Hook Engine

**Feature**: The Handshake (Reasoning Loop Implementation)
**Status**: Updated 2026-02-18

## Findings

### 1. Hook Engine Architecture (Middleware Pattern)

- **Decision**: Adopt a formal **Middleware Pattern** for tool and request interception. Implement a dedicated `HookEngine.ts`.
- **Rationale**: Direct modification of `Task.ts` for every governance rule (SHA-256, Scope, State) creates "Hook Spaghetti." A central engine with `pre/post` lifecycle stages is more maintainable and aligns with Invariant 2.
- **Implementation**: `Task.ts` will call `HookEngine.preToolUse()` and `HookEngine.postToolUse()` around its execution logic.

### 2. Cryptographic Performance (SHA-256)

- **Decision**: Use Node.js native `crypto` module for hashing.
- **Rationale**: SHA-256 is extremely fast for code-sized blocks (microseconds). No performance impact on the loop is expected. Content hashing ensures spatial independence (Law 3.3.3).

### 3. Three-State State Machine

- **Decision**: Explicitly model the States: `REQUEST` (1) -> `REASONING` (2) -> `ACTION` (3).
- **Rationale**: Required to enforce Law 4.1 (Least Privilege). Tool filtering must be state-aware.
- **Findings**: The VS Code tool restriction mechanism works reliably by omitting restricted tools from the `tools` array passed to the LLM during State 2.

### 4. Context Compaction (PreCompact)

- **Decision**: Implement a summarization hook that runs before the LLM request.
- **Rationale**: Prevents "Context Rot" (Law 3.1.6). Long-running tasks with many small mutations quickly fill the context window. Summarizing the audit ledger entries for the current intent keeps the prompt lean.

## Conclusion

The transition to a formal **Hook Engine** simplifies governance enforcement and provides a scalable foundation for future laws and invariants.
