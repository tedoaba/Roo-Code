# Feature Specification: Governance Isolation Boundary Enforcement

**Feature Branch**: `021-governance-isolation`  
**Created**: 2026-02-21  
**Status**: Complete  
**Task ID**: REQ-ARCH-021  
**Input**: User description: "Enforce the architectural principle that all governance logic lives in src/hooks/ by restructuring the directory to match the documented layout and relocating governance modules from forbidden directories into the src/hooks/ subtree."

## Clarifications

### Session 2026-02-21

- Q: Should `LessonRetriever.ts` (in `src/core/lessons/`) and `types.ts` (in `src/core/concurrency/`) — both unlisted in the original migration manifest — also be relocated to `src/hooks/`? → A: Yes, relocate all governance files: `LessonRetriever.ts` → `src/hooks/state/lessons/LessonRetriever.ts` and `concurrency/types.ts` → `src/hooks/state/types.ts`.
- Q: Should co-located test files (`__tests__/` in `src/core/state/`, `src/core/concurrency/`, `src/core/lessons/`, `src/utils/orchestration/`, `src/contracts/`) move alongside their governance modules into `src/hooks/` subdirectories, or stay in place? → A: Move tests alongside modules into `src/hooks/` `__tests__/` subdirectories to preserve co-location.
- Q: Should the spec define when re-export shims at old locations are removed (timeline, trigger, or never)? → A: Defer removal to a separate follow-up task. Re-export shims persist indefinitely until explicitly cleaned up in a future effort.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Governance Code Discoverability (Priority: P1)

As a developer looking for governance logic (state machine, concurrency controls, intent tools, lesson recording, traceability), I want all governance code to be located within `src/hooks/` and its subdirectories so that I can find, understand, and modify governance behavior without searching across `src/core/`, `src/services/`, `src/utils/`, and `src/errors/`.

**Why this priority**: This is the core value proposition. If governance code is scattered across the codebase, developers waste time searching and risk introducing inconsistencies. Centralizing governance code is the primary deliverable.

**Independent Test**: Can be fully tested by verifying that every governance module listed in the Architecture document §6.3 exists at its target path under `src/hooks/`, and that no governance-specific logic (beyond re-exports) remains in `src/core/`, `src/services/`, `src/utils/`, or `src/errors/`.

**Acceptance Scenarios**:

1. **Given** governance modules exist in forbidden directories (src/core/, src/services/, src/utils/, src/errors/), **When** the migration is complete, **Then** all governance modules reside in their §6.3-documented paths under `src/hooks/` (state/, tools/, prompts/, contracts/, errors/, engine/ subdirectories).
2. **Given** a developer opens the `src/hooks/` directory, **When** they browse the tree, **Then** the directory structure matches the layout specified in §6.3 of the Architecture document — including `engine/`, `pre/`, `post/`, `state/`, `tools/`, `prompts/`, `contracts/`, and `errors/` subdirectories.
3. **Given** a developer searches for `StateMachine.ts`, **When** they navigate the codebase, **Then** the canonical (non-re-export) implementation is found at `src/hooks/state/StateMachine.ts`.

---

### User Story 2 — Backward-Compatible Migration (Priority: P1)

As a developer working on the codebase during migration, I want old import paths to continue working via re-exports so that the codebase does not break at any intermediate step.

**Why this priority**: Equally critical to User Story 1 — a migration that breaks the build provides zero value and creates regression risk. The incremental approach with re-exports is the core safety mechanism.

**Independent Test**: Can be tested by running the full test suite after each individual module move and verifying all tests pass. Old import paths (e.g., `src/core/state/StateMachine`) should resolve to the same module via the re-export shim.

**Acceptance Scenarios**:

1. **Given** `StateMachine.ts` has been moved to `src/hooks/state/StateMachine.ts`, **When** existing code imports from `src/core/state/StateMachine`, **Then** the import resolves successfully via a re-export at the old location.
2. **Given** a re-export file exists at the old location, **When** a developer inspects it, **Then** it contains only a re-export statement and a `@deprecated` JSDoc tag pointing to the new canonical path.
3. **Given** all module moves are complete, **When** the full test suite runs, **Then** all existing tests pass without modification to test import paths (tests import from old paths and they continue to work).

---

### User Story 3 — Subdirectory Role Clarity (Priority: P2)

As a developer adding a new governance feature, I want clear subdirectory conventions within `src/hooks/` so that I know exactly which subdirectory to place my code in based on the feature's role (engine infrastructure, pre-tool checks, post-tool actions, state management, tool definitions, prompt sections, contracts, or errors).

**Why this priority**: Without clear conventions, the newly organized structure will degrade over time as developers place files arbitrarily. This story prevents future architectural drift.

**Independent Test**: Can be tested by verifying that the `src/hooks/index.ts` barrel export organizes exports by subdirectory, and that a developer guide (migration guide) documents which subdirectory to use for each category of governance logic.

