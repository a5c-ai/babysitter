# Babysitter Hook System

**Version:** 2.1 (Runtime Integration)
**Date:** 2026-01-19

> **✨ New in v2.1:** Lifecycle hooks are now **automatically triggered** by the SDK runtime at key lifecycle points (createRun, orchestrateIteration, task execution). No manual hook calls needed in process files for SDK lifecycle events.
>
> **New in v2.0:** The hook system has been generalized to support **12 hook types** across the orchestration lifecycle, plus SDK integration for calling hooks directly from process files via `ctx.hook()`. See [HOOK_SYSTEM_V2_SUMMARY.md](./HOOK_SYSTEM_V2_SUMMARY.md) for complete v2.0 details.

## Overview

The babysitter plugin uses a **generalized hook-based architecture** to allow extensibility at key points in the orchestration lifecycle. Hooks are shell scripts that receive event data via stdin and can execute custom logic in response.

**Key Features:**
- ✅ Generic hook dispatcher supporting any hook type
- ✅ SDK integration - `ctx.hook()` callable from `main.js`
- ✅ 12 lifecycle hook types (8 SDK + 4 process-level)
- ✅ Backwards compatible with v1.0 hooks
- ✅ TypeScript support with full type definitions

## Supported Hook Types

### SDK Lifecycle Hooks (Automatic)

Triggered automatically by the SDK runtime:

- **`on-run-start`** - Run created, before first step
- **`on-run-complete`** - Run finished successfully
- **`on-run-fail`** - Run failed with error
- **`on-task-start`** - Task begins execution
- **`on-task-complete`** - Task completes (success/error)
- **`on-step-dispatch`** - After each orchestration step
- **`on-iteration-start`** - Start of orchestration iteration
- **`on-iteration-end`** - End of orchestration iteration

### Process-Level Hooks (Manual)

Called explicitly from process files via `ctx.hook()`:

- **`on-breakpoint`** - User approval/input required
- **`pre-commit`** - Before committing changes
- **`pre-branch`** - Before creating branch
- **`post-planning`** - After planning phase complete
- **`on-score`** - Scoring/evaluation step

### on-breakpoint (Original)

Triggered when a breakpoint is reached during orchestration. Allows custom handling of breakpoint events.

**Default behavior:** Uses `breakpoint-cli.sh` to create breakpoint via breakpoints CLI and wait for release.

**Use cases:**
- Send notifications (Slack, email, SMS)
- Log breakpoint events
- Trigger custom approval workflows
- Integrate with external systems
- Custom UI/UX for breakpoints

## Hook Discovery

Hooks are discovered and executed in priority order:

1. **Per-repo hooks** - `.a5c/hooks/<hook-name>/`
   - Highest priority
   - Project-specific behavior
   - Committed to repository

2. **Per-user hooks** - `~/.config/babysitter/hooks/<hook-name>/`
   - User-specific preferences
   - Not in repository
   - Personal customizations

3. **Plugin hooks** - `plugins/babysitter/hooks/<hook-name>/`
   - Default implementations
   - Lowest priority
   - Shipped with plugin

Within each location, hooks are executed in alphabetical order by filename.

## Calling Hooks

### From Process Files (main.js)

The ProcessContext provides a `ctx.hook()` method for calling hooks directly:

```javascript
import { defineTask } from "@a5c-ai/babysitter-sdk";

export async function myProcess(inputs, ctx) {
  // Call pre-commit hooks before committing
  const commitResult = await ctx.hook("pre-commit", {
    files: ["src/feature.ts", "src/feature.test.ts"],
    message: "feat: add new feature",
    author: "Claude",
  });

  if (!commitResult.success) {
    throw new Error("Pre-commit hooks failed");
  }

  // Call scoring hooks
  const scoreResult = await ctx.hook("on-score", {
    target: "code-quality",
    score: 85,
    metrics: {
      coverage: 92,
      complexity: 8,
    },
  });

  // Check if any hook failed
  const failedHooks = scoreResult.executedHooks.filter(h => h.status === "failed");
  if (failedHooks.length > 0) {
    ctx.log(`Warning: ${failedHooks.length} hooks failed`);
  }

  return { ok: true };
}
```

