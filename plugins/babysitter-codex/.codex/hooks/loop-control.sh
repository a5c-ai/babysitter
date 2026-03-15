#!/bin/sh
# loop-control.sh
# Main POSIX wrapper script that orchestrates a babysitter-managed Codex exec loop.
#
# Usage:
#   loop-control.sh <process-id> <entry-path> <prompt> [max-iterations]
#
# Arguments:
#   process-id      Unique identifier for this orchestration process
#   entry-path      Path to the entry file or directory for Codex
#   prompt          The prompt to pass to codex exec
#   max-iterations  Maximum number of loop iterations (default: $BABYSITTER_MAX_ITERATIONS or 10)

set -eu

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
if [ "$#" -lt 3 ]; then
  echo "[loop-control] Usage: $0 <process-id> <entry-path> <prompt> [max-iterations]" >&2
  exit 1
fi

PROCESS_ID="$1"
ENTRY_PATH="$2"
PROMPT="$3"
MAX_ITERATIONS="${4:-${BABYSITTER_MAX_ITERATIONS:-10}}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
A5C_DIR="${REPO_ROOT}/.a5c"
HOOKS_DIR="${SCRIPT_DIR}"
HOOK_LOG_FILE="${A5C_DIR}/logs/hooks.jsonl"
SDK_VERSION="${BABYSITTER_SDK_VERSION:-0.0.173}"
SDK_PACKAGE="${BABYSITTER_SDK_PACKAGE:-@a5c-ai/babysitter-sdk@${SDK_VERSION}}"

if ! command -v babysitter >/dev/null 2>&1; then
  babysitter() { npx -y "${SDK_PACKAGE}" "$@"; }
fi

export REPO_ROOT
export BABYSITTER_MAX_ITERATIONS="${MAX_ITERATIONS}"

echo "[loop-control] Starting orchestration loop"
echo "[loop-control]   Process ID    : ${PROCESS_ID}"
echo "[loop-control]   Entry path    : ${ENTRY_PATH}"
echo "[loop-control]   Prompt        : ${PROMPT}"
echo "[loop-control]   Max iterations: ${MAX_ITERATIONS}"
echo "[loop-control]   Repo root     : ${REPO_ROOT}"

# ---------------------------------------------------------------------------
# Ensure required directories exist
# ---------------------------------------------------------------------------
mkdir -p "${A5C_DIR}"

# ---------------------------------------------------------------------------
# Startup health check
# ---------------------------------------------------------------------------
echo "[loop-control] Running health check..."
HEALTH_OUTPUT="$(babysitter health --json 2>&1)" || true
echo "[loop-control] Health: ${HEALTH_OUTPUT}"

# ---------------------------------------------------------------------------
# Step 1: Initialize babysitter session
# ---------------------------------------------------------------------------
echo "[loop-control] Initializing babysitter session..."
node "${HOOKS_DIR}/session-init.js"

SESSION_ID=""
if [ -f "${A5C_DIR}/session.json" ]; then
  SESSION_ID="$(node "${HOOKS_DIR}/read-json.js" "${A5C_DIR}/session.json" sessionId id session_id 2>/dev/null || true)"
fi
echo "[loop-control] Session ID: ${SESSION_ID:-unknown}"
export BABYSITTER_SESSION_ID="${SESSION_ID}"

# ---------------------------------------------------------------------------
# Step 2: Create a babysitter run
# ---------------------------------------------------------------------------
echo "[loop-control] Creating babysitter run..."
RUN_OUTPUT="$(babysitter run:create \
  --session-id "${SESSION_ID}" \
  --process-id "${PROCESS_ID}" \
  --entry "${ENTRY_PATH}" \
  --json 2>&1)" || true

# Extract run ID from JSON output using safe JSON parser
RUN_ID="$(printf '%s' "${RUN_OUTPUT}" | node "${HOOKS_DIR}/read-json.js" - runId id run_id 2>/dev/null || true)"

if [ -z "${RUN_ID}" ]; then
  echo "[loop-control] WARNING: Could not extract run ID from babysitter output. Generating fallback ID." >&2
  RUN_ID="run-${PROCESS_ID}-$(date +%s)"
fi

echo "[loop-control] Run ID: ${RUN_ID}"
export BABYSITTER_RUN_ID="${RUN_ID}"

# ---------------------------------------------------------------------------
# Associate session with run
# ---------------------------------------------------------------------------
echo "[loop-control] Associating session with run..."
babysitter session:associate --session-id "${SESSION_ID}" --state-dir "${A5C_DIR}" --run-id "${RUN_ID}" --json > /dev/null 2>&1 || echo "[loop-control] WARNING: session:associate failed (non-fatal)"

