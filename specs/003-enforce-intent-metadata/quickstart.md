# Quickstart: Enforced Intent Metadata

The `write_file` tool now requires metadata for auditing and traceability. Governance rules block any call missing these fields.

## Valid Request Example

```json
{
	"path": "src/utils/math.ts",
	"content": "export const add = (a: number, b: number) => a + b;",
	"intent_id": "INT-001-setup-math",
	"mutation_class": "INTENT_EVOLUTION"
}
```

## Rejected Request Examples

### Missing Metadata

```json
{
	"path": "test.txt",
	"content": "hello"
}
```

**Error**: `Missing required field: intent_id` (or `mutation_class`)

### Empty Intent ID

```json
{
	"path": "test.txt",
	"content": "hello",
	"intent_id": "",
	"mutation_class": "AST_REFACTOR"
}
```

**Error**: `Missing required field: intent_id` (or specific validation error for empty string)

### Invalid Mutation Class

```json
{
	"path": "test.txt",
	"content": "hello",
	"intent_id": "INT-1",
	"mutation_class": "REDO"
}
```

**Error**: `Invalid value for mutation_class. Allowed values: AST_REFACTOR, INTENT_EVOLUTION`

## Best Practices

1. **Check Intent**: Always ensure `intent_id` matches the current active intent returned by `select_active_intent`.
2. **Be Specific**: Choose `AST_REFACTOR` only if no functional logic is changing. Use `INTENT_EVOLUTION` for all functional work.
3. **Fail Fast**: The tool will error immediately if schema is invalid, preventing wasted reasoning turns.
