# Rate Limit Handler — Install Instructions

Set up Claude Code hooks that detect and handle API rate limit errors with exponential backoff, jitter, and automatic retry. These are **Claude Code hooks** (not babysitter hooks) — they integrate directly into the Claude Code lifecycle.

## Step 1: Interview the User

Ask the user for their preferred configuration:

### Backoff Strategy

1. **Exponential with jitter** (recommended) — Base delay doubles each retry with random jitter to prevent thundering herd. Best for shared API keys or team usage.
2. **Fixed interval** — Constant delay between retries. Simpler but less efficient.
3. **Linear backoff** — Delay increases linearly. Middle ground between fixed and exponential.

### Configuration Options

Ask the user:
- What is the initial backoff delay in seconds? (default: `5`)
- What is the maximum backoff delay in seconds? (default: `120`)
- What is the maximum number of retries before giving up? (default: `10`)
- Should the handler log retry attempts to a file? (default: yes, to `.claude/rate-limit-handler/retry.log`)

## Step 2: Create Plugin Directory

```bash
mkdir -p .claude/rate-limit-handler/scripts
```

## Step 3: Create the Rate Limit Detection and Sleep Script

Create `.claude/rate-limit-handler/scripts/handle-rate-limit.sh`:

```bash
#!/bin/bash
# handle-rate-limit.sh — Exponential backoff with jitter for Claude API rate limits
#
# Called by Claude Code hooks when a rate limit is detected.
# Reads config from .claude/rate-limit-handler/config.json
# Tracks retry state in .claude/rate-limit-handler/state.json

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PLUGIN_DIR/config.json"
STATE_FILE="$PLUGIN_DIR/state.json"
LOG_FILE="$PLUGIN_DIR/retry.log"

# Load config
INITIAL_DELAY=$(jq -r '.initialDelay // 5' "$CONFIG_FILE" 2>/dev/null || echo 5)
MAX_DELAY=$(jq -r '.maxDelay // 120' "$CONFIG_FILE" 2>/dev/null || echo 120)
MAX_RETRIES=$(jq -r '.maxRetries // 10' "$CONFIG_FILE" 2>/dev/null || echo 10)
STRATEGY=$(jq -r '.strategy // "exponential-jitter"' "$CONFIG_FILE" 2>/dev/null || echo "exponential-jitter")
ENABLE_LOG=$(jq -r '.enableLog // true' "$CONFIG_FILE" 2>/dev/null || echo true)

# Read current retry count from state
if [ -f "$STATE_FILE" ]; then
  RETRY_COUNT=$(jq -r '.retryCount // 0' "$STATE_FILE")
  LAST_RETRY=$(jq -r '.lastRetryAt // ""' "$STATE_FILE")
else
  RETRY_COUNT=0
  LAST_RETRY=""
fi

# Check if we've exceeded max retries
if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
  echo "Rate limit: max retries ($MAX_RETRIES) exceeded. Resetting state." >&2
  echo '{"retryCount": 0, "lastRetryAt": "", "totalWaited": 0}' > "$STATE_FILE"
  echo "Rate limit handler exhausted $MAX_RETRIES retries. Consider waiting longer or checking your API quota." >&2
  exit 2
fi

# Calculate delay based on strategy
case "$STRATEGY" in
  "exponential-jitter")
    BASE_DELAY=$(echo "$INITIAL_DELAY * (2 ^ $RETRY_COUNT)" | bc 2>/dev/null || echo "$INITIAL_DELAY")
    # Add jitter: random value between 0 and BASE_DELAY/2
    JITTER=$(( RANDOM % (${BASE_DELAY%.*} / 2 + 1) ))
    DELAY=$(echo "$BASE_DELAY + $JITTER" | bc 2>/dev/null || echo "$BASE_DELAY")
    ;;
  "linear")
    DELAY=$(echo "$INITIAL_DELAY + ($INITIAL_DELAY * $RETRY_COUNT)" | bc 2>/dev/null || echo "$INITIAL_DELAY")
    ;;
  "fixed")
    DELAY=$INITIAL_DELAY
    ;;
  *)
    DELAY=$INITIAL_DELAY
    ;;
esac

# Cap at max delay
if [ "$(echo "$DELAY > $MAX_DELAY" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
  DELAY=$MAX_DELAY
fi

# Parse retry-after from stdin if available (hook input JSON)
RETRY_AFTER=""
if [ -t 0 ]; then
  : # stdin is terminal, skip
else
  INPUT=$(cat)
  # Try to extract retry-after from error message or headers
  RETRY_AFTER=$(echo "$INPUT" | jq -r '
    .tool_error // .error // .message // "" |
    capture("retry.after[: ]*(?<secs>[0-9]+)"; "i") // {} |
    .secs // ""
  ' 2>/dev/null || echo "")
fi

# If retry-after header found, use it (capped at max)
if [ -n "$RETRY_AFTER" ] && [ "$RETRY_AFTER" -gt 0 ] 2>/dev/null; then
  if [ "$RETRY_AFTER" -gt "$MAX_DELAY" ]; then
    DELAY=$MAX_DELAY
  else
    DELAY=$RETRY_AFTER
  fi
fi

DELAY=${DELAY%.*}  # Truncate to integer

# Update state
NEW_COUNT=$((RETRY_COUNT + 1))
TOTAL_WAITED=$(jq -r ".totalWaited // 0" "$STATE_FILE" 2>/dev/null || echo 0)
NEW_TOTAL=$(echo "$TOTAL_WAITED + $DELAY" | bc 2>/dev/null || echo "$DELAY")
NOW=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)

cat > "$STATE_FILE" <<EOF
{
  "retryCount": $NEW_COUNT,
  "lastRetryAt": "$NOW",
  "lastDelay": $DELAY,
  "totalWaited": ${NEW_TOTAL%.*},
  "strategy": "$STRATEGY"
}
EOF

# Log if enabled
if [ "$ENABLE_LOG" = "true" ]; then
  echo "[$NOW] Retry $NEW_COUNT/$MAX_RETRIES — sleeping ${DELAY}s (strategy: $STRATEGY)" >> "$LOG_FILE"
fi

# Sleep
echo "Rate limited. Retry $NEW_COUNT/$MAX_RETRIES — waiting ${DELAY}s before continuing..." >&2
sleep "$DELAY"

# Exit 0 so Claude Code continues (not exit 2 which would block)
exit 0
```