### From Shell Scripts

Use the generic dispatcher:

```bash
# Call any hook type
echo '{"runId":"run-123","status":"completed","duration":5000}' | \
  plugins/babysitter/hooks/hook-dispatcher.sh on-run-complete

# Call on-breakpoint
cat breakpoint-payload.json | \
  plugins/babysitter/hooks/hook-dispatcher.sh on-breakpoint

# Backwards compatible - old dispatcher still works
cat breakpoint-payload.json | \
  plugins/babysitter/hooks/on-breakpoint-dispatcher.sh
```

### From SDK Runtime (Automatic)

**✨ New:** As of v2.1, SDK lifecycle hooks are **automatically triggered** by the runtime at key lifecycle points. No manual invocation needed.

#### Integration Points

The SDK runtime automatically calls hooks at the following points:

**In `createRun()` (packages/sdk/src/runtime/createRun.ts):**
- `on-run-start` - Called after `RUN_CREATED` event is written
- Payload: `{ runId, processId, entry, inputs, timestamp }`

**In `orchestrateIteration()` (packages/sdk/src/runtime/orchestrateIteration.ts):**
- `on-iteration-start` - Called at start of each iteration
- `on-run-complete` - Called after `RUN_COMPLETED` event
- `on-run-fail` - Called after `RUN_FAILED` event
- `on-iteration-end` - Called in finally block at end of iteration
- Payloads include: `{ runId, status, output/error, duration, timestamp }`

**In task execution (external):**
- The SDK no longer executes tasks in-process (the legacy CLI node runner was removed).
- If you want task lifecycle hooks (`on-task-start`, `on-task-complete`), emit them from your external executor (hook/worker/agent) around the work it performs.

#### Error Handling

Hook failures are handled gracefully:
- Wrapped in try-catch by `callRuntimeHook()` helper
- Failures are logged but **do not break orchestration**
- All hooks continue to execute even if one fails
- This ensures robustness - custom hooks can't crash runs

#### How It Works

The SDK runtime uses `callRuntimeHook()` from `packages/sdk/src/runtime/hooks/runtime.ts`:

```typescript
import { callRuntimeHook } from "./hooks/runtime";

// Example: In createRun()
await callRuntimeHook(
  "on-run-start",
  { runId, processId, entry, inputs },
  { cwd: runDir, logger }
);
```

This function:
1. Ensures the payload has a timestamp
2. Calls the generic hook dispatcher
3. Catches any errors and logs them
4. Returns a result without throwing (even on failure)

No code changes needed to enable these hooks - they work automatically once the SDK is integrated.

## Hook Contract

### Input

Hooks receive a JSON payload via stdin. The structure depends on the hook type.

**For on-breakpoint hooks:**
```json
{
  "question": "Approve this change?",
  "title": "Review Required",
  "runId": "run-20260119-example",
  "reason": "Critical issues found",
  "context": {
    "runId": "run-20260119-example",
    "files": [
      {
        "path": ".a5c/runs/run-20260119-example/artifacts/process.md",
        "format": "markdown"
      },
      {
        "path": ".a5c/runs/run-20260119-example/inputs.json",
        "format": "code",
        "language": "json"
      }
    ]
  },
  "summary": {
    "totalIssues": 6,
    "critical": 0,
    "high": 1
  }
}
```

### Output

Hooks can output to:
- **stdout**: Data that should be captured (e.g., breakpoint results)
- **stderr**: Logging/debugging information (visible to user)

### Exit Codes

- `0`: Success - hook executed successfully
- `non-zero`: Failure - logged but doesn't stop other hooks

**Important**: Hook failures don't stop the dispatcher. All hooks are attempted.

### Environment Variables

Hooks have access to:
- `BREAKPOINT_PAYLOAD`: The full JSON payload (also on stdin)
- `CLAUDE_PLUGIN_ROOT`: Plugin installation directory
- `REPO_ROOT`: Repository root (if set)
- `CLAUDE_SESSION_ID`: Current Claude session ID
- Standard environment variables

## Writing a Hook

### Basic Template

