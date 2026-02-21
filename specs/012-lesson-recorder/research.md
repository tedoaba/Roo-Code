# Research: Automated Lessons Learned Recorder

## Unknowns & Research Tasks

### 1. Atomic Append & Concurrency Handling

- **Task**: Identify the best practices for atomic appends in Node.js to a shared Markdown file.
- **Context**: Multiple agents might fail simultaneously. We need to prevent race conditions and partial writes.
- **Candidate Solutions**: `fs.appendFile` (thread-safe but not process-safe?), `proper-lockfile`, or a lock-free append-only log strategy.

### 2. Failure Signature for De-duplication

- **Task**: Define the data points that constitute a "unique" failure to prevent duplicate logs.
- **Context**: A linter might report the same error in the same file multiple times.
- **Decision Needed**: Should we use [File Path + Error Message], [File Path + Error Code], or include Line Numbers? (Line numbers change frequently, making them poor for long-term de-duplication).

### 3. Partial File Updates (Inserting into Section)

- **Task**: Research efficient ways to append to a specific section in a potentially large Markdown file without full rewrites.
- **Context**: `AGENT.md` is a living document. We need to find the "## Lessons Learned" header (or create it) and append there.
- **Approach**: Stream reading until header, then append? Or just append to the end of the file if the section is guaranteed to be at the bottom?

### 4. Integration with existing Hook Engine

- **Task**: Determine if this should be a `PostToolUse` hook in the current middleware system.
- **Context**: If a command-line tool fails, the hook should detect the non-zero exit code and initiate the recording flow.

## Findings

### 1. Atomic Append & Concurrency

- **Decision**: Use `fs.appendFileSync` for simple cases, but wrap in a file-locking mechanism using a lockfile (e.g., `AGENT.md.lock`) for cross-process safety.
- **Rationale**: `appendFile` is atomic at the OS level for small writes (< PIPE_BUF), but Markdown entries might exceed this. A lockfile ensures only one process writes at a time.
- **Alternatives**: Database (rejected - too heavy for this repo); Log rotation (rejected - we want a single `AGENT.md`).

### 2. Failure Signature

- **Decision**: Hash of `[normalized_file_path + error_summary_truncated]`.
- **Rationale**: File path provides location; truncated error summary (e.g., first 100 chars) captures the essence. Ignoring line numbers prevents "noise" entries when code moves.
- **Alternatives**: Full error log hash (too sensitive to minor output changes like time/IDs).

### 3. Section Management

- **Decision**: If `AGENT.md` is small, `readFile` + `replace` + `writeFile`. If large, identify offset of "## Lessons Learned" and use `fs.write` at that offset.
- **Refined Requirement**: For simplicity and robustness, we will always append to the **end of the file**. If "## Lessons Learned" isn't the last section, we will search for it, but the spec says "Append only. Never overwrite prior lessons," which is easiest at the EOF.

### 4. Integration

- **Decision**: Implement as a standalone CLI tool `bin/record-lesson`. The AI agent will be instructed to call this tool manually after a failure is resolved, as it needs to provide the "Resolution" and "Corrective Rule" (which only the AI knows).
- **Rationale**: Direct hook integration is hard because the hook doesn't know the "Cause" or "Resolution" without AI analysis.
