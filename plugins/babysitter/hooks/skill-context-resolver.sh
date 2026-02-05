#!/bin/bash
# Skill Context Resolver
#
# Resolves available skills relevant to the current task/run.
# Uses SDK CLI for discovery and caching.
#
# Usage:
#   skill-context-resolver.sh <RUN_ID> <PLUGIN_ROOT>
#
# Output: Compact skill summary string for injection into systemMessage
#   e.g., "cuda-toolkit (CUDA kernel dev), deep-linking (mobile deep links), ..."
#
# Also outputs full JSON to stderr for structured consumption.

set -euo pipefail

RUN_ID="${1:-}"
PLUGIN_ROOT="${2:-}"

if [[ -z "$PLUGIN_ROOT" ]]; then
  echo ""
  exit 0
fi

# CLI for skill management
CLI="${CLI:-npx -y @a5c-ai/babysitter-sdk@latest}"

# ─────────────────────────────────────────────────
# 1. Use CLI for local skill discovery (with built-in caching)
# ─────────────────────────────────────────────────
DISCOVER_ARGS=("skill:discover" "--plugin-root" "$PLUGIN_ROOT" "--json")
if [[ -n "$RUN_ID" ]]; then
  DISCOVER_ARGS+=("--run-id" "$RUN_ID")
fi
# Default cache TTL is 5 minutes (300 seconds) - CLI handles caching
DISCOVER_ARGS+=("--cache-ttl" "300")

DISCOVER_RESULT=$($CLI "${DISCOVER_ARGS[@]}" 2>/dev/null) || {
  # If discovery fails, return empty
  echo ""
  exit 0
}

# Check if we have cached result
CACHED=$(echo "$DISCOVER_RESULT" | jq -r '.cached // false')
if [[ "$CACHED" == "true" ]]; then
  # Use cached summary
  SUMMARY=$(echo "$DISCOVER_RESULT" | jq -r '.summary // ""')
  if [[ -n "$SUMMARY" ]] && [[ "$SUMMARY" != "null" ]]; then
    echo "$SUMMARY"
    # Output full JSON to stderr
    echo "$DISCOVER_RESULT" | jq '.skills // []' >&2
    exit 0
  fi
fi

# Extract local skills from CLI result
LOCAL_SKILLS=$(echo "$DISCOVER_RESULT" | jq '.skills // []')

# ─────────────────────────────────────────────────
# 2. External discovery (using CLI or fallback script)
# ─────────────────────────────────────────────────
EXTERNAL_SKILLS="[]"

# Default external sources - the babysitter skills repo
EXTERNAL_SOURCES=(
  "github|https://github.com/MaTriXy/babysitter/tree/main/plugins/babysitter/skills"
)

# Check for additional sources in .a5c/skill-sources.json
if [[ -f ".a5c/skill-sources.json" ]]; then
  while IFS= read -r source; do
    [[ -z "$source" ]] && continue
    EXTERNAL_SOURCES+=("$source")
  done < <(jq -r '.sources[]? | "\(.type)|\(.url)"' ".a5c/skill-sources.json" 2>/dev/null)
fi

for source_spec in "${EXTERNAL_SOURCES[@]}"; do
  IFS='|' read -r stype surl <<< "$source_spec"

  # Use CLI for remote fetch
  FETCH_RESULT=$($CLI skill:fetch-remote --source-type "$stype" --url "$surl" --json 2>/dev/null) || continue

  discovered=$(echo "$FETCH_RESULT" | jq '.skills // []')
  if [[ "$discovered" != "[]" ]] && [[ "$discovered" != "null" ]]; then
    EXTERNAL_SKILLS=$(echo "$EXTERNAL_SKILLS" | jq --argjson d "$discovered" '. + $d')
  fi
done

# ─────────────────────────────────────────────────
# 3. Merge and filter skills
# ─────────────────────────────────────────────────
ALL_SKILLS=$(echo "$LOCAL_SKILLS" | jq --argjson ext "$EXTERNAL_SKILLS" '. + $ext')

# Deduplicate by name
ALL_SKILLS=$(echo "$ALL_SKILLS" | jq '[group_by(.name)[] | .[0]]')

# Limit to top 30 for context window efficiency
ALL_SKILLS=$(echo "$ALL_SKILLS" | jq '.[0:30]')

# ─────────────────────────────────────────────────
# 4. Output
# ─────────────────────────────────────────────────

# Compact summary for systemMessage injection
SUMMARY=$(echo "$ALL_SKILLS" | jq -r '
  map("\(.name) (\(.description // "no description" | .[0:60]))")
  | join(", ")
')

# If empty, indicate no skills found
if [[ -z "$SUMMARY" ]] || [[ "$SUMMARY" == "null" ]]; then
  SUMMARY=""
fi

echo "$SUMMARY"

# Full JSON to stderr for structured consumers
echo "$ALL_SKILLS" >&2
