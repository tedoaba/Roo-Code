# Data Model: Sidecar Alignment

## Sidecar Data Structures

### Active Intents File (`active_intents.yaml`)

The root container for all active intents in the orchestration layer.

| Property         | Type             | Required        | Description                         |
| :--------------- | :--------------- | :-------------- | :---------------------------------- |
| `active_intents` | `ActiveIntent[]` | Yes (Canonical) | List of active intents              |
| `intents`        | `ActiveIntent[]` | No (Legacy)     | Fallback for older sidecar versions |

### Intent Map (`intent_map.md`)

A markdown file tracking the mapping between intents and modified files.

**Initial Content Template:**

```markdown
# Intent Map

_No intents have been mapped yet._
```

## Logic Changes

### OrchestrationService.ts

#### Interface `ActiveIntentsFile`

```typescript
interface ActiveIntentsFile {
	active_intents?: ActiveIntent[]
	intents?: ActiveIntent[]
}
```

#### `getActiveIntents()` logic

1. Load YAML.
2. If `active_intents` exists, use it.
3. Else if `intents` exists, use it.
4. Else return empty array.

#### `saveIntents(intents: ActiveIntent[])` logic

1. Write `{ active_intents: intents }` to YAML.

#### `initializeOrchestration()` logic

1. Ensure `.orchestration/` exists.
2. Create `active_intents.yaml` with `{ active_intents: [] }` if missing.
3. Create `intent_map.md` with the new placeholder if missing.
4. Ensure `agent_trace.jsonl` exists if missing.
