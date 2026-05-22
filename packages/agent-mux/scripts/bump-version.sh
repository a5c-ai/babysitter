#!/usr/bin/env bash
# Bump all package versions across the monorepo (TS + Python) to a single version.
# Also updates cross-package dependency references.
#
# Usage: ./scripts/bump-version.sh <new-version>
# Example: ./scripts/bump-version.sh 0.5.0
#
# Normally called by CI (publish.yml) — auto-bumps patch on every push to main.
# Can also be run manually for minor/major bumps before pushing.

set -euo pipefail

VERSION="${1:?Usage: bump-version.sh <new-version>}"

echo "Bumping all packages to v${VERSION}..."

# TS packages: bump version AND cross-package @a5c-ai/* dependency versions
for pkg in packages/agent-mux/*/package.json; do
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('${pkg}', 'utf8'));
    p.version = '${VERSION}';
    // Update @a5c-ai/* dependency versions (skip '*' wildcard deps)
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (p[depType]) {
        for (const [name, ver] of Object.entries(p[depType])) {
          if (name.startsWith('@a5c-ai/') && ver !== '*') {
            p[depType][name] = '${VERSION}';
          }
        }
      }
    }
    fs.writeFileSync('${pkg}', JSON.stringify(p, null, 2) + '\n');
  "
  echo "  ✓ ${pkg}"
done

# Python package (pyproject.toml + __init__.py)
PYPROJECT="packages/agent-mux/amux-proxy/pyproject.toml"
PYINIT="packages/agent-mux/amux-proxy/src/amux_proxy/__init__.py"

sed -i "s/^version = \".*\"/version = \"${VERSION}\"/" "${PYPROJECT}"
echo "  ✓ ${PYPROJECT}"

sed -i "s/__version__ = \".*\"/__version__ = \"${VERSION}\"/" "${PYINIT}"
echo "  ✓ ${PYINIT}"

echo ""
echo "All packages bumped to v${VERSION}"
