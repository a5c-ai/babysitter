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

CLI=(npx -y @a5c-ai/babysitter-sdk@latest)

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
  echo "[native-orchestrator] Executing $TASK_COUNT node task(s) (external execution + task:post)" >&2

  RUN_DIR=".a5c/runs/$RUN_ID"

  echo "$AUTO_RUNNABLE_TASKS" | jq -c '.[]' | while read -r task; do
    EFFECT_ID=$(echo "$task" | jq -r '.effectId')
    LABEL=$(echo "$task" | jq -r '.label // "unknown"')

    echo "[native-orchestrator]   Executing: $EFFECT_ID ($LABEL)" >&2

    TASK_JSON="$RUN_DIR/tasks/$EFFECT_ID/task.json"
    if [ ! -f "$TASK_JSON" ]; then
      echo "[native-orchestrator]   ✗ Missing task definition: $TASK_JSON" >&2
      "${CLI[@]}" task:post "$RUN_ID" "$EFFECT_ID" --status error --error - --stdout-ref "tasks/$EFFECT_ID/stdout.log" --stderr-ref "tasks/$EFFECT_ID/stderr.log" <<EOF 2>&1 >&2
{"name":"Error","message":"Missing task definition for effect $EFFECT_ID","data":{"taskJson":"$TASK_JSON"}}
EOF
      continue
    fi

    ENTRY=$(jq -r '.node.entry // empty' "$TASK_JSON")
    if [ -z "$ENTRY" ]; then
      echo "[native-orchestrator]   ✗ Missing node.entry in task.json for $EFFECT_ID" >&2
      "${CLI[@]}" task:post "$RUN_ID" "$EFFECT_ID" --status error --error - <<EOF 2>&1 >&2
{"name":"Error","message":"Missing node.entry in task definition","data":{"effectId":"$EFFECT_ID"}}
EOF
      continue
    fi

    # Resolve IO paths (run-relative refs)
    INPUT_REF=$(jq -r '.io.inputJsonPath // ("tasks/" + "'"$EFFECT_ID"'" + "/inputs.json")' "$TASK_JSON")
    OUTPUT_REF=$(jq -r '.io.outputJsonPath // ("tasks/" + "'"$EFFECT_ID"'" + "/result.json")' "$TASK_JSON")
    STDOUT_REF=$(jq -r '.io.stdoutPath // ("tasks/" + "'"$EFFECT_ID"'" + "/stdout.log")' "$TASK_JSON")
    STDERR_REF=$(jq -r '.io.stderrPath // ("tasks/" + "'"$EFFECT_ID"'" + "/stderr.log")' "$TASK_JSON")

    INPUT_ABS="$RUN_DIR/$INPUT_REF"
    OUTPUT_ABS="$RUN_DIR/$OUTPUT_REF"
    STDOUT_ABS="$RUN_DIR/$STDOUT_REF"
    STDERR_ABS="$RUN_DIR/$STDERR_REF"

    mkdir -p "$(dirname "$INPUT_ABS")" "$(dirname "$OUTPUT_ABS")" "$(dirname "$STDOUT_ABS")" "$(dirname "$STDERR_ABS")"

    # Stage inputs.json from task.json (inline inputs or inputsRef)
    INPUTS_REF=$(jq -r '.inputsRef // empty' "$TASK_JSON")
    if [ -n "$INPUTS_REF" ] && [ -f "$RUN_DIR/$INPUTS_REF" ]; then
      cp "$RUN_DIR/$INPUTS_REF" "$INPUT_ABS"
    else
      # Default to {} when missing
      jq -c '.inputs // {}' "$TASK_JSON" > "$INPUT_ABS"
    fi

    # Resolve entry and cwd relative to runDir unless absolute.
    if [[ "$ENTRY" = /* ]] || [[ "$ENTRY" =~ ^[A-Za-z]:[\\/].* ]]; then
      ENTRY_ABS="$ENTRY"
    else
      ENTRY_ABS="$RUN_DIR/$ENTRY"
    fi

    CWD=$(jq -r '.node.cwd // empty' "$TASK_JSON")
    if [ -n "$CWD" ]; then
      if [[ "$CWD" = /* ]] || [[ "$CWD" =~ ^[A-Za-z]:[\\/].* ]]; then
        CWD_ABS="$CWD"
      else
        CWD_ABS="$RUN_DIR/$CWD"
      fi
    else
      CWD_ABS="$RUN_DIR"
    fi

    mapfile -t NODE_ARGS < <(jq -r '.node.args // [] | .[]' "$TASK_JSON")

    export BABYSITTER_INPUT_JSON="$INPUT_ABS"
    export BABYSITTER_OUTPUT_JSON="$OUTPUT_ABS"
    export BABYSITTER_STDOUT_PATH="$STDOUT_ABS"
    export BABYSITTER_STDERR_PATH="$STDERR_ABS"
    export BABYSITTER_EFFECT_ID="$EFFECT_ID"

    set +e
    (cd "$CWD_ABS" && node "$ENTRY_ABS" "${NODE_ARGS[@]}") >"$STDOUT_ABS" 2>"$STDERR_ABS"
    EXIT_CODE=$?
    set -e

    if [ "$EXIT_CODE" -eq 0 ]; then
      "${CLI[@]}" task:post "$RUN_ID" "$EFFECT_ID" --status ok --value "$OUTPUT_REF" --stdout-ref "$STDOUT_REF" --stderr-ref "$STDERR_REF" 2>&1 >&2
      echo "[native-orchestrator]   ✓ Posted result: $EFFECT_ID" >&2
    else
      "${CLI[@]}" task:post "$RUN_ID" "$EFFECT_ID" --status error --error - --stdout-ref "$STDOUT_REF" --stderr-ref "$STDERR_REF" <<EOF 2>&1 >&2
{"name":"Error","message":"Node task exited non-zero","data":{"effectId":"$EFFECT_ID","exitCode":$EXIT_CODE}}
EOF
      echo "[native-orchestrator]   ✗ Posted error: $EFFECT_ID (exitCode=$EXIT_CODE)" >&2
    fi
  done

  # Return execution results
  cat <<EOF
{
  "action": "executed-tasks",
  "count": $TASK_COUNT,
  "reason": "auto-runnable-tasks"
}
EOF
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
