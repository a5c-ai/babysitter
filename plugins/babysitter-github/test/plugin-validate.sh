#!/bin/bash
# Babysitter GitHub Plugin — Structure Validation
#
# Validates that the plugin has all required files, valid JSON,
# correct hook references, and SKILL.md files.
#
# Usage:
#   bash test/plugin-validate.sh

set -uo pipefail

PASS=0
FAIL=0
ERRORS=()

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); ERRORS+=("$1"); echo "  FAIL: $1"; }

assert_file_exists() {
  local label="$1" path="$2"
  [[ -f "$path" ]] && pass "$label" || fail "$label: file not found: $path"
}

assert_valid_json() {
  local label="$1" path="$2"
  if [[ ! -f "$path" ]]; then
    fail "$label: file not found: $path"
    return
  fi
  if node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$path" 2>/dev/null; then
    pass "$label"
  else
    fail "$label: invalid JSON in $path"
  fi
}

assert_contains() {
  local label="$1" haystack="$2" needle="$3"
  echo "$haystack" | grep -qF "$needle" && pass "$label" || fail "$label: missing '${needle}'"
}

# ---------------------------------------------------------------------------
# Test 1: Core files exist
# ---------------------------------------------------------------------------
echo "=== Test 1: Core files exist ==="
assert_file_exists "plugin.json exists" "$PLUGIN_DIR/plugin.json"
assert_file_exists "hooks.json exists" "$PLUGIN_DIR/hooks.json"
assert_file_exists "package.json exists" "$PLUGIN_DIR/package.json"
assert_file_exists "versions.json exists" "$PLUGIN_DIR/versions.json"
assert_file_exists "AGENTS.md exists" "$PLUGIN_DIR/AGENTS.md"

# ---------------------------------------------------------------------------
# Test 2: JSON files are valid
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 2: JSON validity ==="
assert_valid_json "plugin.json is valid JSON" "$PLUGIN_DIR/plugin.json"
assert_valid_json "hooks.json is valid JSON" "$PLUGIN_DIR/hooks.json"
assert_valid_json "package.json is valid JSON" "$PLUGIN_DIR/package.json"
assert_valid_json "versions.json is valid JSON" "$PLUGIN_DIR/versions.json"

