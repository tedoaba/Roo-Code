# Quickstart: Verification Failure Detection Hook

## Overview

This feature automatically captures and records verification failures (Linting, Tests) into the project's lessons learned ledger (`AGENT.md`). It ensures that every recurring mistake provides immediate feedback and a traceable history for improvement.

## How it Works

1. **Background Monitoring**: Every time you run a command like `npm test` or `eslint`, the system monitors the exit code.
2. **Automatic Capture**: If the command fails (exit code 1+), the system immediately extracts the error message and the files that caused it.
3. **Ledger Update**: A new entry is appended to the "Lessons Learned" section in `AGENT.md`.
4. **Zero Config**: No setup is required. The system is hardcoded to recognize standard tools.

## Example Scenario

### 1. You run a failing test

```bash
npm test
```

### 2. Output shows a failure

```text
FAIL src/utils/math.test.ts
  ● addition > should add two numbers
    Expected: 5
    Received: 4
Exit code: 1
```

### 3. Automatic Ledger Entry

The system will automatically add this to `AGENT.md`:

```markdown
- [2026-02-20T17:25:00Z] **Failure Type:** TEST <!-- sig: ab12... -->
    - **File:** `src/utils/math.test.ts`
    - **Error Summary:** FAIL src/utils/math.test.ts Addition failed: Expected 5, Received 4
    - **Cause:**
    - **Resolution:**
    - **Corrective Rule:**
```

## Supported Tools

- **Linters**: `eslint`, `npm run lint`
- **Test Runners**: `jest`, `vitest`, `npm test`

## Safety Features

- **Non-Blocking**: The recording happens in the background. It will never slow down or crash your tool execution.
- **De-duplication**: If the same error happens multiple times within the same turn or across turns, only the first occurrence is recorded to keep the ledger clean.
