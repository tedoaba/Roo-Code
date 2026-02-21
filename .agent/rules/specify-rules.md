# Roo-Code Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-18

## Active Technologies

- TypeScript (Node.js) + OrchestrationService, StateMachine (020-hook-registry)
- N/A (In-memory registry) (020-hook-registry)

- TypeScript / Node.js + None new required (uses existing HookEngine structure and OrchestrationService). (019-post-hooks-impl)
- `.orchestration/` directory (agent_trace.jsonl, AGENT.md, active_intents.yaml, intent_map.md) (019-post-hooks-impl)

- TypeScript 5.x (VS Code extension, Node.js runtime) + VS Code Extension API, Node.js `fs/promises`, `crypto` (randomUUID, SHA-256) (018-trace-schema-evolution)

- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (017-sidecar-model-alignment)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (017-sidecar-model-alignment)
- TypeScript + `js-yaml`, `fs/promises`, `vscode`, `minimatch` (017-sidecar-model-alignment)
- Filesystem-based sidecar (`.orchestration/` directory) (017-sidecar-model-alignment)

- N/A (Stateless functional filtering based on existing state) (016-proactive-tool-filtering)

- TypeScript 5.x (VS Code extension) + Anthropic SDK, OpenAI types, vscode API (015-prellm-compaction-wiring)
- `.orchestration/` sidecar directory (JSONL, YAML) (015-prellm-compaction-wiring)

- TypeScript / Node.js + VS Code Extension API, Orchestration Service, State Machine, Hook Engine (014-relaxed-handshake-analysis)
- `.orchestration/` (Sidecar data model) (014-relaxed-handshake-analysis)

- TypeScript / Node.js 20+ + Node.js `fs`, `path`, `crypto`. Existing `LessonRecorder`. (013-verification-failure-hook)
- Append-only markdown (`AGENT.md`, `.lessons/`). (013-verification-failure-hook)

- TypeScript / Node.js (v20+) + `node:fs`, `node:path`, `node:crypto` (for hashing/de-duplication) (012-lesson-recorder)
- Flat file (`AGENT.md`) with structured Markdown blocks. (012-lesson-recorder)

- TypeScript (Node.js/VSCode Extension context) + `HookEngine`, `AgentTraceHook`, generic `vscode` FS APIs. (011-stale-write-error)
- Agent Trace Ledger (`.orchestration/agent_trace.jsonl`) for audit logs. (011-stale-write-error)

- TypeScript 5.0+ + `fs/promises`, SHA-256 Utility (`src/utils/hashing.ts`) (010-turn-hash-snapshot)
- In-memory `Map<string, string | Promise<string | null>>` (010-turn-hash-snapshot)

- TypeScript 5.x + `crypto` (standard library), `HookEngine`, `LedgerManager`. (009-optimistic-locking-guard)
- In-memory `TurnContext` (transient) for baseline hashes; `.orchestration/agent_trace.jsonl` (persistent) for audit records. (009-optimistic-locking-guard)

- TypeScript 5.x + None (built-in orchestration hooks) (008-req-id-trace-injection)
- Append-only JSONL (`.orchestration/agent_trace.jsonl`) (008-req-id-trace-injection)

- TypeScript (Node.js 18+) + Node.js `fs/promises`, `crypto` (for SHA-256 hashing) (007-agent-trace-ledger)
- Append-only JSONL file (`.orchestration/agent_trace.jsonl`) (007-agent-trace-ledger)

- TypeScript 5.x + VS Code Extension API (`vscode`), Node.js `fs`/`crypto` (for hashing and file ops) (006-post-write-trace-hook)
- Local File System, `.orchestration/agent_trace.jsonl` (006-post-write-trace-hook)

- TypeScript 5.8+ (Node.js 20.x runtime) + Node.js `crypto` module (built-in) (005-content-hashing)
- N/A (Pure stateless utility) (005-content-hashing)

- TypeScript 5.x + `typescript` (AST parser), `ts-morph` (optional, for easier AST traversal) or native TS Compiler API. (004-mutation-classifier)
- N/A (Stateless library) (004-mutation-classifier)

- TypeScript + VS Code API, Anthropic SDK (for blocks/types), @roo-code/types (003-enforce-intent-metadata)
- Filesystem (via `fs/promises` and `Task`/`diffViewProvider`) (003-enforce-intent-metadata)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for

## Code Style

General: Follow standard conventions

## Recent Changes

- 020-hook-registry: Added TypeScript (Node.js) + OrchestrationService, StateMachine
- 020-hook-registry: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

- 019-post-hooks-impl: Added TypeScript / Node.js + None new required (uses existing HookEngine structure and OrchestrationService).

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
