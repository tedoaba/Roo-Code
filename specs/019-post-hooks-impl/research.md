# Phase 0: Outline & Research

## Overview

This document captures the final design decisions for the three missing post-hooks. All ambiguities were resolved during the `/speckit.clarify` phase prior to implementation planning. Therefore, this research summarizes the chosen approach for each hook.

## Research Findings & Decisions

### 1. Intent Progress Evaluation

- **Unknown/Clarified**: How to programmatically determine if an intent's acceptance criteria have been met based on tool execution history.
- **Decision**: Use simple string/substring matching of trace entries against the verbatim acceptance criteria.
- **Rationale**: Keeps the agent loop lightweight and fast, without introducing LLM cost or latency inside the core runtime's state machine. Simple strings generated from known outputs (`jest`, `tsc`, `lint`, etc.) typically map cleanly to defined acceptance boundaries.
- **Alternatives Considered**: Using an LLM-based semantic evaluator. Rejected due to cost, latency, and non-determinism during automated transitions.

### 2. Scope Boundary Calculation

- **Unknown/Clarified**: How to define "near the boundary" algorithmically without complex heuristics.
- **Decision**: Define the boundary as the parent directory (`dirname(path)`) of any explicitly mapped scope path from the intent.
- **Rationale**: Highly deterministic, easily verifiable, and directly maps to the `path` and `fs` modules in Node.js. Provides a clear one-level blast radius.
- **Alternatives Considered**: Two directories up, or the workspace root. Rejected for being either too broad or too restrictive.

### 3. SharedBrain Governance Integration

- **Unknown/Clarified**: The mechanism for storing governance lessons reliably without blocking or competing with other hooks.
- **Decision**: Utilize the existing `LessonRecorder.ts` and its `recordWithRetry` capability, similar to the `VerificationFailureHook`.
- **Rationale**: Precedent and architecture dictates using the atomic append logic that `LessonRecorder` implements. Reusing it ensures consistency in format and limits new bug surfaces.
- **Alternatives Considered**: Writing directly using `fs.appendFile` via OrchestrationService. Rejected due to the potential for concurrent state tearing which the `LessonRecorder` handles explicitly.

### 4. Hook Engine Registration

- **Unknown/Clarified**: Where in the lifecycle to bolt these new hooks.
- **Decision**: Explicit instantiation in `HookEngine.postToolUse`, shielded by `try/catch` and running concurrently or in sequence as side-effects.
- **Rationale**: Ensures the tool execution itself always returns its original result, obeying the constraint that hooks must fail gracefully and not disrupt the core execution cycle.
