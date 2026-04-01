### 6. Results Posting

**IMPORTANT**: Do NOT write `result.json` directly. The SDK owns that file.

**Workflow:**

1. Write the result **value** to a separate file (e.g., `output.json` or
   `value.json`):
```json
{
  "score": 85,
  "details": { ... }
}
```

2. Post the result, either by passing the value file or inline JSON:
```bash
$CLI task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value tasks/<effectId>/output.json \
  --json

$CLI task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value-inline '{"score": 85}' \
  --json
```

The `task:post` command will:
- Read the value from your file or inline JSON
- Write the complete `result.json` (including schema, metadata, and your value)
- Append an `EFFECT_RESOLVED` event to the journal
- Update the state cache

**Available flags:**
- `--status <ok|error>` (required)
- `--value <file>` - Result value (for status=ok)
- `--value-inline <json>` - Inline result value JSON (for status=ok, cannot be combined with `--value`)
- `--error <file>` - Error payload (for status=error)
- `--stdout-file <file>` - Capture stdout
- `--stderr-file <file>` - Capture stderr
- `--started-at <iso8601>` - Task start time
- `--finished-at <iso8601>` - Task end time
- `--metadata <file>` - Additional metadata JSON

**Common mistake to avoid:**
```bash
# wrong: Writing result.json directly
echo '{"result": {...}}' > tasks/<effectId>/result.json
$CLI task:post <runId> <effectId> --status ok

# correct: Write value to a separate file or pass inline JSON, then let SDK create result.json
echo '{"score": 85}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

$CLI task:post <runId> <effectId> --status ok --value-inline '{"score": 85}'
```

**Breakpoint-specific posting:**

```bash
# Breakpoint approval
echo '{"approved": true, "response": "User approved"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# Breakpoint rejection (ALWAYS use --status ok, not --status error)
echo '{"approved": false, "response": "User rejected"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```
