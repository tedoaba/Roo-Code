// --- Engine (Hook Execution Gateway) ---
export { HookEngine } from "./engine/HookEngine"
export type { ToolRequest, ToolResult } from "./engine/HookEngine"
export { HookRegistry } from "./engine/HookRegistry"
export type { HookMetadata } from "./engine/HookRegistry"

// --- State (Governance & Orchestration) ---
export { StateMachine } from "./state/StateMachine"
export { TurnContext } from "./state/TurnContext"
export { OrchestrationService } from "./state/OrchestrationService"
export { LedgerManager } from "./state/LedgerManager"
export type { ITurnContext, OptimisticLockResult } from "./state/types"

// --- Lessons (Automated Learning) ---
export { LessonRecorder } from "./state/lessons/LessonRecorder"
export { LessonRetriever } from "./state/lessons/LessonRetriever"
export { LockManager as LessonLockManager } from "./state/lessons/LockManager"
export { Deduplicator as LessonDeduplicator } from "./state/lessons/Deduplicator"
export type { Lesson, LessonType } from "./state/lessons/types"

// --- Tools (Governance-Enabled Capability) ---
export { SelectActiveIntentTool, selectActiveIntentTool } from "./tools/SelectActiveIntentTool"

// --- Contracts (Shared Interfaces) ---
export type { AgentTraceEntry, ExecutionState, Contributor, ILedgerManager } from "./contracts/AgentTrace"

// --- Errors (Governance Violations) ---
export { TraceabilityError } from "./errors/TraceabilityError"
export { StaleWriteError } from "./errors/StaleWriteError"
export type { StaleFileErrorPayload } from "./errors/StaleWriteError"

// --- Pre-Hooks (Validation & Enforcement) ---
export { FailSafeHook } from "./pre/FailSafeHook"
export { StateCheckHook } from "./pre/StateCheckHook"
export { TraceabilityHook } from "./pre/TraceabilityHook"
export { ConcurrencyHook } from "./pre/ConcurrencyHook"
export { ScopeEnforcementHook } from "./pre/ScopeEnforcementHook"
export { BudgetHook } from "./pre/BudgetHook"
export { CircuitBreakerHook } from "./pre/CircuitBreakerHook"
export { IntentGateHook } from "./pre/IntentGateHook"
export { ContextEnrichmentHook } from "./pre/ContextEnrichmentHook"
export { PreCompactHook } from "./pre/PreCompactHook"

// --- Post-Hooks (Side-Effects & Monitoring) ---
export { MutationLogHook } from "./post/MutationLogHook"
export { TurnContextHook } from "./post/TurnContextHook"
export { GeneralTraceHook } from "./post/GeneralTraceHook"
export { ReadFileBaselineHook } from "./post/ReadFileBaselineHook"
export { AgentTraceHook } from "./post/AgentTraceHook"
export { VerificationFailureHook } from "./post/VerificationFailureHook"
export { IntentProgressHook } from "./post/IntentProgressHook"
export { ScopeDriftDetectionHook } from "./post/ScopeDriftDetectionHook"
export { SharedBrainHook } from "./post/SharedBrainHook"
export { AuditHook } from "./post/AuditHook"
