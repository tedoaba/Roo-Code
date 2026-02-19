# Roo-Code Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-18

## Active Technologies

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

- 006-post-write-trace-hook: Added TypeScript 5.x + VS Code Extension API (`vscode`), Node.js `fs`/`crypto` (for hashing and file ops)

- 005-content-hashing: Added TypeScript 5.8+ (Node.js 20.x runtime) + Node.js `crypto` module (built-in)

- 004-mutation-classifier: Added TypeScript 5.x + `typescript` (AST parser), `ts-morph` (optional, for easier AST traversal) or native TS Compiler API.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
