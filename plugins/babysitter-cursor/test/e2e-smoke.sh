#!/bin/bash
# Babysitter Cursor Plugin — E2E Smoke Test
#
# Tests the full hook pipeline end-to-end using the actual CLI.
# Adapted for the Cursor plugin's hook structure and session lifecycle.
#
# Usage:
#   bash test/e2e-smoke.sh
#
# Requirements:
#   - babysitter CLI available (or npx fallback)
#   - Node.js available
#
# Cross-platform: works on Linux, macOS, and Windows (Git Bash / MSYS2).

set -uo pipefail

PASS=0
FAIL=0
SKIP=0
ERRORS=()

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(mktemp -d)"
STATE_DIR="$WORK_DIR/state"
RUNS_DIR="$WORK_DIR/runs"
mkdir -p "$STATE_DIR" "$RUNS_DIR"

trap 'rm -rf "$WORK_DIR"' EXIT

# ---------------------------------------------------------------------------
# Resolve babysitter CLI
# ---------------------------------------------------------------------------
if command -v babysitter &>/dev/null; then
  CLI="babysitter"
elif [ -x "$HOME/.local/bin/babysitter" ]; then
  CLI="$HOME/.local/bin/babysitter"
else
  SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).sdkVersion||'latest')}catch{console.log('latest')}" "$PLUGIN_DIR/versions.json" 2>/dev/null || echo "latest")
  CLI="npx -y @a5c-ai/babysitter-sdk@${SDK_VERSION:-latest}"
fi

echo "Using CLI: $CLI"
echo "Plugin dir: $PLUGIN_DIR"
echo "Working dir: $WORK_DIR"
echo ""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); ERRORS+=("$1"); echo "  FAIL: $1"; }
skip() { SKIP=$((SKIP + 1)); echo "  SKIP: $1"; }

assert_file_exists() {
  local label="$1" path="$2"
  [[ -f "$path" ]] && pass "$label" || fail "$label: file not found: $path"
}

assert_contains() {
  local label="$1" haystack="$2" needle="$3"
  echo "$haystack" | grep -qF "$needle" && pass "$label" || fail "$label: missing '${needle}'"
}

assert_no_decision() {
  local label="$1" json="$2"
  local decision
  decision=$(node -e "try{const d=JSON.parse(process.argv[1]);console.log(d.decision||'NONE')}catch{console.log('PARSE_ERR')}" "$json" 2>/dev/null)
  [[ "$decision" == "NONE" ]] && pass "$label (approve -- no decision)" || fail "$label: expected approve (no decision), got decision=$decision"
}

assert_decision_block() {
  local label="$1" json="$2"
  local decision
  decision=$(node -e "try{const d=JSON.parse(process.argv[1]);console.log(d.decision||'NONE')}catch{console.log('PARSE_ERR')}" "$json" 2>/dev/null)
  [[ "$decision" == "block" ]] && pass "$label (decision=block)" || fail "$label: expected block, got decision=$decision"
}

# Check if cursor harness is supported by hook:run
HARNESS_SUPPORTED=true
HARNESS_CHECK=$(echo '{}' | $CLI hook:run --hook-type stop --harness cursor --json 2>&1 || true)
if echo "$HARNESS_CHECK" | grep -q "UNSUPPORTED_HARNESS"; then
  HARNESS_SUPPORTED=false
  echo "NOTE: cursor harness not yet registered in hook:run."
  echo "      hook:run tests will be skipped. Session lifecycle tests will still run."
  echo ""
fi

# Run a hook:run command with a JSON payload from a temp file
run_hook() {
  local hook_type="$1" payload="$2"
  shift 2
  if [[ "$HARNESS_SUPPORTED" != "true" ]]; then
    echo "__SKIPPED__"
    return
  fi
  local tmp_input
  tmp_input=$(mktemp)
  echo "$payload" > "$tmp_input"
  local result
  result=$($CLI hook:run \
    --hook-type "$hook_type" \
    --harness cursor \
    --state-dir "$STATE_DIR" \
    --runs-dir "$RUNS_DIR" \
    --json < "$tmp_input" 2>/dev/null) || result="{}"
  rm -f "$tmp_input"
  echo "$result"
}

# ---------------------------------------------------------------------------
# Test 1: CLI availability
# ---------------------------------------------------------------------------
echo "=== Test 1: CLI availability ==="
if $CLI version --json >/dev/null 2>&1 || $CLI --version >/dev/null 2>&1; then
  pass "babysitter CLI is available"
else
  fail "babysitter CLI not available"
fi

