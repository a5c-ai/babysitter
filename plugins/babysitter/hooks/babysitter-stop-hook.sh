#!/bin/bash

# Babysitter Stop Hook
# Prevents session exit when a babysitter run is active
# Feeds Claude's output back as input to continue the loop

set -euo pipefail

# Read hook input from stdin (advanced stop hook API)
HOOK_INPUT=$(cat)
echo "✅ Babysitter run: Hook input: $HOOK_INPUT" > /tmp/babysitter-stop-hook.log
# Extract session_id from hook input
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
if [[ -z "$SESSION_ID" ]]; then
  # No session ID available - allow exit
  echo "⚠️  Babysitter run: No session ID available" >> /tmp/babysitter-stop-hook.log
  echo "   Hook input: $HOOK_INPUT" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

# Export session ID for use in this script and any called scripts
export CLAUDE_SESSION_ID="$SESSION_ID"

# Also try to source environment file if available
# (SessionEnd hooks may have CLAUDE_ENV_FILE available)
if [[ -n "${CLAUDE_ENV_FILE:-}" ]] && [[ -f "$CLAUDE_ENV_FILE" ]]; then
  # Source environment variables set during SessionStart
  # shellcheck disable=SC1090
  source "$CLAUDE_ENV_FILE" 2>/dev/null || true
fi

