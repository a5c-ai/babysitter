# Hooks: Extensible Lifecycle Events

**Version:** 1.1
**Last Updated:** 2026-01-26
**Category:** Feature Guide

---

## In Plain English

**Hooks are automatic triggers that run your custom code at specific moments.**

Like setting up an automatic notification: "When the workflow finishes, send me a Slack message." That's a hook.

**Common examples:**
- 📧 Send an email when a run completes
- 📊 Log metrics to your dashboard when quality is scored
- 🔔 Get a desktop notification when approval is needed

**Do you need hooks as a beginner?** No - they're an advanced feature for customizing behavior. You can use Babysitter perfectly well without ever writing a hook.

---

## Overview

Hooks are shell scripts that execute at specific lifecycle points during Babysitter orchestration. They enable custom behavior for task execution, notifications, logging, metrics collection, and third-party integrations without modifying core SDK code.

### Why Use Hooks

- **Notifications**: Send Slack, email, or desktop alerts when runs complete or fail
- **Metrics Collection**: Capture timing, quality scores, and execution data for dashboards
- **Custom Orchestration**: Implement specialized task execution logic (e.g., native Node.js execution)
- **Audit Logging**: Write events to external systems for compliance and debugging
- **Integration**: Connect Babysitter to CI/CD pipelines, monitoring systems, or team tools
- **Session Control**: Manage Claude Code session behavior for continuous orchestration loops

---

## Hook Lifecycle Overview

The following diagram shows when each hook type fires during a Babysitter run:

```
                            SESSION LIFECYCLE
    +==========================================================================+
    |                                                                          |
    |   SessionStart -----> [Claude Code Session Active] -----> Stop           |
    |        |                                                    |            |
    |        v                                                    v            |
    |   Session setup,                                    Decision: allow      |
    |   environment vars                                  exit or continue     |
    |                                                                          |
    +==========================================================================+

                              RUN LIFECYCLE
    +==========================================================================+
    |                                                                          |
    |   on-run-start -----> [Run Created]                                      |
    |        |                                                                 |
    |        v                                                                 |
    |   post-planning -----> [Plan Generated]                                  |
    |        |                                                                 |
    |        v                                                                 |
    |   +------------------------------------------------------------------+   |
    |   |                    ORCHESTRATION LOOP                            |   |
    |   |                                                                  |   |
    |   |   on-iteration-start ---+                                        |   |
    |   |         |               |                                        |   |
    |   |         v               |                                        |   |
    |   |   on-step-dispatch      |                                        |   |
    |   |         |               |                                        |   |
    |   |         v               |                                        |   |
    |   |   on-task-start ------> [Task Executes] ------> on-task-complete |   |
    |   |                               |                                  |   |
    |   |                               v                                  |   |
    |   |                         on-score (if quality task)               |   |
    |   |                               |                                  |   |
    |   |                               v                                  |   |
    |   |                         on-breakpoint (if breakpoint)            |   |
    |   |                               |                                  |   |
    |   |                               v                                  |   |
    |   |                       on-iteration-end ---+                      |   |
    |   |                               |           |                      |   |
    |   |                               +-----------+ (loop continues)     |   |
    |   +------------------------------------------------------------------+   |
    |                                   |                                      |
    |                                   v                                      |
    |   +--- on-run-complete <----[Success]                                    |
    |   |                                                                      |
    |   +--- on-run-fail <--------[Failure]                                    |
    |                                                                          |
    +==========================================================================+

                            GIT LIFECYCLE
    +==========================================================================+
    |                                                                          |
    |   pre-branch -----> [Branch Operation] -----> pre-commit                 |
    |                                                                          |
    +==========================================================================+
```

---

## Available Hook Types

### SDK Lifecycle Hooks

These hooks fire during the orchestration lifecycle managed by the Babysitter SDK.

| Hook | Trigger | Purpose |
|------|---------|---------|
| `on-run-start` | Run creation | Initialize resources, set up monitoring |
| `on-run-complete` | Successful completion | Cleanup, send success notifications |
| `on-run-fail` | Run failure | Error alerts, debugging information |
| `on-iteration-start` | Before each iteration | **Core orchestration logic**, effect execution |
| `on-iteration-end` | After each iteration | Finalization, iteration logging |
| `on-task-start` | Before task execution | Preparation, timing metrics |
| `on-task-complete` | After task execution | Result processing, cleanup |
| `on-breakpoint` | Breakpoint created | Notifications to reviewers |
| `on-score` | Quality score computed | Metrics collection, dashboards |
| `on-step-dispatch` | Step dispatch decision | Custom routing logic |
| `post-planning` | After plan generation | Plan validation, notifications |
| `pre-branch` | Before git branch operation | Branch naming, validation |
| `pre-commit` | Before git commit | Linting, formatting, validation |

