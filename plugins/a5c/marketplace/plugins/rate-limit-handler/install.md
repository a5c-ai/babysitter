# Rate Limit Handler -- Install Instructions

Set up Claude Code hooks that detect API rate limit errors and guide Claude to back off gracefully. Uses the actual Claude Code hook API: `StopFailure` for API-level 429s, `PostToolUseFailure` for tool-level rate limits, and `Stop` to inject backoff guidance.

**How Claude Code rate limits work**: When the Anthropic API returns 429, Claude Code fires a `StopFailure` hook with `error: "rate_limit"` and then **stops the session**. Hooks cannot prevent this or retry. What we CAN do is: log the event, track rate limit state, and inject backoff context into Claude's next session so it paces itself. For tool-level failures (MCP tools, external APIs), `PostToolUseFailure` fires and we can inject `additionalContext` telling Claude to slow down.

## Step 1: Interview the User

Ask the user:

- What is the minimum cooldown in seconds after a rate limit before resuming? (default: `30`)
- What is the maximum cooldown in seconds? (default: `300`)
- What backoff multiplier per consecutive rate limit? (default: `2`)
- Should the handler log rate limit events to a file? (default: yes, to `.claude/rate-limit-handler/rate-limits.log`)

## Step 2: Create Plugin Directory

```bash
mkdir -p .claude/rate-limit-handler/scripts
```

## Step 3: Create the Rate Limit Tracker Script

This script is called by hooks to record rate limit events and calculate recommended cooldowns.

Create `.claude/rate-limit-handler/scripts/track-rate-limit.sh`:

```bash
#!/usr/bin/env bash
# track-rate-limit.sh -- Record a rate limit event and calculate cooldown
# Called by StopFailure and PostToolUseFailure hooks
# Reads hook input from stdin, writes state, outputs additionalContext JSON
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PLUGIN_DIR/config.json"
STATE_FILE="$PLUGIN_DIR/state.json"
LOG_FILE="$PLUGIN_DIR/rate-limits.log"

# Load config
MIN_COOLDOWN=$(jq -r '.minCooldown // 30' "$CONFIG_FILE" 2>/dev/null || echo 30)
MAX_COOLDOWN=$(jq -r '.maxCooldown // 300' "$CONFIG_FILE" 2>/dev/null || echo 300)
MULTIPLIER=$(jq -r '.multiplier // 2' "$CONFIG_FILE" 2>/dev/null || echo 2)
ENABLE_LOG=$(jq -r '.enableLog // true' "$CONFIG_FILE" 2>/dev/null || echo true)

# Read hook input from stdin
INPUT=""
if [ ! -t 0 ]; then
  INPUT=$(cat)
fi

# Extract source info from hook input
HOOK_EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // "unknown"' 2>/dev/null || echo "unknown")
ERROR_STR=$(echo "$INPUT" | jq -r '.error // .error_details // ""' 2>/dev/null || echo "")
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")

# Read current state
CONSECUTIVE=0
LAST_COOLDOWN=0
if [ -f "$STATE_FILE" ]; then
  CONSECUTIVE=$(jq -r '.consecutive // 0' "$STATE_FILE" 2>/dev/null || echo 0)
  LAST_COOLDOWN=$(jq -r '.lastCooldown // 0' "$STATE_FILE" 2>/dev/null || echo 0)
fi

# Calculate cooldown with exponential backoff
CONSECUTIVE=$((CONSECUTIVE + 1))
if [ "$LAST_COOLDOWN" -eq 0 ]; then
  COOLDOWN=$MIN_COOLDOWN
else
  COOLDOWN=$((LAST_COOLDOWN * MULTIPLIER))
fi

# Cap at max
if [ "$COOLDOWN" -gt "$MAX_COOLDOWN" ]; then
  COOLDOWN=$MAX_COOLDOWN
fi

# Try to extract retry-after from error string
RETRY_AFTER=$(echo "$ERROR_STR" | grep -oP '(?i)retry.after[:\s]*\K[0-9]+' 2>/dev/null || echo "")
if [ -n "$RETRY_AFTER" ] && [ "$RETRY_AFTER" -gt "$COOLDOWN" ] 2>/dev/null; then
  COOLDOWN=$RETRY_AFTER
  if [ "$COOLDOWN" -gt "$MAX_COOLDOWN" ]; then
    COOLDOWN=$MAX_COOLDOWN
  fi
fi

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)
RESUME_AFTER=$(date -u -d "+${COOLDOWN} seconds" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "in ${COOLDOWN}s")

# Update state
cat > "$STATE_FILE" <<STATEEOF
{
  "consecutive": $CONSECUTIVE,
  "lastCooldown": $COOLDOWN,
  "lastEventAt": "$NOW",
  "resumeAfter": "$RESUME_AFTER",
  "lastHook": "$HOOK_EVENT",
  "lastTool": "$TOOL_NAME",
  "lastError": $(echo "$ERROR_STR" | head -c 500 | jq -Rs .)
}
STATEEOF

# Log if enabled
if [ "$ENABLE_LOG" = "true" ]; then
  echo "[$NOW] Rate limit #$CONSECUTIVE via $HOOK_EVENT${TOOL_NAME:+ (tool: $TOOL_NAME)} -- cooldown ${COOLDOWN}s -- resume after $RESUME_AFTER" >> "$LOG_FILE"
fi

echo "Rate limit detected (#$CONSECUTIVE). Recommended cooldown: ${COOLDOWN}s. Resume after: $RESUME_AFTER" >&2
```

