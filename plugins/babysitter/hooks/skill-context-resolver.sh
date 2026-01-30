#!/bin/bash
# Skill Context Resolver
#
# Resolves available skills relevant to the current task/run.
# Combines local skill library scanning with external discovery.
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

# ─────────────────────────────────────────────────
# Cache: avoid re-scanning on every iteration
# Cache keyed by RUN_ID, valid for 5 minutes
# ─────────────────────────────────────────────────
CACHE_DIR="/tmp/babysitter-skill-cache"
mkdir -p "$CACHE_DIR"
CACHE_FILE="$CACHE_DIR/${RUN_ID:-default}.json"
CACHE_SUMMARY="$CACHE_DIR/${RUN_ID:-default}.summary"
CACHE_TTL=300 # 5 minutes

if [[ -f "$CACHE_SUMMARY" ]]; then
  CACHE_AGE=$(( $(date +%s) - $(stat -f%m "$CACHE_SUMMARY" 2>/dev/null || stat -c%Y "$CACHE_SUMMARY" 2>/dev/null || echo 0) ))
  if [[ $CACHE_AGE -lt $CACHE_TTL ]]; then
    cat "$CACHE_SUMMARY"
    exit 0
  fi
fi

# ─────────────────────────────────────────────────
# 1. Detect run domain/category from process definition
# ─────────────────────────────────────────────────
DOMAIN=""
CATEGORY=""
if [[ -n "$RUN_ID" ]] && [[ -d ".a5c/runs/$RUN_ID" ]]; then
  # Try to read process metadata for domain hints
  PROCESS_FILE=$(find ".a5c/runs/$RUN_ID" -name "*.js" -maxdepth 1 -type f 2>/dev/null | head -1)
  if [[ -n "$PROCESS_FILE" ]]; then
    # Extract domain hints from process file comments or metadata
    DOMAIN=$(grep -oP '(?:domain|category|specialization)[:\s]*["\x27]?\K[a-z-]+' "$PROCESS_FILE" 2>/dev/null | head -1 || echo "")
  fi
fi

# ─────────────────────────────────────────────────
# 2. Scan local skill library
# ─────────────────────────────────────────────────
SKILLS_ROOT="$PLUGIN_ROOT/skills/babysit/process/specializations"
LOCAL_SKILLS="[]"

if [[ -d "$SKILLS_ROOT" ]]; then
  # Find all SKILL.md files and extract name + description
  while IFS= read -r skill_file; do
    [[ -z "$skill_file" ]] && continue

    # Parse frontmatter
    name=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$skill_file" | grep '^name:' | sed 's/name: *//' | head -1)
    desc=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$skill_file" | grep '^description:' | sed 's/description: *//' | head -1)
    cat_meta=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$skill_file" | grep -oP '(?:category|domain): *\K.*' | head -1 || echo "")

    if [[ -n "$name" ]]; then
      # Truncate description to 80 chars for compactness
      short_desc="${desc:0:80}"
      LOCAL_SKILLS=$(echo "$LOCAL_SKILLS" | jq --arg n "$name" --arg d "$short_desc" --arg c "$cat_meta" --arg f "$skill_file" \
        '. + [{"name": $n, "description": $d, "category": $c, "source": "local", "file": $f}]')
    fi
  done < <(find "$SKILLS_ROOT" -name "SKILL.md" -type f 2>/dev/null | head -50)
fi

# Also scan plugin-level skills (the main registered ones)
PLUGIN_SKILLS_DIR="$PLUGIN_ROOT/skills"
if [[ -d "$PLUGIN_SKILLS_DIR" ]]; then
  while IFS= read -r skill_file; do
    [[ -z "$skill_file" ]] && continue
    # Skip specializations (already scanned)
    [[ "$skill_file" == *"/specializations/"* ]] && continue

    name=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$skill_file" | grep '^name:' | sed 's/name: *//' | head -1)
    desc=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$skill_file" | grep '^description:' | sed 's/description: *//' | head -1)

    if [[ -n "$name" ]]; then
      short_desc="${desc:0:80}"
      LOCAL_SKILLS=$(echo "$LOCAL_SKILLS" | jq --arg n "$name" --arg d "$short_desc" --arg f "$skill_file" \
        '. + [{"name": $n, "description": $d, "category": "", "source": "local-plugin", "file": $f}]')
    fi
  done < <(find "$PLUGIN_SKILLS_DIR" -maxdepth 2 -name "SKILL.md" -type f 2>/dev/null)
fi

# ─────────────────────────────────────────────────
# 3. External discovery (if configured)
# ─────────────────────────────────────────────────
EXTERNAL_SKILLS="[]"
DISCOVERY_SCRIPT="$PLUGIN_ROOT/hooks/skill-discovery.sh"

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

if [[ -x "$DISCOVERY_SCRIPT" ]]; then
  for source_spec in "${EXTERNAL_SOURCES[@]}"; do
    IFS='|' read -r stype surl <<< "$source_spec"
    discovered=$(bash "$DISCOVERY_SCRIPT" "$stype" "$surl" 2>/dev/null || echo "[]")
    if [[ "$discovered" != "[]" ]]; then
      EXTERNAL_SKILLS=$(echo "$EXTERNAL_SKILLS" | jq --argjson d "$discovered" '. + $d')
    fi
  done
fi

# ─────────────────────────────────────────────────
# 4. Merge and filter skills
# ─────────────────────────────────────────────────
ALL_SKILLS=$(echo "$LOCAL_SKILLS" | jq --argjson ext "$EXTERNAL_SKILLS" '. + $ext')

# If we have a domain, prioritize matching skills
if [[ -n "$DOMAIN" ]]; then
  ALL_SKILLS=$(echo "$ALL_SKILLS" | jq --arg d "$DOMAIN" '
    sort_by(if (.category // "" | ascii_downcase | contains($d | ascii_downcase)) then 0 else 1 end)
  ')
fi

# Deduplicate by name
ALL_SKILLS=$(echo "$ALL_SKILLS" | jq '[group_by(.name)[] | .[0]]')

# Limit to top 30 for context window efficiency
ALL_SKILLS=$(echo "$ALL_SKILLS" | jq '.[0:30]')

# ─────────────────────────────────────────────────
# 5. Output
# ─────────────────────────────────────────────────

# Full JSON to cache
echo "$ALL_SKILLS" > "$CACHE_FILE"

# Compact summary for systemMessage injection
SUMMARY=$(echo "$ALL_SKILLS" | jq -r '
  map("\(.name) (\(.description // "no description" | .[0:60]))")
  | join(", ")
')

# If empty, indicate no skills found
if [[ -z "$SUMMARY" ]] || [[ "$SUMMARY" == "null" ]]; then
  SUMMARY=""
fi

echo "$SUMMARY" > "$CACHE_SUMMARY"
echo "$SUMMARY"

# Full JSON to stderr for structured consumers
echo "$ALL_SKILLS" >&2
