# repo-archival — Install Instructions

Set up a dignified end-of-life for a repository — walk through an archival checklist, replace the README with a redirect template, export the dependency graph and CI configuration for posterity, and notify stakeholders via a templated script. Archival should feel intentional, not abandoned.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect repo age: first commit date, number of commits, number of contributors
2. Identify ownership: `CODEOWNERS`, `README.md` maintainer section, top committers
3. Check for downstream consumers:
   - GitHub dependents graph (public repos only)
   - `package.json` `name` → search npm for reverse deps
   - PyPI downloads (if Python)
   - Internal Slack / wiki mentions (user knowledge)
4. Check for undeployed changes: unreleased tags, open PRs, open issues
5. Check last deploy / release date
6. Detect migration target: fork, rewrite, sunset entirely
7. Summarize findings to the user

### Stage 2: Archival Reason

Ask for the reason (affects README template tone):

1. **Superseded** — replaced by another project (link required)
2. **Sunset** — feature discontinued; no replacement
3. **Merged** — absorbed into a larger repo / monorepo
4. **Abandoned** — no active maintainers; left as-is for reference
5. **Private → public historical** — opening the archive for transparency

### Stage 3: Stakeholder Notification

Ask who to notify:

- Direct users (if there's a mailing list, Slack channel, GitHub Discussions)
- npm / PyPI consumers (via deprecation message)
- Downstream orgs in the dependents graph
- Internal teams (via generated Slack/email template)
- None (silent archival — rare, usually wrong)

### Stage 4: Timing

Ask:
- When to archive? (default: 14 days after notification)
- Keep read-only access for how long? (default: indefinitely; GitHub archived repos remain readable forever)
- Cut a final release tag first? (default: **yes** — always cut a final release even if trivial)

### Stage 5: Migration Aids

Ask whether to:
- Export dependency graph (default: yes)
- Export CI config snapshot (default: yes)
- Write a migration guide (required if Superseded / Merged)
- Tag all open issues with `archived` (default: yes)
- Close or transfer open PRs (default: comment-and-close; offer to transfer to successor)

## Step 2: Create the Archival Checklist

Create `ARCHIVAL.md` in the repo:

```markdown
# Archival checklist

Status: **In progress** (started YYYY-MM-DD by @<maintainer>)

## 1. Announcement (T-14 days)
- [ ] Announcement posted (GitHub Discussion / README banner / Slack / mailing list)
- [ ] Stakeholders notified via `scripts/archival/notify.sh`
- [ ] npm / PyPI deprecation message published
- [ ] Successor project (if any) documented: <link>

## 2. Final release (T-7 days)
- [ ] Final CHANGELOG entry "## [X.Y.Z] - YYYY-MM-DD — Final release"
- [ ] Tag pushed: `git tag vX.Y.Z -m "Final release before archival"`
- [ ] Binary / package published (`npm publish` / `pip upload` / etc.)

## 3. Export artifacts (T-3 days)
- [ ] Dependency graph exported → `docs/archive/dependency-graph.json`
- [ ] CI config snapshot → `docs/archive/ci-snapshot/`
- [ ] Issues / PRs labeled `archived`
- [ ] Open PRs commented and closed or transferred

## 4. README redirect (T-1 day)
- [ ] README replaced with redirect template
- [ ] Old README preserved at `docs/archive/README-original.md`

## 5. Archive (T-day)
- [ ] Repo archived on GitHub (Settings → Danger Zone → Archive this repository)
- [ ] npm / PyPI package marked deprecated
- [ ] Successor repo's README updated to reference this one (if applicable)
- [ ] ARCHIVAL.md updated: Status = **Archived**
```

## Step 3: Scaffold the Scripts Directory

```bash
mkdir -p scripts/archival docs/archive
```

## Step 4: Dependency Graph Export

Create `scripts/archival/export-deps.sh`:

```bash
#!/usr/bin/env bash
# Export dependency graph for posterity
set -euo pipefail

out=docs/archive/dependency-graph.json
mkdir -p "$(dirname "$out")"

if [ -f package.json ]; then
  # Node — use npm ls (full tree)
  npm ls --all --json > "$out" 2>/dev/null || true
elif [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  # Python — freeze exact versions
  pip freeze --all > docs/archive/requirements-frozen.txt
  # Plus pipdeptree if available
  pipdeptree --json > "$out" 2>/dev/null || true
elif [ -f go.mod ]; then
  go mod graph > docs/archive/go-mod-graph.txt
  go list -m -json all > "$out"
elif [ -f Cargo.toml ]; then
  cargo tree --format '{p} {f}' > docs/archive/cargo-tree.txt
  cargo metadata --format-version 1 > "$out"
else
  echo "Unknown ecosystem; skipping dependency graph export."
fi

# GitHub dependents (public repos only)
if command -v gh >/dev/null; then
  repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
  gh api "repos/$repo/dependents" 2>/dev/null > docs/archive/github-dependents.json || true
fi

echo "Dependency graph exported to $out"
```

## Step 5: CI Snapshot Export

Create `scripts/archival/export-ci.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

dest=docs/archive/ci-snapshot
mkdir -p "$dest"

for path in .github/workflows .gitlab-ci.yml .circleci .buildkite .drone.yml azure-pipelines.yml Jenkinsfile; do
  if [ -e "$path" ]; then
    cp -r "$path" "$dest/"
  fi
done

echo "CI snapshot written to $dest"
```

## Step 6: Stakeholder Notification

Create `scripts/archival/notify.sh` (template — user fills in channels):

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
SUCCESSOR="${SUCCESSOR:-<link-to-successor-or-empty>}"
ARCHIVE_DATE="${ARCHIVE_DATE:-YYYY-MM-DD}"

read -r -d '' MESSAGE <<EOF
[Archival notice] $REPO will be archived on $ARCHIVE_DATE.

Reason: <superseded | sunset | merged | abandoned>
Successor: $SUCCESSOR

What this means:
- The repository will become read-only on $ARCHIVE_DATE
- No further releases, issues, or PRs will be accepted
- Existing installs continue to work; no auto-removal
- Security issues will not be patched after archival

If you have blockers, reach out in the pinned GitHub Discussion: <link>
EOF

# GitHub Discussion
gh issue create --title "[Archival] $REPO archiving on $ARCHIVE_DATE" --body "$MESSAGE" --label archival-notice

# Optional: Slack webhook
if [ -n "${SLACK_WEBHOOK:-}" ]; then
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    -d "$(jq -Rs '{text: .}' <<< "$MESSAGE")"
fi

# Optional: npm deprecate
if [ -f package.json ]; then
  pkg=$(jq -r .name package.json)
  echo "Run manually when ready: npm deprecate $pkg 'Archived on $ARCHIVE_DATE. $SUCCESSOR'"
fi
```

Make scripts executable:

```bash
chmod +x scripts/archival/*.sh
```

## Step 7: README Redirect Template

Save the current README for posterity:

```bash
cp README.md docs/archive/README-original.md
```

Create `docs/archive/README-redirect-template.md`:

```markdown
# <Project Name>

> **This project is archived.**
> Final release: [vX.Y.Z](https://github.com/OWNER/REPO/releases/tag/vX.Y.Z)
> Archived on: YYYY-MM-DD · Reason: <superseded | sunset | merged>

## Successor
This project has been replaced by **[<successor-name>](<successor-link>)**.
Please migrate using the [migration guide](./docs/archive/MIGRATION.md).

## Historical docs
- [Original README](./docs/archive/README-original.md)
- [Dependency graph at archival](./docs/archive/dependency-graph.json)
- [Final CI configuration](./docs/archive/ci-snapshot/)

## Status
- Issues: closed, no new issues accepted
- Pull requests: closed, no new PRs accepted
- Security: unpatched after archival date

For historical context, the full git history remains readable.
```

Copy to root when ready to swap:

```bash
cp docs/archive/README-redirect-template.md README.md
# Fill in placeholders, then commit
```

## Step 8: Migration Guide (if Superseded / Merged)

Create `docs/archive/MIGRATION.md` with:
- API mapping table: old endpoint → new endpoint
- Config key migration: old name → new name
- Data migration steps
- Breaking changes vs. the successor
- Timeline expectations

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name repo-archival --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `ARCHIVAL.md` exists with the full checklist
2. `scripts/archival/*.sh` are present and executable
3. `./scripts/archival/export-deps.sh` produces `docs/archive/dependency-graph.json`
4. `./scripts/archival/export-ci.sh` mirrors CI config under `docs/archive/ci-snapshot/`
5. README redirect template is drafted (not yet swapped in)
6. Stakeholder notification script tested with a dry-run (edit to add `echo` prefix)
7. User has a clear T-14 → T-day timeline

## Reference

- GitHub archiving: https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories
- npm deprecate: https://docs.npmjs.com/cli/v10/commands/npm-deprecate
- PyPI Yanking/Deprecation: https://pypi.org/help/#yanked
- Writing a good migration guide: https://docs.github.com/en/get-started/writing-on-github