## Step 4: Create the PostToolUseFailure Hook Script

This script detects rate limits in tool errors and injects backoff guidance into Claude's context.

Create `.claude/rate-limit-handler/scripts/on-tool-failure.sh`:

```bash
#!/usr/bin/env bash
# on-tool-failure.sh -- PostToolUseFailure hook
# Checks if the tool error is a rate limit, tracks it, outputs additionalContext
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PLUGIN_DIR/config.json"
STATE_FILE="$PLUGIN_DIR/state.json"

# Read hook input from stdin
INPUT=$(cat)

# Extract the error string (plain text, not JSON object)
ERROR=$(echo "$INPUT" | jq -r '.error // ""' 2>/dev/null || echo "")

if [ -z "$ERROR" ]; then
  exit 0
fi

# Check if error matches rate limit patterns
PATTERNS=$(jq -r '.rateLimitPatterns[]' "$CONFIG_FILE" 2>/dev/null || echo -e "rate.limit\n429\ntoo many requests\nquota exceeded\noverloaded\nthrottle")
MATCHED=false
while IFS= read -r pattern; do
  if echo "$ERROR" | grep -iqE "$pattern" 2>/dev/null; then
    MATCHED=true
    break
  fi
done <<< "$PATTERNS"

if [ "$MATCHED" != "true" ]; then
  # Not a rate limit error, pass through
  exit 0
fi

# Track the rate limit event
echo "$INPUT" | bash "$SCRIPT_DIR/track-rate-limit.sh"

# Read the calculated cooldown from state
COOLDOWN=$(jq -r '.lastCooldown // 30' "$STATE_FILE" 2>/dev/null || echo 30)
CONSECUTIVE=$(jq -r '.consecutive // 1' "$STATE_FILE" 2>/dev/null || echo 1)
RESUME_AFTER=$(jq -r '.resumeAfter // "unknown"' "$STATE_FILE" 2>/dev/null || echo "unknown")

# Output additionalContext to guide Claude
# This JSON is parsed by Claude Code and the additionalContext is injected into Claude's context
cat <<HOOKEOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUseFailure",
    "additionalContext": "RATE LIMIT DETECTED (occurrence #${CONSECUTIVE}). The tool call was rate-limited. DO NOT immediately retry the same call. Wait at least ${COOLDOWN} seconds before attempting similar API calls. If you need to continue working, focus on tasks that don't require this API. Resume API calls after: ${RESUME_AFTER}"
  }
}
HOOKEOF
```

## Step 5: Create the StopFailure Hook Script

This fires when the Anthropic API itself returns 429. The hook output is notification-only (Claude Code ignores it), but we log the event and update state so the next session can read it.

Create `.claude/rate-limit-handler/scripts/on-stop-failure.sh`:

```bash
#!/usr/bin/env bash
# on-stop-failure.sh -- StopFailure hook (notification-only, output is ignored)
# Logs API-level rate limits and updates state for next session
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read hook input from stdin
INPUT=$(cat)

# Check if this is a rate limit error
ERROR_TYPE=$(echo "$INPUT" | jq -r '.error // ""' 2>/dev/null || echo "")

if [ "$ERROR_TYPE" != "rate_limit" ]; then
  exit 0
fi

# Track the rate limit (output is ignored by Claude Code for StopFailure, but state is saved)
echo "$INPUT" | bash "$SCRIPT_DIR/track-rate-limit.sh"
```