# Determine state directory (plugin-relative for session isolation)
if [[ -n "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
  STATE_DIR="$CLAUDE_PLUGIN_ROOT/skills/babysit/state"
else
  # Fallback: derive from script location (hooks/stop-hook.sh -> plugin root)
  STATE_DIR="$(dirname "$(dirname "$0")")/skills/babysit/state"
fi

# Check if babysitter-run is active for THIS session
BABYSITTER_STATE_FILE="$STATE_DIR/${SESSION_ID}.md"

if [[ ! -f "$BABYSITTER_STATE_FILE" ]]; then
  # No active loop - allow exit
  echo "⚠️  Babysitter run: No active loop" >> /tmp/babysitter-stop-hook.log
  echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
  echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

# Parse markdown frontmatter (YAML between ---) and extract values
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$BABYSITTER_STATE_FILE")
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
# Extract run_id (may be empty for newly created runs until populated by the skill)
RUN_ID=$(echo "$FRONTMATTER" | grep '^run_id:' | sed 's/run_id: *//' | sed 's/^"\(.*\)"$/\1/')

# Validate numeric fields before arithmetic operations
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Babysitter run: State file corrupted" >&2
  echo "   File: $BABYSITTER_STATE_FILE" >&2
  echo "   Problem: 'iteration' field is not a valid number (got: '$ITERATION')" >&2
  echo "" >&2
  echo "   This usually means the state file was manually edited or corrupted." >&2
  echo "   Babysitter run is stopping. Run /babysitter:babysit again to start fresh." >&2
  rm "$BABYSITTER_STATE_FILE"
  echo "⚠️  Babysitter run: Max iterations not a valid number" >> /tmp/babysitter-stop-hook.log
  echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
  echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Babysitter run: State file corrupted" >&2
  echo "   File: $BABYSITTER_STATE_FILE" >&2
  echo "   Problem: 'max_iterations' field is not a valid number (got: '$MAX_ITERATIONS')" >&2
  echo "" >&2
  echo "   This usually means the state file was manually edited or corrupted." >&2
  echo "   Babysitter run is stopping. Run /babysitter:babysit again to start fresh." >&2
  rm "$BABYSITTER_STATE_FILE"
  exit 0
fi

# Check if max iterations reached
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "🛑 Babysitter run: Max iterations ($MAX_ITERATIONS) reached."
  rm "$BABYSITTER_STATE_FILE"
  echo "⚠️  Babysitter run: Transcript file not found" >> /tmp/babysitter-stop-hook.log
  echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
  echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

# Get transcript path from hook input
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "⚠️  Babysitter run: Transcript file not found" >&2
  echo "   Expected: $TRANSCRIPT_PATH" >&2
  echo "   This is unusual and may indicate a Claude Code internal issue." >&2
  echo "   Babysitter run is stopping." >&2
  rm "$BABYSITTER_STATE_FILE"
  exit 0
fi

# Read last assistant message from transcript (JSONL format - one JSON per line)
# First check if there are any assistant messages
if ! grep -q '"role":"assistant"' "$TRANSCRIPT_PATH"; then
  echo "⚠️  Babysitter run: No assistant messages found in transcript" >&2
  echo "   Transcript: $TRANSCRIPT_PATH" >&2
  echo "   This is unusual and may indicate a transcript format issue" >&2
  echo "   Babysitter run is stopping." >&2
  rm "$BABYSITTER_STATE_FILE"
  echo "⚠️  Babysitter run: Failed to extract last assistant message" >> /tmp/babysitter-stop-hook.log
  echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
  echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

# Extract last assistant message with explicit error handling
LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
if [[ -z "$LAST_LINE" ]]; then
  echo "⚠️  Babysitter run: Failed to extract last assistant message" >&2
  echo "   Babysitter run is stopping." >&2
  rm "$BABYSITTER_STATE_FILE"
  exit 0
fi

# Parse JSON with error handling
LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
  .message.content |
  map(select(.type == "text")) |
  map(.text) |
  join("\n")
' 2>&1)

# Check if jq succeeded
if [[ $? -ne 0 ]]; then
  echo "⚠️  Babysitter run: Failed to parse assistant message JSON" >&2
  echo "   Error: $LAST_OUTPUT" >&2
  echo "   This may indicate a transcript format issue" >&2
  echo "   Babysitter run is stopping." >&2
  rm "$BABYSITTER_STATE_FILE"
  echo "⚠️  Babysitter run: Failed to parse assistant message JSON" >> /tmp/babysitter-stop-hook.log
  echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
  echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

if [[ -z "$LAST_OUTPUT" ]]; then
  echo "⚠️  Babysitter run: Assistant message contained no text content" >&2
  echo "   Babysitter run is stopping." >&2
  rm "$BABYSITTER_STATE_FILE"
  echo "⚠️  Babysitter run: Assistant message contained no text content" >> /tmp/babysitter-stop-hook.log
  echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
  echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

# If we have a run_id, check run state from the SDK.
COMPLETION_SECRET=""
RUN_STATE=""
PENDING_KINDS=""
if [[ -n "${RUN_ID:-}" ]]; then
  CLI="npx -y @a5c-ai/babysitter-sdk@latest"
  RUN_STATUS=$($CLI run:status "$RUN_ID" --json 2>/dev/null || echo '{}')
  RUN_STATE=$(echo "$RUN_STATUS" | jq -r '.state // empty')
  PENDING_KINDS=$(echo "$RUN_STATUS" | jq -r '.pendingByKind | keys | join(", ") // empty' 2>/dev/null || echo "")
  echo "✅ Babysitter run: Run state: $RUN_STATE" >> /tmp/babysitter-stop-hook.log
  if [[ "$RUN_STATE" == "completed" ]]; then
    COMPLETION_SECRET=$(echo "$RUN_STATUS" | jq -r '.completionSecret // empty')
    echo "✅ Babysitter run: Completion secret: $COMPLETION_SECRET" >> /tmp/babysitter-stop-hook.log
  fi
  echo "✅ Babysitter run: Pending kinds: $PENDING_KINDS" >> /tmp/babysitter-stop-hook.log
  echo "✅ Babysitter run: Run status: $RUN_STATUS" >> /tmp/babysitter-stop-hook.log
fi

# If a completion secret is available, require the matching <promise> tag to exit.
if [[ -n "$COMPLETION_SECRET" ]]; then
  # Extract text from <promise> tags using Perl for multiline support
  PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")
  if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_SECRET" ]]; then
    echo "✅ Babysitter run: Detected <promise>$COMPLETION_SECRET</promise>"
    rm "$BABYSITTER_STATE_FILE"
    echo "✅ Babysitter run: Detected <promise>$COMPLETION_SECRET</promise>" >> /tmp/babysitter-stop-hook.log
    echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
    echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
    exit 0
  fi
fi

# Not complete - continue loop with SAME PROMPT
NEXT_ITERATION=$((ITERATION + 1))

# Extract prompt (everything after the closing ---)
# Skip first --- line, skip until second --- line, then print everything after
# Use i>=2 instead of i==2 to handle --- in prompt content
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$BABYSITTER_STATE_FILE")

if [[ -z "$PROMPT_TEXT" ]]; then
  echo "⚠️  Babysitter run: State file corrupted or incomplete" >&2
  echo "   File: $BABYSITTER_STATE_FILE" >&2
  echo "   Problem: No prompt text found" >&2
  echo "" >&2
  echo "   This usually means:" >&2
  echo "     • State file was manually edited" >&2
  echo "     • File was corrupted during writing" >&2
  echo "" >&2
  echo "   Babysitter run is stopping. Run /babysitter:babysit again to start fresh." >&2
  rm "$BABYSITTER_STATE_FILE"
  echo "⚠️  Babysitter run: State file corrupted or incomplete" >> /tmp/babysitter-stop-hook.log
  echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
  echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
  exit 0
fi

# Update iteration in frontmatter (portable across macOS and Linux)
# Create temp file, then atomically replace
TEMP_FILE="${BABYSITTER_STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$BABYSITTER_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$BABYSITTER_STATE_FILE"
echo "✅ Babysitter run: Updated iteration to $NEXT_ITERATION" >> /tmp/babysitter-stop-hook.log
echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log

# Build system message with iteration count and status info
if [[ -n "$COMPLETION_SECRET" ]]; then
  SYSTEM_MSG="🔄 Babysitter iteration $NEXT_ITERATION | Run completed! To finish: call 'run:status --json' on your run, extract 'completionSecret' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise."
elif [[ "$RUN_STATE" == "waiting" ]] && [[ -n "$PENDING_KINDS" ]]; then
  SYSTEM_MSG="🔄 Babysitter iteration $NEXT_ITERATION | Waiting on: $PENDING_KINDS. Check if pending effects are resolved, then call run:iterate."
elif [[ "$RUN_STATE" == "failed" ]]; then
  SYSTEM_MSG="🔄 Babysitter iteration $NEXT_ITERATION | Failed. manually fix the run, journal or process (inspect the sdk.md if needed) and proceed."
else
  SYSTEM_MSG="🔄 Babysitter iteration $NEXT_ITERATION | Continue orchestration (run:iterate)"
fi

echo "✅ Babysitter run: Outputting JSON to block the stop and feed prompt back" >> /tmp/babysitter-stop-hook.log
echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
# Output JSON to block the stop and feed prompt back
# The "reason" field contains the prompt that will be sent back to Claude
jq -n \
  --arg prompt "$PROMPT_TEXT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "instructions": "use the babysitter skill to advance the orchestration to the next state (run:iterate) or perform the pending effects (task:list --pending --json), or fix the run if it failed.",
    "reason": $prompt,
    "systemMessage": $msg
  }'
echo "✅ Babysitter run: Output JSON: $JSON_OUTPUT" >> /tmp/babysitter-stop-hook.log
echo "   State file: $BABYSITTER_STATE_FILE" >> /tmp/babysitter-stop-hook.log
echo "   Session ID: $SESSION_ID" >> /tmp/babysitter-stop-hook.log
echo "✅ Babysitter run: Exiting 0 for successful hook execution" >> /tmp/babysitter-stop-hook.log
# Exit 0 for successful hook execution
exit 0