### Claude Code Hooks

These hooks integrate with Claude Code's session management.

| Hook | Trigger | Purpose |
|------|---------|---------|
| `SessionStart` | Session begins | Persist session ID, set environment variables |
| `Stop` | Exit attempt | Implement in-session orchestration loops |
| `PreToolUse` | Before tool call | Validation, logging |
| `PostToolUse` | After tool call | Result logging, metrics |

---

## Hook Discovery and Priority

Hooks are discovered and executed in a specific priority order. All matching hooks in each location are executed.

**Discovery Order (highest to lowest priority):**

1. **Per-repo hooks:** `.a5c/hooks/<hook-type>/*.sh`
2. **Per-user hooks:** `~/.config/babysitter/hooks/<hook-type>/*.sh`
3. **Plugin hooks:** `plugins/babysitter/hooks/<hook-type>/*.sh`

**Execution Order:**

Within each location, hooks are executed in lexicographic (alphabetical) order by filename.

```
.a5c/hooks/on-run-complete/
  01-metrics.sh       # Executes first
  02-notify.sh        # Executes second
  99-cleanup.sh       # Executes last
```

---

## Hook Execution Model

### Input/Output Protocol

| Channel | Purpose | Notes |
|---------|---------|-------|
| **stdin** | JSON payload input | Contains event-specific data |
| **stdout** | JSON result output | Must be valid JSON (or empty) |
| **stderr** | Logging output | Not captured, visible in console |

### Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| `0` | Success - hook completed normally |
| Non-zero | Failure - logged but does not stop other hooks |

**Important:** Hook failures are logged but do not stop the dispatcher from executing remaining hooks.

---

## Creating Custom Hooks

### Step 1: Create Hook Directory

Choose the appropriate location for your hook:

```bash
# Per-repo hook (version controlled, project-specific)
mkdir -p .a5c/hooks/on-run-complete

# Per-user hook (applies to all your projects)
mkdir -p ~/.config/babysitter/hooks/on-run-complete
```

### Step 2: Create Hook Script

Create a shell script with the `.sh` extension:

```bash
#!/bin/bash
set -euo pipefail

# Read JSON payload from stdin
PAYLOAD=$(cat)

# Parse payload using jq
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
STATUS=$(echo "$PAYLOAD" | jq -r '.status // "unknown"')

# Log to stderr (visible in console)
echo "[my-hook] Processing run: $RUN_ID" >&2

# Your custom logic here
# ...

# Return JSON result via stdout (must be valid JSON)
echo '{"ok": true, "action": "processed"}'
```

### Step 3: Make Executable

```bash
chmod +x .a5c/hooks/on-run-complete/my-hook.sh
```

### Step 4: Test Hook

Test your hook manually by piping sample JSON:

```bash
echo '{"runId": "run-test-123", "status": "completed"}' | \
  .a5c/hooks/on-run-complete/my-hook.sh
```

---

## Hook Payloads and Environment Variables

### Common Payload Fields

Most SDK lifecycle hooks receive these fields:

```json
{
  "runId": "run-20260125-143012",
  "timestamp": "2026-01-25T14:30:12.123Z"
}
```

### Hook-Specific Payloads

#### on-iteration-start / on-iteration-end

```json
{
  "runId": "run-20260125-143012",
  "iteration": 3,
  "timestamp": "2026-01-25T14:35:00.000Z"
}
```

#### on-task-start / on-task-complete

```json
{
  "runId": "run-20260125-143012",
  "effectId": "effect-01HJKMNPQR3STUVWXYZ",
  "taskId": "build",
  "kind": "node",
  "label": "Build project"
}
```

#### on-breakpoint

```json
{
  "runId": "run-20260125-143012",
  "question": "Approve the deployment?",
  "title": "Production Deployment",
  "context": {
    "runId": "run-20260125-143012",
    "files": [
      {"path": "artifacts/plan.md", "format": "markdown"}
    ]
  }
}
```

#### on-run-complete / on-run-fail

```json
{
  "runId": "run-20260125-143012",
  "status": "completed",
  "duration": 45000
}
```

#### on-score

```json
{
  "runId": "run-20260125-143012",
  "score": 85,
  "target": 90,
  "iteration": 2
}
```

### Environment Variables

These environment variables are available to hooks:

| Variable | Description |
|----------|-------------|
| `HOOK_PAYLOAD` | The JSON payload (also available via stdin) |
| `HOOK_TYPE` | The hook type being executed |
| `REPO_ROOT` | Repository root directory |
| `BABYSITTER_SESSION_ID` | Cross-harness session identifier |
| `CLAUDE_PLUGIN_ROOT` | Plugin installation directory |
| `CLAUDE_ENV_FILE` | Path to session environment file |

---

## Example Use Cases