## Step 6: Create the SessionStart Hook Script

On session start, check if there's a recent rate limit state and inject cooldown guidance.

Create `.claude/rate-limit-handler/scripts/on-session-start.sh`:

```bash
#!/usr/bin/env bash
# on-session-start.sh -- SessionStart hook
# If a recent rate limit occurred, warn Claude at session start
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$PLUGIN_DIR/state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

CONSECUTIVE=$(jq -r '.consecutive // 0' "$STATE_FILE" 2>/dev/null || echo 0)

if [ "$CONSECUTIVE" -eq 0 ]; then
  exit 0
fi

LAST_EVENT=$(jq -r '.lastEventAt // ""' "$STATE_FILE" 2>/dev/null || echo "")
RESUME_AFTER=$(jq -r '.resumeAfter // ""' "$STATE_FILE" 2>/dev/null || echo "")
COOLDOWN=$(jq -r '.lastCooldown // 30' "$STATE_FILE" 2>/dev/null || echo 30)

# Check if resume time has passed (if we can parse it)
NOW_EPOCH=$(date -u +%s 2>/dev/null || echo 0)
RESUME_EPOCH=$(date -u -d "$RESUME_AFTER" +%s 2>/dev/null || echo 0)

if [ "$NOW_EPOCH" -gt 0 ] && [ "$RESUME_EPOCH" -gt 0 ] && [ "$NOW_EPOCH" -ge "$RESUME_EPOCH" ]; then
  # Cooldown period has passed, reset state
  echo '{"consecutive": 0, "lastCooldown": 0}' > "$STATE_FILE"
  exit 0
fi

# Still in cooldown -- output warning (stdout with exit 0 is added to Claude's context on SessionStart)
REMAINING=0
if [ "$NOW_EPOCH" -gt 0 ] && [ "$RESUME_EPOCH" -gt 0 ]; then
  REMAINING=$((RESUME_EPOCH - NOW_EPOCH))
fi

if [ "$REMAINING" -gt 0 ]; then
  echo "WARNING: This project hit ${CONSECUTIVE} consecutive rate limit(s) recently (last: ${LAST_EVENT}). Cooldown of ~${REMAINING}s remaining. Pace your API calls -- avoid rapid-fire tool usage. If rate limits persist, consider switching to a different task or waiting."
else
  echo "WARNING: This project hit ${CONSECUTIVE} consecutive rate limit(s) recently (last: ${LAST_EVENT}). Pace your API calls to avoid hitting limits again."
fi
```

## Step 7: Create the Reset Script

Resets rate limit state after a period of successful operation.

Create `.claude/rate-limit-handler/scripts/reset-on-success.sh`:

```bash
#!/usr/bin/env bash
# reset-on-success.sh -- PostToolUse hook
# Resets consecutive rate limit counter after successful tool calls
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$PLUGIN_DIR/state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

CONSECUTIVE=$(jq -r '.consecutive // 0' "$STATE_FILE" 2>/dev/null || echo 0)

if [ "$CONSECUTIVE" -eq 0 ]; then
  exit 0
fi

# On successful tool use, decrement consecutive counter (gradual recovery)
# This avoids immediately resetting after one success amidst many failures
NEW_COUNT=$((CONSECUTIVE - 1))

if [ "$NEW_COUNT" -le 0 ]; then
  echo '{"consecutive": 0, "lastCooldown": 0}' > "$STATE_FILE"
else
  # Preserve other fields, just update consecutive
  jq --argjson c "$NEW_COUNT" '.consecutive = $c' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
fi

exit 0
```

## Step 8: Create the Configuration File

Create `.claude/rate-limit-handler/config.json` with the user's selections:

```json
{
  "minCooldown": 30,
  "maxCooldown": 300,
  "multiplier": 2,
  "enableLog": true,
  "rateLimitPatterns": [
    "rate.limit",
    "rate_limit",
    "429",
    "too many requests",
    "quota exceeded",
    "overloaded",
    "throttle",
    "capacity"
  ]
}
```

