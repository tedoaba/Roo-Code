# Quickstart: Intent Handshake

To enable the Intent Handshake locally:

1. **Install extension**: `npm install` && `npm run watch`
2. **Setup Orchestration**:
    - Ensure `.orchestration/` directory exists in your workspace root.
    - Create a dummy `.orchestration/active_intents.yaml` with test intents.
3. **Verify Handshake**:
    - Launch the extension via "F5" (Run Extension).
    - Send any prompt (e.g., "Hello").
    - Confirm the agent calls `select_active_intent` immediately.
    - If no intents exist, it should guide you to create one.

## Troubleshooting

- **Agent ignores intent**: Check if `System Prompt` includes the governance section.
- **Scope Violation errors**: Verify `active_intents.yaml` explicitly includes the target file patterns.