**Acceptance Scenarios**:

1. **Given** a developer needs to add a new state management module, **When** they consult the migration guide, **Then** they are directed to `src/hooks/state/`.
2. **Given** a developer needs to add a new pre-tool-use check, **When** they consult the directory structure, **Then** the `src/hooks/pre/` directory contains all existing pre-hooks as exemplars.
3. **Given** a developer imports from `src/hooks/`, **When** they use the barrel export, **Then** the `index.ts` file exposes all public APIs organized by subdirectory namespace.

---

### User Story 4 — Lint Rule Enforcement Readiness (Priority: P3)

As a CI/CD pipeline maintainer, I want the codebase structured such that a lint rule can eventually enforce that `src/core/` and `src/api/` do not contain or import governance-specific modules directly, preventing future architectural drift.

**Why this priority**: This is a downstream benefit that depends on the migration being complete. It is not required for the initial migration but enables long-term enforcement.

**Independent Test**: Can be tested by verifying that after migration, `src/core/` files at old locations contain only re-export statements (no governance logic), and that a lint rule could be written to flag any governance imports within `src/core/` or `src/api/`.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** a static analysis tool scans `src/core/`, **Then** no governance-specific logic (state machines, concurrency guards, lesson recording, intent tools) exists — only re-export shims.
2. **Given** a future lint rule checks `src/core/` and `src/api/` for governance imports, **When** it runs, **Then** no violations are detected (all governance imports point to `src/hooks/`).

---

### Edge Cases

- What happens when a module being moved has circular dependencies with other modules in `src/core/`?
    - The re-export strategy breaks cycles: the moved module imports its dependencies from their canonical locations, and any circular reference is managed through the re-export shim at the old location.
- What happens when a module being moved is imported by test files using relative paths?
    - Co-located test files (`__tests__/` directories under the source module) move alongside their modules into the corresponding `src/hooks/` `__tests__/` subdirectory. Their import paths are updated to reference the new canonical location. External test files (e.g., integration tests in `src/hooks/__tests__/`) that import from old paths will continue to work via re-exports.
- What happens when two modules being moved depend on each other and are moved in separate increments?
    - Modules are moved in dependency order (types/contracts first, then state, then tools, then prompts). Each intermediate state is valid because re-exports ensure the not-yet-moved module can still import the already-moved module from its old path.
- What happens if the `src/hooks/index.ts` barrel export creates re-export conflicts with existing exports?
    - The barrel export should be updated incrementally, adding new exports as modules are moved. Name collisions should be resolved with explicit named exports.
- What happens when a file has both governance and non-governance logic mixed together?
    - The file should be refactored to separate governance logic from non-governance logic. The governance portion moves to `src/hooks/`, while the non-governance portion remains in place. If separation is impractical, the entire file moves and a re-export is left at the old location.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST create the following subdirectories under `src/hooks/` if they do not already exist: `engine/`, `state/`, `state/lessons/`, `tools/`, `prompts/`, `contracts/`, `errors/`.
