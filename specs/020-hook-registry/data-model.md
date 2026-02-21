# Data Model: HookRegistry

**Feature**: [spec.md](../spec.md)  
**Task ID**: REQ-ARCH-020

## Entities

### HookRegistry

Central controller for lifecycle management and execution orchestration.

- **Attributes**:
    - `preHooks`: `Map<string, IPreHook>` (Stored by ID)
    - `postHooks`: `Map<string, IPostHook>` (Stored by ID)
    - `sortedPreIds`: `string[]` (Ordered by priority)

### IPreHook

Interface for hooks running BEFORE tool execution.

- **Attributes**:
    - `id`: `string` (Unique identifier)
    - `priority`: `number` (Default: 100)
- **Methods**:
    - `execute(req: ToolRequest, engine: HookEngine): Promise<HookResponse>`

### IPostHook

Interface for hooks running AFTER tool execution.

- **Attributes**:
    - `id`: `string`
- **Methods**:
    - `execute(result: ToolResult, engine: HookEngine, requestId?: string): Promise<void>`

## State Transitions (Execution Flow)

### executePre(req)

1. Get `sortedPreIds`.
2. For each `hookId`:
   a. Call `hook.execute()`.
   b. If response action is `DENY` or `HALT`: **return immediately**.
3. Return `CONTINUE` if all finish.

### executePost(result)

1. For each `hook` in `postHooks`:
   a. Wrap in `try/catch`.
   b. Call `hook.execute()`.
   c. On error: log to console/ledger but DO NOT propagate.
2. Return `void`.
