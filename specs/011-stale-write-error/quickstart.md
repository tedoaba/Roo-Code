# Quickstart: Stale File Error Protocol

## 1. Overview

The Stale File Error Protocol strictly outputs a machine-readable JSON structure anytime an OptimisticGuard detects a `STALE_FILE` condition on a file rewrite. It ensures mutations aren't accidentally applied over someone else's unseen changes.

## 2. Testing Constraints Manually

When writing unit tests or invoking `HookEngine`:

```typescript
// Rejection generates stringified JSON format
{
  "error_type": "STALE_FILE",
  "file_path": "/absolute/path/to/conflict",
  "expected_hash": "e3b0c44...",
  "actual_hash": "a4f783c...",
  "resolution": "RE_READ_REQUIRED"
}
```

If the file was deleted concurrently, `actual_hash` outputs `"DELETED"`.

## 3. Auditing Conflicts

Every time a `STALE_FILE` error occurs, a new ledger entry is added to `.orchestration/agent_trace.jsonl` noting the attempt and rejection, preventing stealth manipulation.
