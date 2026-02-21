# Research: HookRegistry Dynamic Plugin System

**Feature**: [spec.md](../spec.md)  
**Task ID**: REQ-ARCH-020

## Unknowns & Investigations

### Investigation 1: Extraction of Inline Hook Logic

**Unknown**: HookEngine currently handles mutation logging and general trace logging inline within `postToolUse()`.
**Decision**: Extract mutation logging into `src/hooks/post/MutationLogHook.ts` and general trace logging into `src/hooks/post/GeneralTraceHook.ts`.
**Rationale**: Adheres to the directive to make HookEngine lean and delegate all logic to the registry. Keeps the "built-in" hooks in the same directory as external/plugin hooks.
**Alternatives considered**: Keeping them inline as "core" logic. Rejected because it violates the Open/Closed Principle goals for this refactor.

### Investigation 2: IHook Interface Design

**Unknown**: How to standardize different hook signatures (Pre vs Post) into a single registry.
**Decision**:

- Define `IHook<TIn, TOut>` or specific `IPreHook` and `IPostHook` interfaces.
- `IPreHook` execute method: `(req: ToolRequest, context: HookEngine) => Promise<HookResponse>`
- `IPostHook` execute method: `(result: ToolResult, requestId?: string) => Promise<void>`
  **Rationale**: Allows the registry to store them in typed buckets while providing enough context (e.g., passing `HookEngine` instance) to hooks that need it.
  **Alternatives considered**: A single `IHook` with optional args. Rejected as it loses type safety for execution results.

### Investigation 3: Priority Ordering Strategy

**Unknown**: Default priorities for existing hooks.
**Decision**:

- Fail-Safe (Orchestration Healthy): 1
- State Check (StateMachine): 2
- Traceability (Intent ID check): 10
- Concurrency (Optimistic Lock): 20
- Scope Enforcement: 30
- Budget Check: 40
- Circuit Breaker: 50
  **Rationale**: Critical health checks must run first. State checks follow. Security/Traceability before expensive operations. Budget and Circuit Breaker can run later as they are "safety valves".
  **Alternatives considered**: All equal priority. Rejected because Law 3.2.1 and Invariant 8 require specific precedence.

## Best Practices & Patterns

### Pattern: Middleware / Plugin System

- Use a `Map<string, IHook>` for O(1) lookups and deregistration.
- Maintain a sorted array for execution to avoid sorting on every request.
- Use `try/catch` in the registry's `executePost` to enforce error isolation requirements.

### Best Practice: Dependency Injection

- Hooks should be passed their dependencies (like `OrchestrationService`) during construction, but the registry `execute` methods should pass transient state (like `ToolRequest`) to keep hooks stateless where possible.