### Example 1: Slack Notification on Run Complete

**File:** `.a5c/hooks/on-run-complete/slack-notify.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
STATUS=$(echo "$PAYLOAD" | jq -r '.status')
DURATION=$(echo "$PAYLOAD" | jq -r '.duration')

# Calculate duration in human-readable format
DURATION_SEC=$((DURATION / 1000))

# Send to Slack webhook
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"Babysitter Run Complete\",
      \"attachments\": [{
        \"color\": \"$([ \"$STATUS\" = \"completed\" ] && echo 'good' || echo 'danger')\",
        \"fields\": [
          {\"title\": \"Run ID\", \"value\": \"$RUN_ID\", \"short\": true},
          {\"title\": \"Status\", \"value\": \"$STATUS\", \"short\": true},
          {\"title\": \"Duration\", \"value\": \"${DURATION_SEC}s\", \"short\": true}
        ]
      }]
    }" >&2
fi

echo '{"ok": true}'
```

### Example 2: Desktop Notification on Breakpoint

**File:** `.a5c/hooks/on-breakpoint/desktop-notify.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
TITLE=$(echo "$PAYLOAD" | jq -r '.title // "Breakpoint"')
QUESTION=$(echo "$PAYLOAD" | jq -r '.question')

# macOS notification
if command -v osascript &>/dev/null; then
  osascript -e "display notification \"$QUESTION\" with title \"$TITLE\" sound name \"Glass\""
fi

# Linux notification
if command -v notify-send &>/dev/null; then
  notify-send "$TITLE" "$QUESTION" --urgency=critical
fi

echo '{"ok": true}'
```

### Example 3: Metrics Collection

**File:** `.a5c/hooks/on-score/metrics-collector.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
SCORE=$(echo "$PAYLOAD" | jq -r '.score')
TARGET=$(echo "$PAYLOAD" | jq -r '.target')
ITERATION=$(echo "$PAYLOAD" | jq -r '.iteration')

# Log to metrics file
METRICS_FILE="${HOME}/.babysitter/metrics.jsonl"
mkdir -p "$(dirname "$METRICS_FILE")"

jq -n --compact-output \
  --arg runId "$RUN_ID" \
  --argjson score "$SCORE" \
  --argjson target "$TARGET" \
  --argjson iteration "$ITERATION" \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{
    timestamp: $timestamp,
    runId: $runId,
    score: $score,
    target: $target,
    iteration: $iteration,
    gap: ($target - $score)
  }' >> "$METRICS_FILE"

echo "[metrics] Recorded score $SCORE/$TARGET for iteration $ITERATION" >&2
echo '{"ok": true}'
```

### Example 4: Native Task Orchestration

The plugin includes a `native-orchestrator.sh` hook that automatically executes Node.js tasks:

**File:** `plugins/babysitter/hooks/on-iteration-start/native-orchestrator.sh`

This hook:
1. Queries run status via CLI
2. Identifies pending node tasks
3. Executes them externally (up to 3 in parallel)
4. Posts results back to the SDK

```bash
# Key excerpt - executes node tasks
(cd "$CWD_ABS" && node "$ENTRY_ABS" "${NODE_ARGS[@]}") >"$STDOUT_ABS" 2>"$STDERR_ABS"
EXIT_CODE=$?

if [ "$EXIT_CODE" -eq 0 ]; then
  "${CLI[@]}" task:post "$RUN_ID" "$EFFECT_ID" --status ok --value "$OUTPUT_REF"
else
  "${CLI[@]}" task:post "$RUN_ID" "$EFFECT_ID" --status error --error - <<< '{"message":"Task failed"}'
fi
```

### Example 5: In-Session Loop Control (Stop Hook)

The `babysitter-stop-hook.sh` implements continuous orchestration by intercepting exit attempts:

```bash
# Returns JSON to block exit and continue loop
jq -n \
  --arg prompt "$PROMPT_TEXT" \
  --arg msg "Babysitter iteration $NEXT_ITERATION | Continue orchestration" \
  '{
    "decision": "block",
    "reason": $prompt,
    "systemMessage": $msg
  }'
```

---

## The Hook Dispatcher

The hook dispatcher (`hook-dispatcher.sh`) is responsible for discovering and executing hooks.

### Usage

```bash
echo '{"runId":"...","key":"value"}' | hook-dispatcher.sh <hook-type>
```

### Dispatcher Behavior

1. **Discovers hooks** in priority order (per-repo, per-user, plugin)
2. **Executes all matching hooks** in lexicographic order
3. **Passes payload** to each hook via stdin
4. **Logs results** to stderr
5. **Continues on failure** - individual hook failures do not stop execution

### Example Dispatcher Output