```bash
#!/bin/bash
# My Custom Hook
# Description of what this hook does

set -euo pipefail

# Read payload from stdin
PAYLOAD=$(cat)

# Extract fields using jq
QUESTION=$(echo "$PAYLOAD" | jq -r '.question // "N/A"')
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')

# Do your custom logic here
echo "[my-hook] Processing breakpoint for run: $RUN_ID" >&2

# Example: Send notification
# curl -X POST https://api.example.com/notify \
#   -d "{\"message\": \"Breakpoint: $QUESTION\"}"

# Output any results to stdout (optional)
echo '{"status": "notified"}'

exit 0
```

### Installation

**Per-repo hook (recommended for team workflows):**
```bash
# Create hook directory
mkdir -p .a5c/hooks/on-breakpoint

# Create your hook
cat > .a5c/hooks/on-breakpoint/my-hook.sh <<'EOF'
#!/bin/bash
# Your hook code here
EOF

# Make executable
chmod +x .a5c/hooks/on-breakpoint/my-hook.sh

# Commit to repo
git add .a5c/hooks/on-breakpoint/my-hook.sh
git commit -m "Add custom breakpoint hook"
```

**Per-user hook (personal preferences):**
```bash
# Create hook directory
mkdir -p ~/.config/babysitter/hooks/on-breakpoint

# Create your hook
cat > ~/.config/babysitter/hooks/on-breakpoint/my-hook.sh <<'EOF'
#!/bin/bash
# Your hook code here
EOF

# Make executable
chmod +x ~/.config/babysitter/hooks/on-breakpoint/my-hook.sh
```

## Example Hooks

### Slack Notification

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
QUESTION=$(echo "$PAYLOAD" | jq -r '.question')
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')

SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

if [[ -n "$SLACK_WEBHOOK" ]]; then
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"🛑 Breakpoint in run \`$RUN_ID\`\",
      \"blocks\": [{
        \"type\": \"section\",
        \"text\": {
          \"type\": \"mrkdwn\",
          \"text\": \"*Question:* $QUESTION\"
        }
      }]
    }" > /dev/null 2>&1

  echo "[slack] Notification sent" >&2
fi

exit 0
```

### Email Notification

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
QUESTION=$(echo "$PAYLOAD" | jq -r '.question')
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
REASON=$(echo "$PAYLOAD" | jq -r '.reason // "N/A"')

EMAIL="${BREAKPOINT_EMAIL:-your-email@example.com}"

{
  echo "Subject: Breakpoint in run $RUN_ID"
  echo ""
  echo "A breakpoint has been reached:"
  echo ""
  echo "Run ID: $RUN_ID"
  echo "Reason: $REASON"
  echo "Question: $QUESTION"
  echo ""
  echo "Full payload:"
  echo "$PAYLOAD" | jq '.'
} | sendmail "$EMAIL"

echo "[email] Notification sent to $EMAIL" >&2

exit 0
```

### Metrics/Telemetry

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')

# Send to metrics system
curl -X POST https://metrics.example.com/api/events \
  -H 'Content-Type: application/json' \
  -d "{
    \"event\": \"breakpoint\",
    \"timestamp\": \"$TIMESTAMP\",
    \"runId\": \"$RUN_ID\",
    \"payload\": $PAYLOAD
  }" > /dev/null 2>&1

echo "[metrics] Event logged" >&2

exit 0
```

## Testing Hooks

### Manual Testing

Test the dispatcher with a sample payload:

```bash
# Create test payload
cat > /tmp/test-breakpoint.json <<'EOF'
{
  "question": "Test breakpoint?",
  "runId": "test-123",
  "context": {
    "runId": "test-123"
  }
}
EOF

# Run dispatcher
cat /tmp/test-breakpoint.json | \
  plugins/babysitter/hooks/on-breakpoint-dispatcher.sh
```

### Testing Individual Hooks

```bash
# Test your hook directly
cat /tmp/test-breakpoint.json | \
  .a5c/hooks/on-breakpoint/my-hook.sh
```

### Debugging

Enable verbose output:

```bash
# Set environment variable for debugging
export BREAKPOINT_DEBUG=1

# Run dispatcher - will show detailed execution
cat /tmp/test-breakpoint.json | \
  plugins/babysitter/hooks/on-breakpoint-dispatcher.sh
