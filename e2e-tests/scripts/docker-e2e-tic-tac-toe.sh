#!/bin/bash
# =============================================================================
# docker-e2e-tic-tac-toe.sh
#
# Comprehensive end-to-end test script for the babysitter plugin running
# inside the Docker container. Validates the complete workflow using the
# tic-tac-toe fixture.
#
# Usage:
#   bash docker-e2e-tic-tac-toe.sh
#
# Environment variables:
#   ANTHROPIC_API_KEY   - Required only for Section 5 (full E2E orchestration)
#   ARTIFACTS_DIR       - Directory for test artifacts (default: /tmp/e2e-artifacts)
#   PLUGIN_DIR          - Plugin directory (auto-detected from cache if not set)
#   WORKSPACE_DIR       - Workspace for E2E test (default: /tmp/e2e-test-workspace)
#   FIXTURE_SRC         - Location of tic-tac-toe fixture (default: /app/e2e-tests/fixtures/tic-tac-toe)
#   SKIP_STRUCTURAL     - Set to "true" to skip sections 1-3 (useful when re-running for E2E only)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ARTIFACTS_DIR="${ARTIFACTS_DIR:-/tmp/e2e-artifacts}"
# Auto-detect plugin dir from cache (single entry created at build time)
if [ -z "${PLUGIN_DIR:-}" ]; then
  PLUGIN_DIR=$(ls -d /home/claude/.claude/plugins/cache/a5c-ai/babysitter/*/ 2>/dev/null | head -1)
  PLUGIN_DIR="${PLUGIN_DIR%/}"
fi
WORKSPACE_DIR="${WORKSPACE_DIR:-/tmp/e2e-test-workspace}"
FIXTURE_SRC="${FIXTURE_SRC:-/app/e2e-tests/fixtures/tic-tac-toe}"
STATE_DIR="$PLUGIN_DIR/skills/babysit/state"
LOG_DIR="${BABYSITTER_LOG_DIR:-$PLUGIN_DIR/logs}"
SKIP_STRUCTURAL="${SKIP_STRUCTURAL:-false}"
E2E_TIMEOUT=900

# ---------------------------------------------------------------------------
# Counters
# ---------------------------------------------------------------------------
TOTAL_TESTS=0
PASSED=0
FAILED=0
FAILED_NAMES=()
E2E_RAN=0

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

section() {
  echo ""
  echo -e "${YELLOW}${BOLD}======================================================================${NC}"
  echo -e "${YELLOW}${BOLD}  $1${NC}"
  echo -e "${YELLOW}${BOLD}======================================================================${NC}"
  echo ""
}

info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

run_test() {
  local name="$1"
  shift
  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  # Run the test command in a subshell so failures don't exit the script
  local output
  local rc
  output=$("$@" 2>&1) && rc=0 || rc=$?

  if [[ $rc -eq 0 ]]; then
    PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}PASS${NC}  ${name}"
  else
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    echo -e "  ${RED}FAIL${NC}  ${name}"
    # Indent test output for readability
    if [[ -n "$output" ]]; then
      echo "$output" | sed 's/^/        /'
    fi
  fi
}

# Wrapper to run a test with inline bash logic
run_test_eval() {
  local name="$1"
  local script="$2"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  local output
  local rc
  output=$(bash -c "$script" 2>&1) && rc=0 || rc=$?

  if [[ $rc -eq 0 ]]; then
    PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}PASS${NC}  ${name}"
  else
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    echo -e "  ${RED}FAIL${NC}  ${name}"
    if [[ -n "$output" ]]; then
      echo "$output" | sed 's/^/        /'
    fi
  fi
}

# ---------------------------------------------------------------------------
# Cleanup / summary trap
# ---------------------------------------------------------------------------
write_results_json() {
  local status="passed"
  [[ $FAILED -gt 0 ]] && status="failed"

  local failed_json="[]"
  if [[ ${#FAILED_NAMES[@]} -gt 0 ]]; then
    failed_json=$(printf '%s\n' "${FAILED_NAMES[@]}" | jq -R . | jq -s .)
  fi

  mkdir -p "$ARTIFACTS_DIR"
  cat > "$ARTIFACTS_DIR/test-results.json" <<EOJSON
{
  "status": "$status",
  "total": $TOTAL_TESTS,
  "passed": $PASSED,
  "failed": $FAILED,
  "failedTests": $failed_json,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "e2eRan": $( [[ $E2E_RAN -eq 1 ]] && echo true || echo false )
}
EOJSON
}

summary() {
  section "SECTION 7: SUMMARY"
  echo ""
  echo -e "${BOLD}Total tests : $TOTAL_TESTS${NC}"
  echo -e "${GREEN}Passed      : $PASSED${NC}"
  echo -e "${RED}Failed      : $FAILED${NC}"
  if [[ ${#FAILED_NAMES[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}Failed tests:${NC}"
    for name in "${FAILED_NAMES[@]}"; do
      echo -e "  ${RED}-${NC} $name"
    done
  fi

  write_results_json
  info "Test results written to $ARTIFACTS_DIR/test-results.json"

  echo ""
  if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}ALL TESTS PASSED${NC}"
  else
    echo -e "${RED}${BOLD}SOME TESTS FAILED${NC}"
  fi
}

cleanup() {
  local exit_code=$?
  # Disable errexit so cleanup always completes even if summary hits an error
  set +e
  # Always print summary even on unexpected exit
  summary
  # Clean up temporary state we created
  rm -rf "/tmp/bsit-e2e-hook-test" 2>/dev/null || true
  exit $exit_code
}

trap cleanup EXIT

# Create artifacts directory
mkdir -p "$ARTIFACTS_DIR"

# =============================================================================
# SECTION 1: STRUCTURAL TESTS (no API key needed)
# =============================================================================
if [[ "$SKIP_STRUCTURAL" == "true" ]]; then
  info "SKIP_STRUCTURAL=true -- skipping Sections 1-3 (structural/SDK/hook tests)"
else

section "SECTION 1: STRUCTURAL TESTS"

run_test "babysitter CLI is available and returns version" \
  bash -c 'babysitter --version | grep -qE "[0-9]+\.[0-9]+"'

run_test "claude CLI is available and returns version" \
  bash -c 'claude --version | grep -qE "[0-9]+\.[0-9]+"'

run_test "Plugin directory exists at expected path" \
  test -d "$PLUGIN_DIR"

run_test_eval "hooks.json exists and contains Stop hook registration" \
  "jq -e '.hooks.Stop[0].hooks[0].command' '$PLUGIN_DIR/hooks/hooks.json' | grep -q 'babysitter-stop-hook.sh'"

run_test_eval "hooks.json contains SessionStart hook registration" \
  "jq -e '.hooks.SessionStart[0].hooks[0].command' '$PLUGIN_DIR/hooks/hooks.json' | grep -q 'babysitter-session-start-hook.sh'"

run_test "babysitter-stop-hook.sh exists and is executable" \
  test -x "$PLUGIN_DIR/hooks/babysitter-stop-hook.sh"

run_test "babysitter-session-start-hook.sh exists and is executable" \
  test -x "$PLUGIN_DIR/hooks/babysitter-session-start-hook.sh"

run_test "jq is installed" \
  bash -c 'command -v jq >/dev/null 2>&1'

run_test_eval "Node.js v20+ is available" \
  'NODE_MAJOR=$(node -v | sed "s/^v//" | cut -d. -f1); [ "$NODE_MAJOR" -ge 20 ]'

run_test_eval "Non-root user is claude" \
  '[ "$(whoami)" = "claude" ]'

run_test_eval "Entrypoint script exists and is executable" \
  'test -x /entrypoint.sh'

run_test_eval "installed_plugins.json is correct" \
  'jq -e ".plugins[\"babysitter@a5c.ai\"][0].installPath" /home/claude/.claude/plugins/installed_plugins.json | grep -q "'"$PLUGIN_DIR"'"'

run_test_eval "settings.json enables babysitter" \
  'jq -e ".enabledPlugins[\"babysitter@a5c.ai\"]" /home/claude/.claude/settings.json | grep -q "true"'

# =============================================================================
# SECTION 2: SDK CLI TESTS (no API key needed)
# =============================================================================
section "SECTION 2: SDK CLI TESTS"

run_test_eval "babysitter health --json returns valid JSON" \
  'babysitter health --json | jq -e . >/dev/null'

# Generate a unique session id for roundtrip tests
SDK_TEST_SESSION="e2e-sdk-test-$(date +%s)"

run_test_eval "session:init and session:state roundtrip works" \
  '
  SESSION_ID="'"$SDK_TEST_SESSION"'"
  STATE_DIR="'"$STATE_DIR"'"
  mkdir -p "$STATE_DIR"
  babysitter session:init \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --prompt "test prompt" \
    --run-id "test-run-001" \
    --json >/dev/null 2>&1
  RESULT=$(babysitter session:state --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --json 2>&1)
  FOUND=$(echo "$RESULT" | jq -r ".found")
  [ "$FOUND" = "true" ]
  '

SDK_UPDATE_SESSION="e2e-sdk-update-$(date +%s)"

run_test_eval "session:update increments iteration" \
  '
  SESSION_ID="'"$SDK_UPDATE_SESSION"'"
  STATE_DIR="'"$STATE_DIR"'"
  mkdir -p "$STATE_DIR"
  babysitter session:init \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --prompt "iter test" \
    --run-id "test-run-002" \
    --json >/dev/null 2>&1
  babysitter session:update \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --iteration 2 \
    --last-iteration-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --json >/dev/null 2>&1
  RESULT=$(babysitter session:state --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --json 2>&1)
  ITER=$(echo "$RESULT" | jq -r ".state.iteration")
  [ "$ITER" = "2" ]
  '

SDK_DELETE_SESSION="e2e-sdk-delete-$(date +%s)"

run_test_eval "session:update --delete removes session" \
  '
  SESSION_ID="'"$SDK_DELETE_SESSION"'"
  STATE_DIR="'"$STATE_DIR"'"
  mkdir -p "$STATE_DIR"
  babysitter session:init \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --prompt "delete test" \
    --run-id "test-run-003" \
    --json >/dev/null 2>&1
  babysitter session:update \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --delete \
    --json >/dev/null 2>&1
  RESULT=$(babysitter session:state --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --json 2>&1)
  FOUND=$(echo "$RESULT" | jq -r ".found")
  [ "$FOUND" = "false" ]
  '

# =============================================================================
# SECTION 3: STOP HOOK LIFECYCLE TESTS (no API key needed)
# =============================================================================
section "SECTION 3: STOP HOOK LIFECYCLE TESTS"

# Temporary working directory for hook tests
HOOK_TEST_DIR="/tmp/bsit-e2e-hook-test"
mkdir -p "$HOOK_TEST_DIR"
mkdir -p "$LOG_DIR"

STOP_HOOK="$PLUGIN_DIR/hooks/babysitter-stop-hook.sh"

# --- Test: Stop hook exits 0 when no session state exists ---
run_test_eval "Stop hook exits 0 when no session state exists" \
  '
  RANDOM_SESSION="no-state-$(date +%s)-$$"
  echo "{\"session_id\": \"$RANDOM_SESSION\", \"transcript_path\": \"/dev/null\"}" \
    | CLAUDE_PLUGIN_ROOT="'"$PLUGIN_DIR"'" bash "'"$STOP_HOOK"'" >/dev/null 2>&1
  '

# --- Test: Stop hook blocks exit when active session state exists ---
HOOK_ACTIVE_SESSION="e2e-hook-active-$(date +%s)"

run_test_eval "Stop hook blocks exit when active session state exists" \
  '
  SESSION_ID="'"$HOOK_ACTIVE_SESSION"'"
  STATE_DIR="'"$STATE_DIR"'"
  HOOK_TEST_DIR="'"$HOOK_TEST_DIR"'"
  PLUGIN_DIR="'"$PLUGIN_DIR"'"
  mkdir -p "$STATE_DIR" "$HOOK_TEST_DIR"

  # Initialize an active session
  babysitter session:init \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --prompt "active session test" \
    --run-id "hook-run-001" \
    --json >/dev/null 2>&1

  # Create a mock JSONL transcript with an assistant message
  TRANSCRIPT="$HOOK_TEST_DIR/transcript-active.jsonl"
  echo "{\"role\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"I am working on the task.\"}]}}" > "$TRANSCRIPT"

  # Feed hook input
  OUTPUT=$(echo "{\"session_id\": \"$SESSION_ID\", \"transcript_path\": \"$TRANSCRIPT\"}" \
    | CLAUDE_PLUGIN_ROOT="$PLUGIN_DIR" bash "$PLUGIN_DIR/hooks/babysitter-stop-hook.sh" 2>/dev/null)

  # The hook should output a JSON block decision
  echo "$OUTPUT" | jq -e ".decision" | grep -q "block"

  # Cleanup session
  babysitter session:update --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --delete --json >/dev/null 2>&1 || true
  '

# --- Test: Stop hook increments iteration counter ---
HOOK_ITER_SESSION="e2e-hook-iter-$(date +%s)"

run_test_eval "Stop hook increments iteration counter" \
  '
  SESSION_ID="'"$HOOK_ITER_SESSION"'"
  STATE_DIR="'"$STATE_DIR"'"
  HOOK_TEST_DIR="'"$HOOK_TEST_DIR"'"
  PLUGIN_DIR="'"$PLUGIN_DIR"'"
  mkdir -p "$STATE_DIR" "$HOOK_TEST_DIR"

  # Initialize session at iteration 1
  babysitter session:init \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --prompt "iteration counter test" \
    --run-id "hook-run-iter" \
    --json >/dev/null 2>&1

  TRANSCRIPT="$HOOK_TEST_DIR/transcript-iter.jsonl"
  echo "{\"role\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"Working...\"}]}}" > "$TRANSCRIPT"

  # First invocation -- advances from 1 to 2
  echo "{\"session_id\": \"$SESSION_ID\", \"transcript_path\": \"$TRANSCRIPT\"}" \
    | CLAUDE_PLUGIN_ROOT="$PLUGIN_DIR" bash "$PLUGIN_DIR/hooks/babysitter-stop-hook.sh" >/dev/null 2>&1

  ITER1=$(babysitter session:state --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --json 2>&1 | jq -r ".state.iteration")

  # Second invocation -- advances from 2 to 3
  echo "{\"session_id\": \"$SESSION_ID\", \"transcript_path\": \"$TRANSCRIPT\"}" \
    | CLAUDE_PLUGIN_ROOT="$PLUGIN_DIR" bash "$PLUGIN_DIR/hooks/babysitter-stop-hook.sh" >/dev/null 2>&1

  ITER2=$(babysitter session:state --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --json 2>&1 | jq -r ".state.iteration")

  # Verify iteration went up
  [ "$ITER1" -lt "$ITER2" ]

  # Cleanup
  babysitter session:update --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --delete --json >/dev/null 2>&1 || true
  '

# --- Test: Stop hook detects completion proof and allows exit ---
HOOK_SECRET_SESSION="e2e-hook-secret-$(date +%s)"

run_test_eval "Stop hook detects completion proof and allows exit" \
  '
  SESSION_ID="'"$HOOK_SECRET_SESSION"'"
  STATE_DIR="'"$STATE_DIR"'"
  HOOK_TEST_DIR="'"$HOOK_TEST_DIR"'"
  PLUGIN_DIR="'"$PLUGIN_DIR"'"
  WORKSPACE="$HOOK_TEST_DIR/secret-workspace"
  RUN_ID="e2e-secret-run-001"
  SECRET="abc123secretXYZ"

  mkdir -p "$STATE_DIR" "$WORKSPACE/.a5c/runs/$RUN_ID/journal"

  # Create a mock run.json with state:completed and a completionProof
  cat > "$WORKSPACE/.a5c/runs/$RUN_ID/run.json" <<RUNEOF
{
  "runId": "$RUN_ID",
  "request": "test-request",
  "processId": "test-process",
  "state": "completed",
  "completionProof": "$SECRET",
  "layoutVersion": "2026.01-storage-preview",
  "createdAt": "2026-02-16T00:00:00.000Z"
}
RUNEOF

  # Initialize session that references this run
  babysitter session:init \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --prompt "secret test prompt" \
    --run-id "$RUN_ID" \
    --json >/dev/null 2>&1

  # Create a transcript where assistant outputs the promise tag
  TRANSCRIPT="$HOOK_TEST_DIR/transcript-secret.jsonl"
  echo "{\"role\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"All tasks are done. <promise>$SECRET</promise>\"}]}}" > "$TRANSCRIPT"

  # Run the hook from inside the workspace so the SDK can find .a5c/runs
  OUTPUT=$(cd "$WORKSPACE" && echo "{\"session_id\": \"$SESSION_ID\", \"transcript_path\": \"$TRANSCRIPT\"}" \
    | CLAUDE_PLUGIN_ROOT="$PLUGIN_DIR" bash "$PLUGIN_DIR/hooks/babysitter-stop-hook.sh" 2>/dev/null)

  # The hook should exit 0 with NO block decision (empty stdout or no "block")
  if echo "$OUTPUT" | jq -e ".decision" 2>/dev/null | grep -q "block"; then
    echo "Expected hook to allow exit but it blocked"
    exit 1
  fi

  # Session should be cleaned up
  RESULT=$(babysitter session:state --session-id "$SESSION_ID" --state-dir "$STATE_DIR" --json 2>&1)
  FOUND=$(echo "$RESULT" | jq -r ".found")
  [ "$FOUND" = "false" ]
  '

# --- Test: Stop hook handles missing transcript gracefully ---
HOOK_NO_TRANSCRIPT_SESSION="e2e-hook-no-transcript-$(date +%s)"

run_test_eval "Stop hook handles missing transcript gracefully" \
  '
  SESSION_ID="'"$HOOK_NO_TRANSCRIPT_SESSION"'"
  STATE_DIR="'"$STATE_DIR"'"
  PLUGIN_DIR="'"$PLUGIN_DIR"'"
  mkdir -p "$STATE_DIR"

  # Initialize an active session
  babysitter session:init \
    --session-id "$SESSION_ID" \
    --state-dir "$STATE_DIR" \
    --prompt "missing transcript test" \
    --run-id "hook-run-no-transcript" \
    --json >/dev/null 2>&1

  # Feed a transcript path that does not exist -- hook should exit 0 (graceful)
  echo "{\"session_id\": \"$SESSION_ID\", \"transcript_path\": \"/nonexistent/path/transcript.jsonl\"}" \
    | CLAUDE_PLUGIN_ROOT="$PLUGIN_DIR" bash "$PLUGIN_DIR/hooks/babysitter-stop-hook.sh" >/dev/null 2>&1
  '

# --- Test: Stop hook handles empty/invalid JSON input gracefully ---
run_test_eval "Stop hook handles empty JSON input gracefully" \
  '
  echo "" | CLAUDE_PLUGIN_ROOT="'"$PLUGIN_DIR"'" bash "'"$STOP_HOOK"'" >/dev/null 2>&1
  '

run_test_eval "Stop hook handles invalid JSON input gracefully" \
  '
  echo "NOT VALID JSON AT ALL" | CLAUDE_PLUGIN_ROOT="'"$PLUGIN_DIR"'" bash "'"$STOP_HOOK"'" >/dev/null 2>&1
  '

# end of SKIP_STRUCTURAL guard
fi

# =============================================================================
# SECTION 4: FIXTURE SETUP (always runs -- needed for E2E orchestration)
# =============================================================================
section "SECTION 4: FIXTURE SETUP"

info "Copying tic-tac-toe fixture to $WORKSPACE_DIR"

if [[ -d "$FIXTURE_SRC" ]]; then
  rm -rf "$WORKSPACE_DIR"
  mkdir -p "$WORKSPACE_DIR"
  # Copy fixture, excluding node_modules (will reinstall)
  rsync -a --exclude='node_modules' --exclude='.a5c' "$FIXTURE_SRC/" "$WORKSPACE_DIR/" 2>/dev/null \
    || cp -r "$FIXTURE_SRC/." "$WORKSPACE_DIR/"

  run_test "Fixture copied to workspace" test -d "$WORKSPACE_DIR"

  # Install npm dependencies
  info "Installing npm dependencies in workspace"
  (cd "$WORKSPACE_DIR" && npm install --ignore-scripts 2>&1) > "$ARTIFACTS_DIR/npm-install.log" 2>&1 || true

  run_test "npm dependencies installed (node_modules exists)" \
    test -d "$WORKSPACE_DIR/node_modules"

  run_test "package.json exists in workspace" \
    test -f "$WORKSPACE_DIR/package.json"

  run_test "request.task.md exists in workspace" \
    test -f "$WORKSPACE_DIR/request.task.md"
else
  info "Fixture source $FIXTURE_SRC not found -- skipping fixture setup"
  run_test_eval "Fixture source directory exists" 'echo "Not found: '"$FIXTURE_SRC"'"; exit 1'
fi

# =============================================================================
# SECTION 5: FULL E2E ORCHESTRATION TEST (needs ANTHROPIC_API_KEY)
# =============================================================================
section "SECTION 5: FULL E2E ORCHESTRATION TEST"

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo -e "  ${YELLOW}SKIP${NC}  ANTHROPIC_API_KEY not set -- skipping full E2E orchestration"
  info "Set ANTHROPIC_API_KEY to enable the full end-to-end test."
else
  info "Running full E2E orchestration with timeout of ${E2E_TIMEOUT}s"
  info "Working directory: $WORKSPACE_DIR"

  E2E_STDOUT="$ARTIFACTS_DIR/e2e-stdout.log"
  E2E_STDERR="$ARTIFACTS_DIR/e2e-stderr.log"

  E2E_EXIT=0
  (
    cd "$WORKSPACE_DIR"
    timeout "$E2E_TIMEOUT" claude \
      --plugin-dir "$PLUGIN_DIR" \
      --dangerously-skip-permissions \
      --output-format text \
      -p "/babysitter:babysit perform the tasks in the *.task.md files found in this dir" \
      > "$E2E_STDOUT" 2> "$E2E_STDERR"
  ) && E2E_EXIT=0 || E2E_EXIT=$?

  if [[ $E2E_EXIT -eq 0 ]]; then
    E2E_RAN=1
    run_test_eval "E2E orchestration completed successfully" 'exit 0'
  elif [[ $E2E_EXIT -eq 124 ]]; then
    # timeout returns 124 when the command times out
    E2E_RAN=1
    info "E2E orchestration timed out after ${E2E_TIMEOUT}s (may still have partial results)"
    run_test_eval "E2E orchestration completed within timeout" 'echo "Timed out after '"$E2E_TIMEOUT"'s"; exit 1'
  else
    E2E_RAN=1
    info "E2E orchestration exited with code $E2E_EXIT"
    run_test_eval "E2E orchestration completed successfully" 'echo "Exit code: '"$E2E_EXIT"'"; exit 1'
  fi

  info "stdout captured to $E2E_STDOUT"
  info "stderr captured to $E2E_STDERR"
fi

# =============================================================================
# SECTION 6: OUTPUT VERIFICATION (only if E2E ran)
# =============================================================================
section "SECTION 6: OUTPUT VERIFICATION"

if [[ $E2E_RAN -eq 0 ]]; then
  echo -e "  ${YELLOW}SKIP${NC}  E2E did not run -- skipping output verification"
else
  info "Verifying outputs in $WORKSPACE_DIR"

  run_test_eval "index.html exists and is non-empty" \
    'test -s "'"$WORKSPACE_DIR"'/index.html"'

  run_test_eval "JS file (game.js or similar) exists and is non-empty" \
    '
    FOUND=0
    for f in "'"$WORKSPACE_DIR"'"/*.js "'"$WORKSPACE_DIR"'"/src/*.js "'"$WORKSPACE_DIR"'"/js/*.js; do
      if [ -s "$f" ] 2>/dev/null; then
        FOUND=1
        break
      fi
    done
    [ "$FOUND" -eq 1 ]
    '

  run_test_eval ".a5c/runs/ directory exists with at least one run" \
    '
    test -d "'"$WORKSPACE_DIR"'/.a5c/runs" && \
    RUNS=$(ls -1d "'"$WORKSPACE_DIR"'/.a5c/runs"/*/ 2>/dev/null | wc -l) && \
    [ "$RUNS" -gt 0 ]
    '

  run_test_eval "Most recent run has journal entries" \
    '
    LATEST_RUN=$(ls -1td "'"$WORKSPACE_DIR"'/.a5c/runs"/*/ 2>/dev/null | head -1)
    test -n "$LATEST_RUN" && \
    test -d "${LATEST_RUN}journal" && \
    ENTRIES=$(ls -1 "${LATEST_RUN}journal"/*.json 2>/dev/null | wc -l) && \
    [ "$ENTRIES" -gt 0 ]
    '

  run_test_eval "babysitter run:status shows run completed" \
    '
    cd "'"$WORKSPACE_DIR"'"
    LATEST_RUN_DIR=$(ls -1td .a5c/runs/*/ 2>/dev/null | head -1)
    RUN_ID=$(basename "$LATEST_RUN_DIR")
    STATUS=$(babysitter run:status "$RUN_ID" --json 2>/dev/null)
    STATE=$(echo "$STATUS" | jq -r ".state // empty")
    [ "$STATE" = "completed" ]
    '

  run_test_eval "babysitter task:list --pending reports 0 pending tasks" \
    '
    cd "'"$WORKSPACE_DIR"'"
    PENDING=$(babysitter task:list --pending --json 2>/dev/null)
    COUNT=$(echo "$PENDING" | jq -r ".count // 0" 2>/dev/null || echo "0")
    [ "$COUNT" -eq 0 ]
    '

  LOG_FILE="$LOG_DIR/babysitter-stop-hook.log"

  run_test_eval "Stop hook log has 'Hook execution successful' entries" \
    '
    LOG="'"$LOG_FILE"'"
    test -f "$LOG" && grep -q "Hook execution successful" "$LOG"
    '

  run_test_eval "Stop hook log has iteration update entries" \
    '
    LOG="'"$LOG_FILE"'"
    test -f "$LOG" && grep -q "Updated iteration to" "$LOG"
    '
fi

# summary and exit are handled by the EXIT trap