```
[per-repo] Executing hooks from: .a5c/hooks/on-run-complete
[per-repo] Running: 01-metrics.sh
[per-repo] + 01-metrics.sh succeeded
[per-user] Executing hooks from: /home/user/.config/babysitter/hooks/on-run-complete
[per-user] Running: notify.sh
[per-user] + notify.sh succeeded

Hook execution summary:
per-repo:01-metrics.sh:success
per-user:notify.sh:success
```

---

## Configuration in hooks.json

The `hooks.json` file registers Claude Code hooks (SessionStart, Stop, PreToolUse, PostToolUse).

**Location:** `plugins/babysitter/hooks/hooks.json`

```json
{
  "description": "Babysitter plugin hooks for orchestration loops",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-session-start-hook.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-stop-hook.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting

### Hook Not Executing

**Symptom:** Custom hook is not being called.

**Solutions:**

1. **Verify file is executable:**
   ```bash
   ls -la .a5c/hooks/on-run-complete/my-hook.sh
   # Should show: -rwxr-xr-x (x permission required)

   chmod +x .a5c/hooks/on-run-complete/my-hook.sh
   ```

2. **Verify hook type directory name:**
   ```bash
   # Correct
   .a5c/hooks/on-run-complete/

   # Wrong
   .a5c/hooks/on_run_complete/  # underscore instead of hyphen
   ```

3. **Check for syntax errors:**
   ```bash
   bash -n .a5c/hooks/on-run-complete/my-hook.sh
   ```

### Hook Failing Silently

**Symptom:** Hook runs but produces no output or effect.

**Solutions:**

1. **Add verbose logging to stderr:**
   ```bash
   echo "[my-hook] Starting..." >&2
   echo "[my-hook] Payload: $PAYLOAD" >&2
   ```

2. **Check jq parsing:**
   ```bash
   # Test jq command
   echo '{"runId":"test"}' | jq -r '.runId'
   ```

3. **Verify external services are accessible:**
   ```bash
   # Test Slack webhook
   curl -X POST "$SLACK_WEBHOOK_URL" -d '{"text":"test"}'
   ```

### Hook Breaking JSON Output

**Symptom:** Error messages about invalid JSON.

**Solutions:**

1. **Ensure stdout only contains JSON:**
   ```bash
   # Wrong - prints to stdout
   echo "Processing..."
   echo '{"ok": true}'

   # Correct - logging to stderr
   echo "Processing..." >&2
   echo '{"ok": true}'
   ```

2. **Validate JSON output:**
   ```bash
   # Test your hook's output
   echo '{"runId":"test"}' | ./my-hook.sh | jq .
   ```

### Stop Hook Not Blocking Exit

**Symptom:** Claude Code exits instead of continuing the loop.

**Solutions:**

1. **Verify state file exists:**
   ```bash
   ls -la $CLAUDE_PLUGIN_ROOT/skills/babysit/state/
   ```

2. **Check stop hook output is valid JSON:**
   ```bash
   # Must include decision: "block" to prevent exit
   {"decision": "block", "reason": "...", "systemMessage": "..."}
   ```

3. **Verify session ID is being passed:**
   ```bash
   # Check /tmp/babysitter-stop-hook.log for debugging
   cat /tmp/babysitter-stop-hook.log
   ```

---

## Best Practices

### Do

- **Log to stderr** - Keep stdout clean for JSON output
- **Use `set -euo pipefail`** - Fail fast on errors
- **Parse JSON with jq** - Robust JSON handling
- **Make hooks idempotent** - Safe to run multiple times
- **Use meaningful exit codes** - 0 for success, non-zero for failure
- **Prefix log messages** - `[hook-name]` for easy identification

### Don't

- **Don't block indefinitely** - Use timeouts for external calls
- **Don't print non-JSON to stdout** - Breaks the output protocol
- **Don't rely on working directory** - Use absolute paths
- **Don't store secrets in scripts** - Use environment variables
- **Don't skip error handling** - Validate inputs before processing

---

## Related Documentation

- [Configuration Reference](../reference/configuration.md) - Hook configuration options
- [Glossary](../reference/glossary.md) - Hook terminology definitions
- [Process Definitions](./process-definitions.md) - Using hooks in processes
- [Breakpoints](./breakpoints.md) - on-breakpoint hook integration
- [Run Resumption](./run-resumption.md) - How hooks interact with resumption
- [Best Practices](./best-practices.md) - Patterns for workflow design and team collaboration

---

## Summary

Hooks provide a powerful extension mechanism for customizing Babysitter behavior at every lifecycle stage. Use SDK lifecycle hooks for run orchestration, notifications, and metrics. Use Claude Code hooks for session management and continuous orchestration loops. Follow the input/output protocol (stdin JSON, stdout JSON, stderr logging) and ensure scripts are executable. Place hooks in per-repo, per-user, or plugin directories based on your needs.
