#!/bin/bash
# Native Orchestrator - Decision-Making Only
#
# This hook DECIDES what effects to execute but does NOT execute them.
# It returns effect definitions as JSON for the CLI to emit and the
# orchestrator (skill) to perform.
#
# The hook analyzes run state and returns orchestration decisions:
# - Which tasks to execute
# - Which breakpoints need handling
# - What orchestration actions to take

set -euo pipefail

# Read iteration-start payload
PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
ITERATION=$(echo "$PAYLOAD" | jq -r '.iteration')
TIMESTAMP=$(echo "$PAYLOAD" | jq -r '.timestamp')

if command -v babysitter &>/dev/null; then
  CLI=(babysitter)
else
  _PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$(dirname "$(dirname "$0")")")" && pwd)}"
  SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$_PLUGIN_ROOT/plugin.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
  CLI=(npx -y "@a5c-ai/babysitter-sdk@$SDK_VERSION")
fi

echo "[native-orchestrator] Analyzing run state for iteration $ITERATION" >&2

# Get run status (pass run ID, let CLI resolve path)
RUN_STATUS=$("${CLI[@]}" run:status "$RUN_ID" --json 2>/dev/null || echo '{}')
STATE=$(echo "$RUN_STATUS" | jq -r '.state // "unknown"')

# If run is in terminal state, no effects to emit
if [ "$STATE" = "completed" ] || [ "$STATE" = "failed" ]; then
  echo "[native-orchestrator] Run in terminal state: $STATE" >&2
  echo '{"action":"none","reason":"terminal-state","status":"'$STATE'"}'
  exit 0
fi

# Get pending tasks using task:list
PENDING_TASKS=$("${CLI[@]}" task:list "$RUN_ID" --pending --json 2>/dev/null || echo '{"tasks":[]}')
PENDING_EFFECTS=$(echo "$PENDING_TASKS" | jq -r '.tasks // []')
PENDING_COUNT=$(echo "$PENDING_EFFECTS" | jq 'length')

echo "[native-orchestrator] Found $PENDING_COUNT pending effects" >&2

if [ "$PENDING_COUNT" -eq 0 ]; then
  echo "[native-orchestrator] No pending effects" >&2
  echo '{"action":"none","reason":"no-pending-effects"}'
  exit 0
fi

# Identify auto-runnable node tasks (up to 3)
AUTO_RUNNABLE_TASKS=$(echo "$PENDING_EFFECTS" | jq -r '[.[] | select(.kind == "node")] | .[0:3]')
TASK_COUNT=$(echo "$AUTO_RUNNABLE_TASKS" | jq 'length')

if [ "$TASK_COUNT" -gt 0 ]; then
  echo "[native-orchestrator] Executing $TASK_COUNT node task(s) via run:execute-tasks" >&2

  RUN_DIR=".a5c/runs/$RUN_ID"

  # Delegate all task execution to the CLI command
  EXEC_RESULT=$("${CLI[@]}" run:execute-tasks "$RUN_DIR" --kind node --max-tasks 3 --json 2>/dev/null || echo '{"action":"none","reason":"execute-tasks-failed","count":0,"tasks":[]}')

  echo "[native-orchestrator] run:execute-tasks result: $EXEC_RESULT" >&2

  # Pass through the result directly (already JSON with action/count/reason)
  echo "$EXEC_RESULT"
  exit 0
fi

# Check for breakpoints
BREAKPOINTS=$(echo "$PENDING_EFFECTS" | jq '[.[] | select(.kind == "breakpoint")]')
BREAKPOINT_COUNT=$(echo "$BREAKPOINTS" | jq 'length')

if [ "$BREAKPOINT_COUNT" -gt 0 ]; then
  echo "[native-orchestrator] Found breakpoint(s) requiring user input - pausing orchestration" >&2

  cat <<EOF
{
  "action": "waiting",
  "reason": "breakpoint-waiting",
  "count": $BREAKPOINT_COUNT
}
EOF
  exit 0
fi

# Check for sleep effects
SLEEPS=$(echo "$PENDING_EFFECTS" | jq '[.[] | select(.kind == "sleep")]')
SLEEP_COUNT=$(echo "$SLEEPS" | jq 'length')

if [ "$SLEEP_COUNT" -gt 0 ]; then
  SLEEP_UNTIL=$(echo "$SLEEPS" | jq -r '.[0].schedulerHints.sleepUntilEpochMs // "unknown"')
  echo "[native-orchestrator] Found sleep effect until: $SLEEP_UNTIL" >&2

  cat <<EOF
{
  "action": "waiting",
  "reason": "sleep-waiting",
  "until": $SLEEP_UNTIL
}
EOF
  exit 0
fi

# ─────────────────────────────────────────────────
# Handle skill effects - return invocation instructions for the agent
# ─────────────────────────────────────────────────
SKILL_TASKS=$(echo "$PENDING_EFFECTS" | jq '[.[] | select(.kind == "skill")]')
SKILL_COUNT=$(echo "$SKILL_TASKS" | jq 'length')

if [ "$SKILL_COUNT" -gt 0 ]; then
  echo "[native-orchestrator] Found $SKILL_COUNT skill task(s) - returning for agent invocation" >&2

  # Extract skill names and context for the agent
  SKILL_NAMES=$(echo "$SKILL_TASKS" | jq -r '[.[].label // .[].effectId] | join(", ")')
  SKILL_DETAILS=$(echo "$SKILL_TASKS" | jq -c '[.[] | {
    effectId: .effectId,
    label: (.label // .effectId),
    skill: (.skill // {}),
    kind: "skill"
  }]')

  echo "[native-orchestrator] Skills to invoke: $SKILL_NAMES" >&2

  cat <<EOF
{
  "action": "invoke-skills",
  "count": $SKILL_COUNT,
  "reason": "skill-tasks-pending",
  "skills": $SKILL_DETAILS,
  "instructions": "Use the Skill tool to invoke each skill listed. Pass the skill context from the task definition. Post results via task:post when done."
}
EOF
  exit 0
fi

# Unknown effect type
FIRST_EFFECT=$(echo "$PENDING_EFFECTS" | jq '.[0]')
EFFECT_KIND=$(echo "$FIRST_EFFECT" | jq -r '.kind // "unknown"')

echo "[native-orchestrator] Unknown effect kind: $EFFECT_KIND" >&2
echo '{"action":"none","reason":"unknown-effect-kind","kind":"'$EFFECT_KIND'"}'

exit 0