## Step 4: Create the Reset Script

Create `.claude/rate-limit-handler/scripts/reset-state.sh`:

```bash
#!/bin/bash
# reset-state.sh — Reset retry state after a successful operation
# Called by PostToolUse hook on success to clear backoff state

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$PLUGIN_DIR/state.json"

if [ -f "$STATE_FILE" ]; then
  RETRY_COUNT=$(jq -r '.retryCount // 0' "$STATE_FILE" 2>/dev/null || echo 0)
  if [ "$RETRY_COUNT" -gt 0 ]; then
    echo '{"retryCount": 0, "lastRetryAt": "", "totalWaited": 0}' > "$STATE_FILE"
  fi
fi

exit 0
```

## Step 5: Create the Configuration File

Create `.claude/rate-limit-handler/config.json` with the user's selections:

```json
{
  "strategy": "exponential-jitter",
  "initialDelay": 5,
  "maxDelay": 120,
  "maxRetries": 10,
  "enableLog": true,
  "rateLimitPatterns": [
    "rate limit",
    "rate_limit",
    "429",
    "too many requests",
    "quota exceeded",
    "overloaded",
    "capacity",
    "throttle"
  ]
}
```

Adjust `strategy`, `initialDelay`, `maxDelay`, and `maxRetries` based on the user's answers from Step 1.

## Step 6: Create the Initial State File

Create `.claude/rate-limit-handler/state.json`:

```json
{
  "retryCount": 0,
  "lastRetryAt": "",
  "totalWaited": 0
}
```

## Step 7: Make Scripts Executable

```bash
chmod +x .claude/rate-limit-handler/scripts/handle-rate-limit.sh
chmod +x .claude/rate-limit-handler/scripts/reset-state.sh
```

## Step 8: Configure Claude Code Hooks

Add hooks to the project's `.claude/settings.json`. Read the existing file first, then merge these hook entries into the `hooks` object:

### Hook 1: Detect rate limits from tool failures

Add to the `hooks` array in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUseFailure": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_ERROR\" | grep -iqE 'rate.limit|rate_limit|429|too many requests|quota exceeded|overloaded|throttle'; then bash .claude/rate-limit-handler/scripts/handle-rate-limit.sh <<< \"$CLAUDE_TOOL_ERROR\"; else exit 0; fi"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": ".*rate.limit.*|.*429.*|.*too many requests.*|.*quota.*|.*overloaded.*|.*throttle.*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/rate-limit-handler/scripts/handle-rate-limit.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/rate-limit-handler/scripts/reset-state.sh"
          }
        ]
      }
    ]
  }
}
```

**Important**: When merging into existing settings.json:
- If `hooks` already exists, add these entries to the existing hook arrays (don't overwrite)
- If `PostToolUseFailure`, `Notification`, or `PostToolUse` arrays already have entries, append to them
- Preserve all existing hooks and settings

### How the hooks work:

| Hook Event | Trigger | Action |
|-----------|---------|--------|
| `PostToolUseFailure` | Any tool call fails | Checks if error matches rate limit patterns; if so, runs backoff sleep |
| `Notification` | Claude Code shows a notification matching rate limit patterns | Runs backoff sleep |
| `PostToolUse` | Any tool call succeeds | Resets retry counter (rate limit resolved) |

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name rate-limit-handler --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

Test the installation:

1. Check that config exists: `cat .claude/rate-limit-handler/config.json`
2. Check hooks are in settings: `cat .claude/settings.json | jq '.hooks'`
3. Test the backoff script manually:
   ```bash
   echo '{"tool_error": "rate limit exceeded, retry after 30 seconds"}' | bash .claude/rate-limit-handler/scripts/handle-rate-limit.sh
   ```
4. Verify state was updated: `cat .claude/rate-limit-handler/state.json`
5. Reset state: `bash .claude/rate-limit-handler/scripts/reset-state.sh`

## Notes

- The handler automatically resets its retry counter after any successful tool call, so it doesn't accumulate across unrelated errors.
- If max retries are exhausted, the handler resets and reports to stderr (exit code 2), which Claude Code will see as a blocking error and can decide to wait longer or inform the user.
- The retry log at `.claude/rate-limit-handler/retry.log` can be inspected to understand rate limit patterns over time.
- For team usage with shared API keys, consider increasing `maxRetries` and `maxDelay` and using the exponential-jitter strategy to avoid thundering herd.
- Known issue: Claude Code sessions can get permanently stuck on rate limits (see GitHub issue #26699). This plugin mitigates this by implementing proper backoff instead of immediate retries.
