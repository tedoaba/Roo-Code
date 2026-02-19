# Research: Hook Middleware & Security Boundary

## 1. Analysis of Current Tool Execution Loop

- **Location**: `src/core/assistant-message/presentAssistantMessage.ts` manages the sequential execution of tools as they arrive from the LLM (streaming or complete).
- **Current Hooking**: It currently imports `IntentGateHook` and calls `validateToolCall`.
- **HookEngine State**: `src/hooks/HookEngine.ts` exists and is instantiated in `Task.ts`, but its methods (`preToolUse`, `postToolUse`) are not currently called by the primary execution loop.
- **Inconsistency**: There is a split between `IntentGateHook` (active) and `HookEngine` (dormant). These must be unified to fulfill **Invariant 2** ("sole execution gateway").

## 2. UI-Blocking Mechanism

- **Current State**: Tools like `writeToFileTool` use an `askApproval` callback which calls `cline.ask("tool", ...)`.
- **Gap**: The Hook Engine needs to trigger this _before_ the tool's `handle` method is even called, or provide the policy for it.
- **Proposed Approach**:
    - `HookEngine.preToolUse` should return a response indicating if approval is required.
    - `presentAssistantMessage` will handle the `cline.ask` if the hook says it's "Destructive".
    - This keeps the UI logic (VS Code messages/prompts) in the orchestration layer while the policy stays in the Hook Engine.

## 3. Command Classification (Safe vs. Destructive)

Based on the specification:

- **Destructive**: `write_to_file`, `apply_diff`, `edit`, `search_and_replace`, `search_replace`, `edit_file`, `apply_patch`, `execute_command`, `delete_file`, `new_task`.
- **Safe**: `read_file`, `list_files`, `list_code_definition_names`, `search_files`, `codebase_search`, `ask_followup_question`.

## 4. `.intentignore` Enforcement

- **Library**: The project already depends on `ignore` for `.rooignore`.
- **Implementation**: `OrchestrationService` should load `.intentignore` from the workspace root and apply it in `validateScope`.
- **Precedence**: `.intentignore` MUST take precedence over `owned_scope` (Additive Override).

## 5. Standardized Recovery (JSON Errors)

- **Requirement**: If a tool is rejected or out of scope, the LLM must receive a structured error it can parse and act upon.
- **Format**:
    ```json
    {
    	"error": "Scope Violation",
    	"details": "REQ-001 is not authorized to edit [filename]. Request scope expansion.",
    	"recovery_hint": "Cite a different file or use 'select_active_intent' to expand scope."
    }
    ```
- **Implementation**: `presentAssistantMessage` will use `formatResponse.toolError` with this JSON string.

## 6. Known Technical Unknowns

- **Concurrent Execution**: How to handle parallel tool calls that hit the hook engine? (The current loop is sequential in `presentAssistantMessage`, so concurrency is handled at the loop level).
- **Sticky Approvals**: Spec says NO sticky approvals. Each call triggers a UI prompt. This might be annoying for users but is the requested security boundary.