Adjust `minCooldown`, `maxCooldown`, and `multiplier` based on the user's answers from Step 1.

## Step 9: Create the Initial State File

Create `.claude/rate-limit-handler/state.json`:

```json
{
  "consecutive": 0,
  "lastCooldown": 0
}
```

## Step 10: Make Scripts Executable

```bash
chmod +x .claude/rate-limit-handler/scripts/*.sh
```

## Step 11: Configure Claude Code Hooks

Merge the following hooks into `.claude/settings.json`. Preserve all existing hooks -- append to existing arrays.

```json
{
  "hooks": {
    "PostToolUseFailure": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/rate-limit-handler/scripts/on-tool-failure.sh"
          }
        ]
      }
    ],
    "StopFailure": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/rate-limit-handler/scripts/on-stop-failure.sh"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/rate-limit-handler/scripts/on-session-start.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/rate-limit-handler/scripts/reset-on-success.sh"
          }
        ]
      }
    ]
  }
}
```

### How the hooks work:

| Hook Event | Stdin `error` Field | What it does |
|------------|-------------------|--------------|
| `PostToolUseFailure` | Plain string (e.g., `"429 Too Many Requests"`) | Pattern-matches error against `rateLimitPatterns`, tracks event, outputs `additionalContext` telling Claude to back off |
| `StopFailure` | Enum: `"rate_limit"`, `"server_error"`, etc. | Logs API-level 429s and updates state. Output is **ignored** by Claude Code (notification-only hook) |
| `SessionStart` | `{ "session_id": "..." }` | Checks if recent rate limits occurred; if so, outputs warning text that Claude Code injects into Claude's context |
| `PostToolUse` | N/A (success path) | Decrements the consecutive counter -- gradual recovery after successful calls |

### Important limitations:

- **`StopFailure` cannot prevent the session from stopping.** When the Anthropic API itself returns 429, Claude Code stops. The hook can only log and update state for the next session.
- **Hooks cannot sleep or retry.** The `PostToolUseFailure` hook injects `additionalContext` to guide Claude's behavior, but Claude (the LLM) decides whether to wait.
- **The `additionalContext` field is injected into Claude's context** as a system-level observation. Claude typically respects rate limit warnings in this context.

## Step 12: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name rate-limit-handler --plugin-version 2.0.0 --marketplace-name marketplace --project --json
```

## Step 13: Verify Setup

```bash
# 1. Check config and state exist
cat .claude/rate-limit-handler/config.json
cat .claude/rate-limit-handler/state.json

# 2. Check hooks in settings
jq '.hooks | keys' .claude/settings.json

# 3. Simulate a tool failure rate limit (test the PostToolUseFailure hook)
echo '{"hook_event_name":"PostToolUseFailure","tool_name":"Bash","error":"429 Too Many Requests","tool_input":{"command":"test"}}' | bash .claude/rate-limit-handler/scripts/on-tool-failure.sh
echo "Exit code: $?"

# 4. Check state was updated
cat .claude/rate-limit-handler/state.json

# 5. Simulate a StopFailure rate limit
echo '{"hook_event_name":"StopFailure","error":"rate_limit","error_details":"429 Too Many Requests"}' | bash .claude/rate-limit-handler/scripts/on-stop-failure.sh

# 6. Test session start warning
echo '{"session_id":"test-session"}' | bash .claude/rate-limit-handler/scripts/on-session-start.sh

# 7. Reset state
echo '{"consecutive": 0, "lastCooldown": 0}' > .claude/rate-limit-handler/state.json
```

## Notes

- The handler uses **gradual recovery**: each successful tool call decrements the consecutive counter by 1, rather than immediately resetting. This prevents aggressive retry after a single success amidst ongoing rate limiting.
- `PostToolUseFailure` fires for any tool failure (MCP tools, Bash errors, etc.), not just API rate limits. The pattern matching in `on-tool-failure.sh` ensures only rate-limit-like errors trigger the handler.
- The `additionalContext` injected by `PostToolUseFailure` is a strong signal to Claude -- it appears as a system observation alongside the tool error and Claude typically adjusts its behavior accordingly.
- API-level rate limits (`StopFailure`) terminate the session. The `SessionStart` hook in the next session reads the state and warns Claude to pace itself.
- The retry log at `.claude/rate-limit-handler/rate-limits.log` shows the full history of rate limit events for debugging patterns.