# ---------------------------------------------------------------------------
# Test 3: versions.json has sdkVersion
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 3: versions.json has sdkVersion ==="
SDK_VERSION=$(node -e "
  const v = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  console.log(v.sdkVersion || '');
" "$PLUGIN_DIR/versions.json" 2>/dev/null)
if [[ -n "$SDK_VERSION" ]]; then
  pass "versions.json has sdkVersion: $SDK_VERSION"
else
  fail "versions.json missing sdkVersion"
fi

# ---------------------------------------------------------------------------
# Test 4: Hook scripts exist and have bash shebang
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 4: Hook scripts ==="

HOOK_SCRIPTS=$(node -e "
  const p = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  Object.values(p.hooks || {}).forEach(h => console.log(h));
" "$PLUGIN_DIR/plugin.json" 2>/dev/null)

while IFS= read -r hook_path; do
  [[ -z "$hook_path" ]] && continue
  full_path="$PLUGIN_DIR/$hook_path"
  assert_file_exists "hook script exists: $hook_path" "$full_path"

  if [[ -f "$full_path" ]]; then
    first_line=$(head -n1 "$full_path")
    if echo "$first_line" | grep -q "^#!/.*bash\|^#!/.*sh"; then
      pass "hook has shell shebang: $hook_path"
    else
      fail "hook missing shell shebang: $hook_path (got: $first_line)"
    fi
  fi
done <<< "$HOOK_SCRIPTS"

# ---------------------------------------------------------------------------
# Test 5: hooks.json hook commands reference existing files
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 5: hooks.json command references ==="

HOOK_COMMANDS=$(node -e "
  const h = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  for (const [type, matchers] of Object.entries(h.hooks || {})) {
    for (const m of matchers) {
      for (const hook of (m.hooks || [])) {
        if (hook.command) {
          // Normalize ./hooks/foo.sh to hooks/foo.sh
          console.log(hook.command.replace(/^\\.\\//,''));
        }
      }
    }
  }
" "$PLUGIN_DIR/hooks.json" 2>/dev/null)

while IFS= read -r cmd_path; do
  [[ -z "$cmd_path" ]] && continue
  full_path="$PLUGIN_DIR/$cmd_path"
  assert_file_exists "hooks.json command exists: $cmd_path" "$full_path"
done <<< "$HOOK_COMMANDS"

# ---------------------------------------------------------------------------
# Test 6: All SKILL.md files exist
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 6: SKILL.md files ==="

SKILL_FILES=$(node -e "
  const p = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  (p.skills || []).forEach(s => console.log(s.name + '|' + s.file));
" "$PLUGIN_DIR/plugin.json" 2>/dev/null)

while IFS='|' read -r skill_name skill_file; do
  [[ -z "$skill_name" ]] && continue
  full_path="$PLUGIN_DIR/$skill_file"
  assert_file_exists "SKILL.md exists for skill '$skill_name'" "$full_path"
done <<< "$SKILL_FILES"

# ---------------------------------------------------------------------------
# Test 7: package.json has required fields
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 7: package.json required fields ==="

PKG_CHECK=$(node -e "
  const pkg = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  const required = ['name','version','description','author','license'];
  const missing = required.filter(f => !pkg[f]);
  if (missing.length) {
    console.log('MISSING:' + missing.join(','));
  } else {
    console.log('OK');
  }
" "$PLUGIN_DIR/package.json" 2>/dev/null)

if [[ "$PKG_CHECK" == "OK" ]]; then
  pass "package.json has all required fields (name, version, description, author, license)"
else
  fail "package.json $PKG_CHECK"
fi

# ---------------------------------------------------------------------------
# Test 8: plugin.json has required fields
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 8: plugin.json required fields ==="

PLUGIN_CHECK=$(node -e "
  const p = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  const required = ['name','version','description','hooks','skills'];
  const missing = required.filter(f => !p[f]);
  if (missing.length) {
    console.log('MISSING:' + missing.join(','));
  } else {
    console.log('OK');
  }
" "$PLUGIN_DIR/plugin.json" 2>/dev/null)

if [[ "$PLUGIN_CHECK" == "OK" ]]; then
  pass "plugin.json has all required fields (name, version, description, hooks, skills)"
else
  fail "plugin.json $PLUGIN_CHECK"
fi

# ---------------------------------------------------------------------------
# Test 9: Hook scripts pass shell syntax check
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 9: Hook script syntax (sh -n) ==="

for hook_file in "$PLUGIN_DIR"/hooks/*.sh; do
  [[ ! -f "$hook_file" ]] && continue
  basename_file=$(basename "$hook_file")
  if sh -n "$hook_file" 2>/dev/null; then
    pass "shell syntax OK: $basename_file"
  else
    fail "shell syntax error: $basename_file"
  fi
done

# ---------------------------------------------------------------------------
# Test 10: plugin.json hooks match hooks.json entries
# ---------------------------------------------------------------------------
echo ""
echo "=== Test 10: Hook type consistency ==="

PLUGIN_HOOK_TYPES=$(node -e "
  const p = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  console.log(Object.keys(p.hooks || {}).sort().join(','));
" "$PLUGIN_DIR/plugin.json" 2>/dev/null)

HOOKS_JSON_TYPES=$(node -e "
  const h = JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
  console.log(Object.keys(h.hooks || {}).sort().join(','));
" "$PLUGIN_DIR/hooks.json" 2>/dev/null)

if [[ "$PLUGIN_HOOK_TYPES" == "$HOOKS_JSON_TYPES" ]]; then
  pass "hook types match between plugin.json and hooks.json: $PLUGIN_HOOK_TYPES"
else
  fail "hook type mismatch: plugin.json=[$PLUGIN_HOOK_TYPES] hooks.json=[$HOOKS_JSON_TYPES]"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================"
echo "  PLUGIN VALIDATION RESULTS"
echo "============================================"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"

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
echo "  All validation tests passed!"
echo ""
exit 0
