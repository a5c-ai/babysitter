# monorepo-split — Install Instructions

Set up a reproducible workflow for extracting a package from a monorepo into its own repository — using `git subtree split` or `git filter-repo` to preserve history, carrying CI config forward, and rewiring the original monorepo to consume the extracted package via its new home. For when a package has outgrown its neighborhood.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Confirm this is a monorepo: `packages/`, `apps/`, `libs/`, Lerna / Nx / pnpm / Turborepo / Rush config
2. List candidate packages with their relative paths
3. Check each candidate's:
   - Cross-package imports (does it depend on other packages in this monorepo?)
   - Reverse dependencies (do other packages depend on it?)
   - Shared infrastructure (root ESLint, tsconfig, test runners, Docker base images)
   - Commit density (is there non-trivial history worth preserving?)
4. Check tooling: `git filter-repo` installed? (preferred). Fallback: `git subtree`.
5. Summarize findings to the user

### Stage 2: Pick the Package

Ask the user which package to extract. Validate:
- The package exists at the stated path
- The package has a reasonable number of commits touching it (`git log --oneline -- <path> | wc -l`)
- The user has confirmed no critical cross-package imports remain

### Stage 3: Destination

Ask:
- New repo name (e.g. `<org>/<package>`)
- Visibility (public / private / internal)
- Create now via `gh repo create`, or point to a pre-created empty repo?
- Default branch (`main` preferred)

### Stage 4: Extraction Method

Ask (with a recommendation):

| Method | Pros | Cons |
|--------|------|------|
| **git filter-repo** (recommended) | Fast, accurate, handles renames, official | Must be installed separately |
| **git subtree split** | Built into git | Slower on large histories; no rename-following |
| **BFG Repo-Cleaner** | Very fast for large repos | Java dep; filter-repo is more flexible |

Default: **git filter-repo** if available; fall back to `git subtree split` otherwise.

### Stage 5: Cross-Repo Consumption

Ask how the monorepo will consume the extracted package:

1. **npm / PyPI package** — publish from new repo; monorepo imports published version
2. **Git URL** — monorepo depends on `git+https://github.com/<org>/<repo>.git#<sha>`
3. **Submodule** — rare, usually wrong for this case
4. **Workspace fork** — keep a trimmed mirror inside monorepo for editability

### Stage 6: Cleanup

Ask:
- Remove the package from the monorepo after extraction? (default: yes, in a follow-up PR)
- Add redirect note to the old path (`packages/<name>/README.md → "moved to <url>"`)? (default: yes)
- Preserve `CHANGELOG.md` for the package in the new repo? (default: yes)

## Step 2: Install Extraction Tooling

### git filter-repo (recommended)

```bash
# macOS
brew install git-filter-repo

# Debian / Ubuntu
sudo apt install git-filter-repo

# Manual / pip
pip install git-filter-repo

# Verify
git filter-repo --version
```

## Step 3: Scaffold the Split Script

```bash
mkdir -p scripts/monorepo-split
```

Create `scripts/monorepo-split/split.sh`:

```bash
#!/usr/bin/env bash
# Extract <subdir> from a monorepo into a standalone repo with preserved history.
set -euo pipefail

SUBDIR="${1:?usage: split.sh <subdir-relative-to-repo-root> <new-repo-url>}"
NEW_REPO_URL="${2:?usage: split.sh <subdir> <new-repo-url>}"
TMP_DIR="$(mktemp -d)"
SRC="$(git rev-parse --show-toplevel)"
DEST="$TMP_DIR/extracted"

echo "Source: $SRC"
echo "Subdir: $SUBDIR"
echo "Dest:   $DEST"
echo "New repo: $NEW_REPO_URL"

# 1. Clone a fresh mirror — filter-repo wants a clean working dir
git clone "$SRC" "$DEST"
cd "$DEST"

# 2. Filter to just the subdir, rewriting paths so <subdir>/foo.js -> foo.js
git filter-repo --subdirectory-filter "$SUBDIR" --force

# 3. Set new origin
git remote remove origin 2>/dev/null || true
git remote add origin "$NEW_REPO_URL"

# 4. Push all branches + tags
git push -u origin --all
git push origin --tags

echo "Extracted repository pushed to: $NEW_REPO_URL"
echo "Working clone remains at: $DEST"
```

Make it executable:

```bash
chmod +x scripts/monorepo-split/split.sh
```