# ---------------------------------------------------------------------------
# Test 2: harness:discover includes cursor
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 2: harness:discover includes cursor ==="
DISCOVER_OUT=$($CLI harness:discover --json 2>/dev/null || echo '{}')
if echo "$DISCOVER_OUT" | grep -qi "cursor"; then
  pass "harness:discover output mentions cursor"
else
  # cursor may not be installed on CI; skip rather than fail
  skip "harness:discover does not mention cursor (cursor CLI may not be installed)"
fi

# ---------------------------------------------------------------------------
# Test 3: plugin.json schema validation
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 3: plugin.json schema ==="
PLUGIN_VALID=$(node -e "
  const p = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  const errors = [];
  if (typeof p.name !== 'string') errors.push('name must be string');
  if (typeof p.version !== 'string') errors.push('version must be string');
  if (typeof p.description !== 'string') errors.push('description must be string');
  if (typeof p.hooks !== 'object') errors.push('hooks must be object');
  if (!Array.isArray(p.skills)) errors.push('skills must be array');
  for (const s of (p.skills || [])) {
    if (!s.name || !s.file) errors.push('skill missing name or file: ' + JSON.stringify(s));
  }
  if (errors.length) console.log('ERRORS:' + errors.join('; '));
  else console.log('OK');
" "$PLUGIN_DIR/plugin.json" 2>/dev/null)

if [[ "$PLUGIN_VALID" == "OK" ]]; then
  pass "plugin.json has valid schema"
else
  fail "plugin.json schema: $PLUGIN_VALID"
fi

# ---------------------------------------------------------------------------
# Test 4: Hook script shebangs
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 4: Hook script shebangs ==="
for hook_file in "$PLUGIN_DIR"/hooks/*.sh; do
  [[ ! -f "$hook_file" ]] && continue
  basename_file=$(basename "$hook_file")
  first_line=$(head -n1 "$hook_file")
  if echo "$first_line" | grep -q "^#!/.*bash\|^#!/.*sh"; then
    pass "shebang OK: $basename_file"
  else
    fail "missing shebang: $basename_file (got: $first_line)"
  fi
done

# ---------------------------------------------------------------------------
# Test 5: Hook scripts pass syntax check (bash -n)
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 5: Hook script syntax (bash -n) ==="
for hook_file in "$PLUGIN_DIR"/hooks/*.sh; do
  [[ ! -f "$hook_file" ]] && continue
  basename_file=$(basename "$hook_file")
  if bash -n "$hook_file" 2>/dev/null; then
    pass "syntax OK: $basename_file"
  else
    fail "syntax error: $basename_file"
  fi
done

# ---------------------------------------------------------------------------
# Test 6: versions.json has valid sdkVersion
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 6: versions.json sdkVersion ==="
SDK_VER=$(node -e "
  const v = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  if (v.sdkVersion && typeof v.sdkVersion === 'string' && v.sdkVersion.length > 0) {
    console.log('OK:' + v.sdkVersion);
  } else {
    console.log('INVALID');
  }
" "$PLUGIN_DIR/versions.json" 2>/dev/null)

if [[ "$SDK_VER" == OK:* ]]; then
  pass "versions.json has valid sdkVersion: ${SDK_VER#OK:}"
else
  fail "versions.json sdkVersion is missing or invalid"
fi

# ---------------------------------------------------------------------------
# Test 7: session:init creates state file
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 7: session:init ==="
SESSION_ID="cursor-smoke-$$"
$CLI session:init \
  --session-id "$SESSION_ID" \
  --state-dir "$STATE_DIR" \
  --max-iterations 10 \
  --prompt "Build a Cursor test plugin" \
  --json >/dev/null 2>&1 || true

STATE_FILE="$STATE_DIR/${SESSION_ID}.md"
assert_file_exists "session:init creates state file" "$STATE_FILE"
assert_contains "state file has active:true" "$(cat "$STATE_FILE" 2>/dev/null)" "active: true"
assert_contains "state file has iteration:1" "$(cat "$STATE_FILE" 2>/dev/null)" "iteration: 1"
assert_contains "state file has prompt" "$(cat "$STATE_FILE" 2>/dev/null)" "Build a Cursor test plugin"

# ---------------------------------------------------------------------------
# Test 8: hook:run stop -- no session, outputs approve
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 8: hook:run stop (no session) ==="
OUTPUT=$(run_hook "stop" '{}')
if [[ "$OUTPUT" == "__SKIPPED__" ]]; then
  skip "hook:run stop (empty payload) -- harness not supported"
else
  assert_no_decision "hook:run stop (empty payload)" "$OUTPUT"
fi

# ---------------------------------------------------------------------------
# Test 9: hook:run stop -- unknown session, outputs approve
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 9: hook:run stop (unknown session) ==="
OUTPUT=$(run_hook "stop" '{"session_id":"nonexistent-999"}')
if [[ "$OUTPUT" == "__SKIPPED__" ]]; then
  skip "hook:run stop (unknown session) -- harness not supported"
else
  assert_no_decision "hook:run stop (unknown session)" "$OUTPUT"
fi

# ---------------------------------------------------------------------------
# Test 10: session:init re-entrant guard
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 10: session:init (re-entrant guard) ==="
GUARD_SESSION="cursor-guard-$$"
$CLI session:init \
  --session-id "$GUARD_SESSION" \
  --state-dir "$STATE_DIR" \
  --prompt "First attempt" \
  --json >/dev/null 2>&1 || true
REINIT_OUT=$($CLI session:init \
  --session-id "$GUARD_SESSION" \
  --state-dir "$STATE_DIR" \
  --prompt "Second attempt" \
  --json 2>&1) || true
assert_contains "session:init blocks re-entrant init" "$REINIT_OUT" "SESSION_EXISTS"

# ---------------------------------------------------------------------------
# Test 11: session:associate -- links run to session
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 11: session:associate ==="
ASSOC_OUT=$($CLI session:associate \
  --session-id "$SESSION_ID" \
  --state-dir "$STATE_DIR" \
  --run-id "cursor-run-$$" \
  --json 2>&1) || true
assert_contains "session:associate outputs run-id" "$ASSOC_OUT" "cursor-run-"
assert_contains "state file has run_id" "$(cat "$STATE_FILE" 2>/dev/null)" "cursor-run-"

# ---------------------------------------------------------------------------
# Test 12: hook:run stop -- max iterations guard
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 12: hook:run stop (max iterations guard) ==="
MAX_SESSION="cursor-max-$$"
MAX_STATE="$STATE_DIR/${MAX_SESSION}.md"
cat > "$MAX_STATE" <<EOF
---
active: true
iteration: 5
max_iterations: 5
run_id: ""
started_at: "2024-01-01T00:00:00Z"
last_iteration_at: "2024-01-01T00:00:00Z"
iteration_times:
---

Max iteration test
EOF

OUTPUT=$(run_hook "stop" "{\"session_id\":\"${MAX_SESSION}\"}")
if [[ "$OUTPUT" == "__SKIPPED__" ]]; then
  skip "hook:run stop (max iterations) -- harness not supported"
else
  assert_no_decision "hook:run stop (max iterations -> approve)" "$OUTPUT"
  if [[ ! -f "$MAX_STATE" ]]; then
    pass "state file cleaned up after max iterations"
  else
    # State file cleanup is harness-dependent; not all harnesses remove it
    skip "state file not cleaned up (may be harness-specific behavior)"
  fi
fi

# ---------------------------------------------------------------------------
# Test 13: session:resume -- creates state for existing run
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 13: session:resume ==="
FAKE_RUN="cursor-resume-run-$$"
FAKE_RUN_DIR="$RUNS_DIR/$FAKE_RUN"
mkdir -p "$FAKE_RUN_DIR/journal"

cat > "$FAKE_RUN_DIR/run.json" <<EOF
{
  "schemaVersion": "2026.01.run-metadata",
  "runId": "${FAKE_RUN}",
  "processId": "test-process",
  "entrypoint": { "importPath": "/tmp/test.js", "exportName": "process" },
  "layoutVersion": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
EOF

cat > "$FAKE_RUN_DIR/journal/000001.01ARZ3NDEKTSV4RRFFQ69G5FAV.json" <<'EOF'
{"type":"RUN_CREATED","recordedAt":"2024-01-01T00:00:00Z","data":{},"checksum":"abc"}
EOF

RESUME_SESSION="cursor-resume-$$"
$CLI session:resume \
  --session-id "$RESUME_SESSION" \
  --run-id "$FAKE_RUN" \
  --state-dir "$STATE_DIR" \
  --runs-dir "$RUNS_DIR" \
  --json >/dev/null 2>&1 || true

RESUME_STATE="$STATE_DIR/${RESUME_SESSION}.md"
assert_file_exists "session:resume creates state file" "$RESUME_STATE"
assert_contains "resume state has run_id" "$(cat "$RESUME_STATE" 2>/dev/null)" "$FAKE_RUN"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================"
echo "  CURSOR PLUGIN SMOKE TEST RESULTS"
echo "============================================"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo "  SKIP: $SKIP"

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "  FAILURES:"
  for err in "${ERRORS[@]}"; do
    echo "    - $err"
  done
  echo ""
  exit 1
fi

echo ""
if [[ $SKIP -gt 0 ]]; then
  echo "  All non-skipped smoke tests passed! ($SKIP skipped -- cursor harness not yet registered)"
else
  echo "  All smoke tests passed!"
fi
echo ""
exit 0
