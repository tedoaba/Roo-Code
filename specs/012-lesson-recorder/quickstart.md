# Quickstart: Automated Lessons Learned Recorder

## Purpose

This tool allows AI agents to record and "remember" failures, preventing the same mistakes from occurring across sessions.

## Recording a Lesson

When a verification step (like a test or linting) fails, you should follow this flow:

1.  **Analyze** the failure and fix it.
2.  **Verify** the fix passes.
3.  **Execute** the record command:

```bash
# Example CLI usage
tsx src/cli/record-lesson.ts \
  --type "LINT" \
  --file "src/core/Manager.ts" \
  --error "Missing semicolon" \
  --cause "Forgot to add semicolon after variable declaration" \
  --resolution "Added the missing semicolon" \
  --rule "Always verify semicolon presence in TypeScript files"
```

## How it Works

1.  **Section Detection**: The tool looks for a `## Lessons Learned` header in `AGENT.md`. If it's missing, it's created at the end of the file.
2.  **Deduplication**: The tool hashes the file path and the error summary. If an entry with the same hash already exists, the new entry is skipped to prevent clutter.
3.  **Atomic Append**: Uses file locking to ensure that if multiple lessons are being recorded simultaneously (e.g., in parallel turns), no data is lost.

## Viewing Lessons

You can view the historical knowledge by reading `AGENT.md`:

```bash
cat AGENT.md
```

The AI agent is also configured to automatically review recent lessons during the "Reasoning Intercept" phase to avoid repeating known mistakes.
