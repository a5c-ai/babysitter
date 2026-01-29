#!/bin/bash
# Skill Discovery - External Skill Fetching
#
# Discovers skills from external sources:
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

# Helper: fetch URL content with timeout
fetch_url() {
  local url="$1"
  curl -sL --max-time 10 --fail "$url" 2>/dev/null || echo ""
}

# Helper: parse SKILL.md frontmatter for name and description
parse_skill_frontmatter() {
  local content="$1"
  local name desc
  name=$(echo "$content" | sed -n '/^---$/,/^---$/{ /^---$/d; p; }' | grep '^name:' | sed 's/name: *//' | head -1)
  desc=$(echo "$content" | sed -n '/^---$/,/^---$/{ /^---$/d; p; }' | grep '^description:' | sed 's/description: *//' | head -1)
  if [[ -n "$name" ]]; then
    echo "$name|$desc"
  fi
}

# ─────────────────────────────────────────────────
# GitHub Discovery
# Fetches skill listing from a GitHub repo directory
# ─────────────────────────────────────────────────
discover_github() {
  local url="$1"
  local skills_json="[]"

  # Convert GitHub web URL to API URL
  # https://github.com/OWNER/REPO/tree/BRANCH/PATH -> https://api.github.com/repos/OWNER/REPO/contents/PATH?ref=BRANCH
  local api_url=""
  if [[ "$url" =~ github\.com/([^/]+)/([^/]+)/tree/([^/]+)/(.*) ]]; then
    local owner="${BASH_REMATCH[1]}"
    local repo="${BASH_REMATCH[2]}"
    local branch="${BASH_REMATCH[3]}"
    local path="${BASH_REMATCH[4]}"
    api_url="https://api.github.com/repos/$owner/$repo/contents/$path?ref=$branch"
  elif [[ "$url" =~ github\.com/([^/]+)/([^/]+)/? ]]; then
    local owner="${BASH_REMATCH[1]}"
    local repo="${BASH_REMATCH[2]}"
    api_url="https://api.github.com/repos/$owner/$repo/contents/skills?ref=main"
  else
    echo "[]"
    return
  fi

  # Fetch directory listing
  local listing
  listing=$(fetch_url "$api_url")
  if [[ -z "$listing" ]]; then
    echo "[]"
    return
  fi

  # Find directories that likely contain SKILL.md
  local dirs
  dirs=$(echo "$listing" | jq -r '.[] | select(.type == "dir") | .name' 2>/dev/null || echo "")

  if [[ -z "$dirs" ]]; then
    # Maybe it's a flat listing with SKILL.md files directly
    local skill_files
    skill_files=$(echo "$listing" | jq -r '.[] | select(.name == "SKILL.md") | .download_url' 2>/dev/null || echo "")
    if [[ -n "$skill_files" ]]; then
      local content
      content=$(fetch_url "$skill_files")
      if [[ -n "$content" ]]; then
        local parsed
        parsed=$(parse_skill_frontmatter "$content")
        if [[ -n "$parsed" ]]; then
          local sname sdesc
          sname=$(echo "$parsed" | cut -d'|' -f1)
          sdesc=$(echo "$parsed" | cut -d'|' -f2-)
          skills_json=$(jq -n --arg n "$sname" --arg d "$sdesc" --arg u "$url" \
            '[{"name": $n, "description": $d, "source": "remote", "url": $u}]')
        fi
      fi
    fi
    echo "$skills_json"
    return
  fi

  # For each subdirectory, try to fetch SKILL.md
  local results="[]"
  local count=0
  while IFS= read -r dir; do
    [[ -z "$dir" ]] && continue
    # Limit to 20 skills to avoid rate limiting
    ((count++)) && [[ $count -gt 20 ]] && break

    # Build raw URL for SKILL.md in this subdirectory
    local raw_base=""
    if [[ "$url" =~ github\.com/([^/]+)/([^/]+)/tree/([^/]+)/(.*) ]]; then
      raw_base="https://raw.githubusercontent.com/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}/${BASH_REMATCH[3]}/${BASH_REMATCH[4]}"
    fi

    if [[ -n "$raw_base" ]]; then
      local skill_url="$raw_base/$dir/SKILL.md"
      local content
      content=$(fetch_url "$skill_url")
      if [[ -n "$content" ]]; then
        local parsed
        parsed=$(parse_skill_frontmatter "$content")
        if [[ -n "$parsed" ]]; then
          local sname sdesc
          sname=$(echo "$parsed" | cut -d'|' -f1)
          sdesc=$(echo "$parsed" | cut -d'|' -f2-)
          results=$(echo "$results" | jq --arg n "$sname" --arg d "$sdesc" --arg u "$skill_url" \
            '. + [{"name": $n, "description": $d, "source": "remote", "url": $u}]')
        fi
      fi
    fi
  done <<< "$dirs"

  echo "$results"
}

# ─────────────────────────────────────────────────
# Well-Known Discovery (Vercel convention)
# Fetches .well-known/skills/index.json
# ─────────────────────────────────────────────────
discover_well_known() {
  local base_url="$1"
  # Strip trailing slash
  base_url="${base_url%/}"

  # Try path-relative first, then root
  local index_content=""
  local index_url="$base_url/.well-known/skills/index.json"
  index_content=$(fetch_url "$index_url")

  if [[ -z "$index_content" ]]; then
    # Try root well-known
    local host
    host=$(echo "$base_url" | sed -E 's|^https?://([^/]+).*|\1|')
    index_url="https://$host/.well-known/skills/index.json"
    index_content=$(fetch_url "$index_url")
  fi

  if [[ -z "$index_content" ]]; then
    echo "[]"
    return
  fi

  # Validate and extract skills from index
  local skills
  skills=$(echo "$index_content" | jq -r '
    .skills // [] |
    map({
      name: .name,
      description: (.description // ""),
      source: "remote",
      url: "'"$base_url"'"
    })
  ' 2>/dev/null || echo "[]")

  echo "$skills"
}

# ─────────────────────────────────────────────────
# Main dispatch
# ─────────────────────────────────────────────────
case "$SOURCE_TYPE" in
  github)
    discover_github "$SOURCE_URL"
    ;;
  well-known)
    discover_well_known "$SOURCE_URL"
    ;;
  *)
    echo "[]"
    ;;
esac