# Persist run ID for hooks
node "${HOOKS_DIR}/write-json.js" "${A5C_DIR}/current-run.json" \
  "runId=${RUN_ID}" \
  "sessionId=${SESSION_ID}" \
  "processId=${PROCESS_ID}" \
  "createdAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Create run state directory
RUN_STATE_DIR="${A5C_DIR}/runs/${RUN_ID}/state"
mkdir -p "${RUN_STATE_DIR}"
node "${HOOKS_DIR}/write-json.js" "${RUN_STATE_DIR}/state.json" \
  "iteration=0" \
  "runId=${RUN_ID}" \
  "startedAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ---------------------------------------------------------------------------
# Step 3: Main execution loop
# ---------------------------------------------------------------------------
ITERATION=0
LOOP_DONE=0

echo "[loop-control] Starting execution loop (max ${MAX_ITERATIONS} iterations)..."

while [ "${ITERATION}" -lt "${MAX_ITERATIONS}" ] && [ "${LOOP_DONE}" -eq 0 ]; do
  ITERATION=$((ITERATION + 1))
  echo ""
  echo "[loop-control] ---- Iteration ${ITERATION}/${MAX_ITERATIONS} ----"

  # Structured log: iteration start
  babysitter hook:log --hook-type on-iteration-start --log-file "${HOOK_LOG_FILE}" --json > /dev/null 2>&1 || true

  # Update iteration count in state file
  node "${HOOKS_DIR}/write-json.js" "${RUN_STATE_DIR}/state.json" \
    "iteration=${ITERATION}" \
    "runId=${RUN_ID}" \
    "updatedAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  export CODEX_TURN_INDEX="${ITERATION}"

  # ---------------------------------------------------------------------------
  # session:check-iteration — runs before the iteration guard
  # ---------------------------------------------------------------------------
  echo "[loop-control] Checking session iteration limits..."
  SESSION_CHECK="$(babysitter session:check-iteration --session-id "${SESSION_ID}" --state-dir "${A5C_DIR}" --json 2>&1)" || true
  # Parse shouldContinue from output
  SHOULD_CONTINUE="$(printf '%s' "${SESSION_CHECK}" | node "${HOOKS_DIR}/read-json.js" - shouldContinue 2>/dev/null || echo "true")"
  if [ "${SHOULD_CONTINUE}" = "false" ]; then
    echo "[loop-control] Session check-iteration says to stop."
    LOOP_DONE=2
    break
  fi

  # -- Run the iteration guard --
  echo "[loop-control] Running iteration guard..."
  if ! node "${HOOKS_DIR}/iteration-guard.js"; then
    echo "[loop-control] Iteration guard blocked further execution at iteration ${ITERATION}." >&2
    LOOP_DONE=2
    break
  fi

  # -- Execute codex with full-auto mode --
  ITERATION_PROMPT="${PROMPT} [iteration=${ITERATION}/${MAX_ITERATIONS}, run=${RUN_ID}]"
  echo "[loop-control] Executing: codex exec --full-auto"
  echo "[loop-control] Prompt: ${ITERATION_PROMPT}"

  CODEX_OUTPUT_FILE="${A5C_DIR}/runs/${RUN_ID}/state/codex-output-${ITERATION}.json"
  CODEX_EXIT=0

  # Record iteration start time for session:update timing
  ITER_START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # Run codex and capture output; tolerate non-zero exit so we can handle it
  codex exec --full-auto \
    --output json \
    "${ITERATION_PROMPT}" \
    > "${CODEX_OUTPUT_FILE}" 2>&1 || CODEX_EXIT=$?

  echo "[loop-control] codex exec exited with code: ${CODEX_EXIT}"

  # Record iteration end time
  ITER_END_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # -- Parse codex JSON output --
  CODEX_RESULT="(no output)"
  if [ -f "${CODEX_OUTPUT_FILE}" ]; then
    CODEX_RESULT="$(cat "${CODEX_OUTPUT_FILE}")"
  fi

  # -- Post results via babysitter task:post --
  echo "[loop-control] Posting iteration results via babysitter task:post..."
  # Use a separate script to safely build JSON (avoids path injection in inline node -e)
  TASK_PAYLOAD="$(node "${HOOKS_DIR}/build-task-payload.js" "${CODEX_OUTPUT_FILE}" "${ITERATION}" "${CODEX_EXIT}" 2>/dev/null || printf '{"iteration":%d,"codexExitCode":%d,"output":"(json build error)"}' "${ITERATION}" "${CODEX_EXIT}")"

  # Write payload to a temp file and use --value instead of --data
  TASK_PAYLOAD_FILE="${A5C_DIR}/runs/${RUN_ID}/state/task-payload-${ITERATION}.json"
  printf '%s' "${TASK_PAYLOAD}" > "${TASK_PAYLOAD_FILE}"

  babysitter task:post \
    ".a5c/runs/${RUN_ID}" \
    "iteration-${ITERATION}" \
    --status ok \
    --value "state/task-payload-${ITERATION}.json" \
    --json \
    > /dev/null 2>&1 || echo "[loop-control] WARNING: task:post failed (non-fatal)"

  # -- Update session with timing info for this iteration --
  babysitter session:update \
    --session-id "${SESSION_ID}" \
    --state-dir "${A5C_DIR}" \
    --iteration "${ITERATION}" \
    --last-iteration-at "${ITER_END_TS}" \
    --json \
    > /dev/null 2>&1 || echo "[loop-control] WARNING: session:update failed (non-fatal)"

  # -- Notify turn-complete hook --
  echo "[loop-control] Running on-turn-complete hook..."
  node "${HOOKS_DIR}/on-turn-complete.js" || true

  # -- Check run status for completion --
  echo "[loop-control] Checking run status..."
  RUN_STATUS_OUTPUT="$(babysitter run:status \
    ".a5c/runs/${RUN_ID}" \
    --json 2>&1)" || RUN_STATUS_OUTPUT=""

  RUN_STATE="$(printf '%s' "${RUN_STATUS_OUTPUT}" | node "${HOOKS_DIR}/read-json.js" - state status 2>/dev/null || true)"

  echo "[loop-control] Run state: ${RUN_STATE:-unknown}"

  case "${RUN_STATE}" in
    completed|done|finished)
      echo "[loop-control] Run reported complete. Exiting loop."
      LOOP_DONE=1
      ;;
    failed|error|cancelled)
      echo "[loop-control] Run reported terminal failure state: ${RUN_STATE}." >&2
      LOOP_DONE=3
      ;;
    *)
      echo "[loop-control] Run still in progress. Continuing..."
      ;;
  esac

  # Handle codex exec failure
  if [ "${CODEX_EXIT}" -ne 0 ] && [ "${LOOP_DONE}" -eq 0 ]; then
    echo "[loop-control] WARNING: codex exec failed with exit code ${CODEX_EXIT}. Continuing loop." >&2
  fi

  # Structured log: iteration end
  babysitter hook:log --hook-type on-iteration-end --log-file "${HOOK_LOG_FILE}" --json > /dev/null 2>&1 || true
