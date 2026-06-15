#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  cat <<'USAGE' >&2
Usage: scripts/rollback-release.sh vX.Y.Z

Deletes the GitHub Release + tag for the provided version and removes the tag
from the remote. Run this from the repository root with a clone that has write
access to origin. The GitHub CLI (`gh`) must be authenticated (GH_TOKEN or
device login) before running the script.
USAGE
  exit 1
fi

TAG="$1"

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: TAG must match vX.Y.Z format (e.g. v1.2.3), got: ${TAG}" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI is required for release rollback" >&2
  exit 1
fi

echo "Rolling back release ${TAG}"

if gh release view "$TAG" >/dev/null 2>&1; then
  gh release delete "$TAG" -y
else
  echo "GitHub Release ${TAG} not found; skipping deletion."
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  git tag -d "$TAG"
fi

git push origin ":refs/tags/$TAG"

cat <<'NEXT_STEPS'
Tag removed. If the release commit already merged to main, revert it (or cherry-pick
back the previous version) so CHANGELOG and package versions match the last good release.
Remember to re-open any reverted fixes in the Unreleased section of CHANGELOG.md.
NEXT_STEPS
