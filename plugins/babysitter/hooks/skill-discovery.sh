#!/bin/bash
# Skill Discovery - External Skill Fetching
#
# Thin wrapper around the SDK CLI for fetching skills from external sources:
# 1. GitHub repositories (raw SKILL.md files from a skills/ directory)
# 2. Well-known URLs (.well-known/skills/index.json - Vercel convention)
#
# Usage:
#   skill-discovery.sh <source-type> <url>
#   skill-discovery.sh github "https://github.com/MaTriXy/babysitter/tree/main/plugins/babysitter/skills"
#   skill-discovery.sh well-known "https://example.com"
#
# Output: JSON array of discovered skills on stdout
#   [{"name": "...", "description": "...", "source": "remote", "url": "..."}]

set -euo pipefail

SOURCE_TYPE="${1:-}"
SOURCE_URL="${2:-}"

if [[ -z "$SOURCE_TYPE" ]] || [[ -z "$SOURCE_URL" ]]; then
  echo "[]"
  exit 0
fi

# Validate source type
if [[ "$SOURCE_TYPE" != "github" ]] && [[ "$SOURCE_TYPE" != "well-known" ]]; then
  echo "[]"
  exit 0
fi

# CLI for skill management
CLI="${CLI:-npx -y @a5c-ai/babysitter-sdk@latest}"

# Use CLI for remote fetch (handles all curl/jq/API logic internally)
FETCH_RESULT=$($CLI skill:fetch-remote --source-type "$SOURCE_TYPE" --url "$SOURCE_URL" --json 2>/dev/null) || {
  # If fetch fails, return empty array
  echo "[]"
  exit 0
}

# Extract skills array from result
SKILLS=$(echo "$FETCH_RESULT" | jq '.skills // []' 2>/dev/null) || SKILLS="[]"

echo "$SKILLS"