## Step 4: Fallback — git subtree

Create `scripts/monorepo-split/split-subtree.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SUBDIR="${1:?}"
NEW_REPO_URL="${2:?}"

# Create a new branch containing only the subdir's history
git subtree split --prefix="$SUBDIR" -b split/"$SUBDIR"

# Push it to the new repo as main
git push "$NEW_REPO_URL" split/"$SUBDIR":main

# Optional: cleanup
git branch -D split/"$SUBDIR"
```

Use this when `filter-repo` is not available, but know that path renames within the subdir are not followed as cleanly.

## Step 5: CI Carryover Script

Create `scripts/monorepo-split/carryover-ci.sh` — copies relevant root-level config into the extracted repo:

```bash
#!/usr/bin/env bash
set -euo pipefail

EXTRACTED_CLONE="${1:?usage: carryover-ci.sh <path-to-extracted-clone>}"
SRC="$(git rev-parse --show-toplevel)"

cd "$EXTRACTED_CLONE"

# Root-level ESLint / Prettier / tsconfig — copy if the package relied on inheritance
for f in .prettierrc .prettierrc.* .eslintrc .eslintrc.* eslint.config.* \
         tsconfig.base.json .editorconfig .gitignore .gitattributes \
         .nvmrc .node-version .python-version .tool-versions; do
  if [ -f "$SRC/$f" ] && [ ! -e "$f" ]; then
    cp "$SRC/$f" .
    echo "Copied $f from monorepo root"
  fi
done

# Don't copy root workflow files blindly — scaffold new ones instead
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm test
EOF

echo "CI scaffolded. Review and adjust for the extracted package's needs."
```

## Step 6: Package Manifest Surgery

The extracted package's `package.json` / `pyproject.toml` likely referenced workspace paths. Fix them:

```bash
# Node
cd "$DEST"
# Resolve any "workspace:*" deps to published versions
node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
  if (!p[section]) continue;
  for (const [k, v] of Object.entries(p[section])) {
    if (v.startsWith("workspace:")) {
      console.error(`Manual fix needed: ${k} is ${v} — point to published version or file: path`);
    }
  }
}
'
# Remove monorepo-only fields
node -e '
const fs = require("fs"); const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
delete p.workspaces; delete p.private;  // re-add private if intentional
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
'
```

## Step 7: Create the New Repo (if not pre-created)

```bash
gh repo create <org>/<new-repo> --public --clone=false \
  --description "Extracted from <monorepo>/<subdir>"
```

## Step 8: Run the Split

```bash
./scripts/monorepo-split/split.sh packages/<name> git@github.com:<org>/<new-repo>.git
```

Then carry over CI:

```bash
./scripts/monorepo-split/carryover-ci.sh /tmp/<extracted-clone>
cd /tmp/<extracted-clone>
git add .
git commit -m "chore: scaffold CI + config for extracted package"
git push
```

## Step 9: Rewire the Monorepo

In a follow-up PR on the monorepo:

1. Update every consumer's `package.json`:
   ```json
   "<package>": "^1.0.0"
   ```
   (or `git+https://...` for direct-from-git)
2. Remove the extracted directory:
   ```bash
   git rm -r packages/<name>
   ```
3. Add a redirect note:
   ```bash
   mkdir -p packages/<name>
   cat > packages/<name>/README.md << EOF
   # <package> — moved

   This package has been extracted to <new-repo-url>.
   History is preserved in the new repo.
   EOF
   ```
   Or omit and rely on `git log` / `CHANGELOG.md` to document.
4. Update root workspace globs, Lerna/Nx/Turbo config, CI matrix, CODEOWNERS, release tooling.

## Step 10: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name monorepo-split --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 11: Verify Setup

1. `scripts/monorepo-split/*.sh` present and executable
2. `git filter-repo --version` succeeds (or fallback script is available)
3. Dry-run: clone the monorepo elsewhere and execute the split against a throwaway GitHub repo to confirm history-preservation
4. Extracted repo's CI passes on its first commit
5. Monorepo rewire PR passes CI with the new dependency
6. `git log` in the extracted repo shows full subdir history

## Reference

- git filter-repo: https://github.com/newren/git-filter-repo
- git subtree: https://www.atlassian.com/git/tutorials/git-subtree
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
- Lerna workspace removal: https://lerna.js.org/
- pnpm workspaces: https://pnpm.io/workspaces