- **FR-002**: The system MUST move `src/hooks/HookEngine.ts` into `src/hooks/engine/HookEngine.ts` and leave a re-export at the original location.
- **FR-003**: The system MUST move `src/core/state/StateMachine.ts` to `src/hooks/state/StateMachine.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-004**: The system MUST move `src/core/concurrency/TurnContext.ts` to `src/hooks/state/TurnContext.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-005**: The system MUST move `src/core/concurrency/OptimisticGuard.ts` to `src/hooks/state/OptimisticGuard.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-006**: The system MUST move all lesson-related modules (`LessonRecorder.ts`, `LockManager.ts`, `Deduplicator.ts`, `LessonAuditLogger.ts`, `LessonRetriever.ts`, `types.ts`) from `src/core/lessons/` to `src/hooks/state/lessons/` and leave re-exports at the original locations with `@deprecated` JSDoc tags.
- **FR-007**: The system MUST move `src/core/tools/SelectActiveIntent.ts` to `src/hooks/tools/SelectActiveIntentTool.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-008**: The system MUST move `src/core/prompts/sections/intent-handshake.ts` to `src/hooks/prompts/intent-handshake.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-009**: The system MUST move `src/errors/TraceabilityError.ts` to `src/hooks/errors/TraceabilityError.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-010**: The system MUST move `src/services/orchestration/OrchestrationService.ts` to `src/hooks/state/OrchestrationService.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-011**: The system MUST move `src/utils/orchestration/LedgerManager.ts` to `src/hooks/state/LedgerManager.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-012**: The system MUST move `src/contracts/AgentTrace.ts` to `src/hooks/contracts/AgentTrace.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-013**: The system MUST update `src/hooks/index.ts` to export all public APIs from the new module locations, organized by subdirectory namespace.
- **FR-014**: Each re-export file at the old location MUST contain only a re-export statement and a `@deprecated` JSDoc tag indicating the new canonical path, following this pattern. Re-export shims are **not removed** as part of this feature; removal is deferred to a separate follow-up task.
    ```
    /** @deprecated Moved to src/hooks/<new-path>. Update your imports. */
    export { ... } from '../hooks/<new-path>';
    ```
- **FR-015**: The system MUST produce a migration guide document mapping every old path to its new path.
- **FR-016**: Each individual module move MUST be independently verifiable — the test suite MUST pass after each move is completed, not only after the entire migration.
- **FR-017**: Modules MUST be moved in dependency order: types/contracts first (FR-012, FR-020), then errors (FR-009), then state/concurrency (FR-003 through FR-006, FR-010, FR-011), then tools (FR-007), then prompts (FR-008), then engine restructuring (FR-002).
- **FR-018**: The `src/hooks/engine/` directory MUST contain the `HookRegistry.ts` file (already present at `src/hooks/engine/HookRegistry.ts`) alongside the relocated `HookEngine.ts`.
- **FR-019**: Internal imports within moved modules MUST be updated to reference new canonical paths rather than old paths, to avoid re-export chains (a moved module should not import from another moved module's deprecated re-export).
- **FR-020**: The system MUST move `src/core/concurrency/types.ts` to `src/hooks/state/types.ts` and leave a re-export at the original location with a `@deprecated` JSDoc tag.
- **FR-021**: The system MUST move co-located test files alongside their governance modules: `src/core/state/__tests__/StateMachine.test.ts` → `src/hooks/state/__tests__/`, `src/core/concurrency/__tests__/{OptimisticGuard.test.ts, TurnContext.test.ts, TurnLifecycle.test.ts}` → `src/hooks/state/__tests__/`, `src/core/lessons/__tests__/{Deduplicator.test.ts, LessonRecorder.test.ts}` → `src/hooks/state/lessons/__tests__/`, `src/utils/orchestration/__tests__/LedgerManager.test.ts` → `src/hooks/state/__tests__/`, `src/contracts/__tests__/AgentTraceEntry.test.ts` → `src/hooks/contracts/__tests__/`. Test imports MUST be updated to reference the new canonical module paths.

### Key Entities

- **Governance Module**: A TypeScript source file containing logic that enforces architectural invariants, manages execution state, controls concurrency, records audit trails, or mediates tool access. These modules belong exclusively in `src/hooks/`.
- **Re-export Shim**: A replacement file left at the old location after a module move, containing only a `@deprecated` JSDoc annotation and a re-export statement pointing to the new canonical location.
- **Barrel Export**: The `src/hooks/index.ts` file that aggregates and re-exports all public APIs from `src/hooks/` subdirectories, providing a single import surface for consumers.
- **Migration Guide**: A reference document listing every old path → new path mapping, enabling developers to update their import statements during the transition period.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of governance modules identified in the Architecture Alignment Report (G-006) exist at their documented `src/hooks/` target paths.
- **SC-002**: 100% of original locations contain only re-export shims with `@deprecated` annotations — zero governance logic remains directly in `src/core/`, `src/services/`, `src/utils/`, or `src/errors/` (beyond re-exports).
- **SC-003**: All existing tests pass after each individual module move. Tests that remain at their original locations require zero modifications (backward compatibility via re-exports). Co-located tests that move alongside their modules have their imports updated per FR-021.
- **SC-004**: All existing tests pass after the complete migration with zero regressions.
- **SC-005**: The `src/hooks/` directory structure matches the §6.3 documented layout, including all required subdirectories: `engine/`, `pre/`, `post/`, `state/`, `state/lessons/`, `tools/`, `prompts/`, `contracts/`, `errors/`.
- **SC-006**: A developer can locate any governance module by browsing `src/hooks/` without needing to search `src/core/`, `src/services/`, `src/utils/`, or `src/errors/`.
- **SC-007**: The migration guide document is complete with all old → new path mappings and is accessible in the feature directory.
- **SC-008**: The `src/hooks/index.ts` barrel export includes all public APIs from the relocated modules.

## Assumptions

- The `src/hooks/engine/HookRegistry.ts` and `src/hooks/engine/types.ts` files already exist at the correct target location and do not need to be moved.
- External test files (e.g., integration tests in `src/hooks/__tests__/`, `src/test/`) import modules using paths that resolve via re-exports; no modifications are required for tests that remain in place. Co-located tests that move with their modules will have imports updated per FR-021.
- The Architecture document §6.3 is the authoritative source for the target directory structure.
- Circular dependencies between governance modules and non-governance modules in `src/core/` can be resolved through the re-export shim strategy without requiring additional refactoring.
- The TypeScript compiler and bundler configuration supports re-exports without performance degradation or import resolution issues.
- Files identified for relocation contain primarily governance logic; any non-governance utility functions will be assessed during implementation and may remain in place if they serve a broader purpose.
- Removal of re-export shims at old locations is explicitly out of scope for this feature. Shims persist with `@deprecated` tags until a dedicated cleanup task is undertaken.
