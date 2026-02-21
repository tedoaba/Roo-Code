# Quickstart: Sidecar Model Alignment

This feature aligns the `.orchestration/` data model with the architecture specification.

## Verification Steps

### 1. Initialization

- Delete the `.orchestration/` directory in a test workspace.
- Invoke `OrchestrationService.initializeOrchestration()`.
- Verify `.orchestration/intent_map.md` matches the specification:

    ```markdown
    # Intent Map

    _No intents have been mapped yet._
    ```

- Verify `.orchestration/active_intents.yaml` uses the `active_intents:` root key.

### 2. Migration

- Manually create an `.orchestration/active_intents.yaml` file with the legacy `intents:` key.
- Call `getActiveIntents()` and verify the intents are loaded correctly.
- Call `saveIntents()` or add a new intent.
- Verify the file is migrated to use the `active_intents:` key.

### 3. Mixed Keys (Precedence)

- Manually create an `.orchestration/active_intents.yaml` with both `active_intents:` and `intents:` keys (with different content).
- Verify that `getActiveIntents()` prioritizes `active_intents:`.
