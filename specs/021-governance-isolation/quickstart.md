# Quickstart: Governance Isolation Boundary Enforcement

**Feature**: 021-governance-isolation  
**Date**: 2026-02-21

## What This Feature Does

Relocates all governance logic modules from forbidden directories (`src/core/`, `src/services/`, `src/utils/`, `src/errors/`, `src/contracts/`) into the `src/hooks/` subtree, matching the documented architecture layout in §6.3.

## Migration Procedure (Per Module)

Each module move follows a 5-step procedure:

### Step 1: Create Target File

Copy the source file to its target location under `src/hooks/`.

### Step 2: Update Internal Imports

In the newly placed file, update any import paths that reference other already-moved modules to use the new canonical paths (not the deprecated re-exports).

### Step 3: Create Re-export Shim

Replace the original file content with a re-export shim:

```typescript
/**
 * @deprecated Moved to src/hooks/<target-path>. Update your imports.
 * This re-export exists for backward compatibility during migration.
 */
export { SymbolName } from "<relative-path-to-new-location>"
```

### Step 4: Move Co-located Tests

Move `__tests__/*.test.ts` files alongside the module. Update their import paths.

### Step 5: Verify

Run `npx vitest run` to ensure all tests pass.

## Dependency Order

Execute phases in this order:

1. **Contracts/Types** — `AgentTrace.ts`, `concurrency/types.ts`
2. **Errors** — `TraceabilityError.ts`
3. **State** — `StateMachine.ts`, `TurnContext.ts`, `OptimisticGuard.ts`, `OrchestrationService.ts`, `LedgerManager.ts`
4. **Lessons** — All `src/core/lessons/` files
5. **Tools** — `SelectActiveIntent.ts` → `SelectActiveIntentTool.ts`
6. **Prompts** — `intent-handshake.ts`
7. **Engine** — `HookEngine.ts` root → `engine/HookEngine.ts`

## Key Rules

1. **Never break the build** — re-exports ensure backward compatibility at every step.
2. **Move in dependency order** — types/contracts first, consumers last.
3. **Update internal imports first** — a moved module must import from canonical paths, not deprecated re-exports.
4. **Run tests after each move** — `npx vitest run` must pass after every step.
5. **Don't remove re-exports** — shims stay until a separate cleanup task.

## Verification

After complete migration:

```bash
# All tests pass
npx vitest run

# No governance logic in forbidden directories (only re-exports)
# Check that files in src/core/state/, src/core/concurrency/, etc.
# contain only re-export statements

# All hooks-subtree directories exist
ls src/hooks/engine/
ls src/hooks/state/
ls src/hooks/state/lessons/
ls src/hooks/tools/
ls src/hooks/prompts/
ls src/hooks/contracts/
ls src/hooks/errors/
```