done

# ---------------------------------------------------------------------------
# Step 4: Final status reporting
# ---------------------------------------------------------------------------
echo ""
echo "[loop-control] ==== Loop completed ===="
echo "[loop-control]   Iterations executed : ${ITERATION}"
echo "[loop-control]   Max iterations      : ${MAX_ITERATIONS}"
echo "[loop-control]   Exit reason         : ${LOOP_DONE}"

FINAL_STATUS="ok"
FINAL_EXIT=0

if [ "${LOOP_DONE}" -eq 0 ]; then
  echo "[loop-control] Reached max iteration limit (${MAX_ITERATIONS}) without completion signal."
  FINAL_STATUS="max_iterations_reached"
  FINAL_EXIT=1
elif [ "${LOOP_DONE}" -eq 1 ]; then
  echo "[loop-control] Run completed successfully."
  FINAL_STATUS="completed"
  FINAL_EXIT=0
elif [ "${LOOP_DONE}" -eq 2 ]; then
  echo "[loop-control] Iteration guard halted execution."
  FINAL_STATUS="guard_halt"
  FINAL_EXIT=1
elif [ "${LOOP_DONE}" -eq 3 ]; then
  echo "[loop-control] Run entered terminal failure state."
  FINAL_STATUS="run_failed"
  FINAL_EXIT=1
fi

# Structured log: run complete or run fail
if [ "${FINAL_EXIT}" -eq 0 ]; then
  babysitter hook:log --hook-type on-run-complete --log-file "${HOOK_LOG_FILE}" --json > /dev/null 2>&1 || true
else
  babysitter hook:log --hook-type on-run-fail --log-file "${HOOK_LOG_FILE}" --json > /dev/null 2>&1 || true
fi

# Write final summary
node "${HOOKS_DIR}/write-json.js" "${RUN_STATE_DIR}/final-summary.json" \
  "status=${FINAL_STATUS}" \
  "runId=${RUN_ID}" \
  "iterationsExecuted=${ITERATION}" \
  "maxIterations=${MAX_ITERATIONS}" \
  "completedAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "[loop-control] Final summary written to: ${RUN_STATE_DIR}/final-summary.json"
exit "${FINAL_EXIT}"
