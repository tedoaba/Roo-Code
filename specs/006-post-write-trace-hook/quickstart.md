# Quickstart: Post-Write Trace Hook

## Testing the Trace Pipeline

1. **Verify Unit Tests First:**
   Test the isolation and safe-failure of the trace generation.

    ```bash
    npm run test
    ```

2. **Trigger a File Write:**
   While running the VS Code Extension or the debugger, initiate a standard tool use operation: `write_to_file`.

3. **Verify the Trace Generation:**
   Open the sidecar tracing directory: `.orchestration/agent_trace.jsonl`.
   Check that a new entry appears at the bottom.

    The generated object should look like this:

    ```json
    {
    	"id": "e4b3c2a1-....",
    	"timestamp": 1234567890,
    	"agent": "roo-code",
    	"target_artifact": "C://Users/.../path_to_file",
    	"mutation_class": "write",
    	"related": [
    		{ "type": "intent", "id": "123..." },
    		{ "type": "request", "id": "XYZ..." }
    	],
    	"content_hash": "a4d3f56b..."
    }
    ```

## Development Pointers

- **Tracing Errors**: Trace serialization is designed to silently swallow internal errors. If the file output isn't happening, you'll need to manually inspect the error payload injected into the Debug Console (`console.error`).
- **File Hashing Constraint**: The current `content_hash` reads the entire structure of the file natively. Large files might introduce marginal latency.