```

## Best Practices

### Do's ✅

- **Make hooks idempotent** - safe to run multiple times
- **Use meaningful filenames** - `slack-notify.sh`, not `hook1.sh`
- **Log to stderr** - helps with debugging
- **Handle missing data** - use `jq -r '.field // "default"'`
- **Exit gracefully** - always return 0 for non-critical failures
- **Document your hooks** - add comments explaining purpose
- **Test thoroughly** - test with various payloads

### Don'ts ❌

- **Don't block indefinitely** - use timeouts for external calls
- **Don't fail dispatcher** - return 0 unless critically broken
- **Don't modify payload** - hooks are read-only observers
- **Don't hardcode secrets** - use environment variables
- **Don't rely on hook order** - within a directory, order is alphabetical but should be treated as concurrent
- **Don't output sensitive data** - especially to logs

## Hook Architecture

### Dispatcher Flow

```
┌─────────────────────────────────────────────────┐
│  on-breakpoint-dispatcher.sh                    │
│                                                  │
│  1. Read payload from stdin                     │
│  2. Execute per-repo hooks (.a5c/hooks/)        │
│     └─ Run all *.sh files in alphabetical order │
│  3. Execute per-user hooks (~/.config/)         │
│     └─ Run all *.sh files in alphabetical order │
│  4. Execute plugin hooks (plugins/*/hooks/)     │
│     └─ Run all *.sh files in alphabetical order │
│  5. Aggregate results and exit                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Hook Execution

Each hook:
1. Receives full payload via stdin
2. Can access payload via `$BREAKPOINT_PAYLOAD` environment variable
3. Executes independently (failures don't affect other hooks)
4. Can output results to stdout (captured)
5. Can log to stderr (visible to user)
6. Returns exit code (0 = success, non-zero = failure)

### Default Hook (breakpoint-cli.sh)

The default `breakpoint-cli.sh` hook:
- Creates breakpoint using `breakpoints` CLI
- Waits for release with polling
- Returns feedback data
- This is the previous behavior, now as a pluggable hook

## Future Hook Types

The following hooks are planned for future implementation:

- `on-run-start` - When a run is created
- `on-run-complete` - When a run completes successfully
- `on-run-fail` - When a run fails
- `on-task-start` - When a task begins
- `on-task-complete` - When a task completes
- `on-error` - When an error occurs
- `on-step` - After each orchestration step

## Migration from Direct CLI Usage

If you previously used the breakpoints CLI directly in custom code:

**Before:**
```bash
# Old approach - direct CLI usage
breakpoints breakpoint create \
  --question "Approve?" \
  --run-id "$RUN_ID"
```

**After:**
```bash
# New approach - use hook dispatcher
echo '{"question":"Approve?","runId":"'$RUN_ID'"}' | \
  plugins/babysitter/hooks/on-breakpoint-dispatcher.sh
```

The default behavior is identical, but now you can add custom hooks without modifying core logic.

## Support

For questions or issues with hooks:
1. Check hook logs (stderr output)
2. Test hooks independently with sample payloads
3. Review `on-breakpoint-dispatcher.sh` execution summary
4. Ensure hooks are executable (`chmod +x`)
5. Check JSON syntax with `jq`

## Reference

### Hook Locations

| Location | Priority | Scope | Use Case |
|----------|----------|-------|----------|
| `.a5c/hooks/<hook-name>/` | Highest | Per-repo | Team workflows, project-specific |
| `~/.config/babysitter/hooks/<hook-name>/` | Medium | Per-user | Personal preferences |
| `plugins/babysitter/hooks/<hook-name>/` | Lowest | Plugin | Default implementations |

### Available Hooks

| Hook Name | Trigger | Payload | Status |
|-----------|---------|---------|--------|
| `on-breakpoint` | Breakpoint reached | Breakpoint data | ✅ Implemented |
| `on-run-start` | Run created | Run metadata | 📋 Planned |
| `on-run-complete` | Run completed | Run results | 📋 Planned |
| `on-run-fail` | Run failed | Error details | 📋 Planned |

---

**Last Updated:** 2026-01-19
**Plugin Version:** 1.0.0
