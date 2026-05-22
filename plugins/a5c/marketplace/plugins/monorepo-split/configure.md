# monorepo-split — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `method` | `filter-repo`, `subtree`, `bfg` | `filter-repo` | which script runs |
| `sourceSubdir` | relative path | (required) | e.g. `packages/foo` |
| `newRepoUrl` | git URL | (required) | `git@github.com:org/new-repo.git` |
| `newRepoVisibility` | `public`, `private`, `internal` | `private` | used for `gh repo create` |
| `preserveTags` | `on`, `off` | `on` | `git push --tags` |
| `rewriteAuthors` | `on`, `off` | `off` | filter-repo `--mailmap` |
| `stripNonSubdirHistory` | `on`, `off` | `on` | default behavior of subdirectory-filter |
| `consumptionStrategy` | `npm`, `git-url`, `submodule`, `workspace-fork` | `npm` | rewire step in monorepo |
| `removeFromMonorepo` | `on`, `off`, `redirect-only` | `redirect-only` | follow-up PR |
| `ciCarryover` | `on`, `off` | `on` | carryover-ci.sh |
| `branchesToPush` | csv or `all` | `all` | `git push origin --all` |

## 2. Preserve Selected Paths Only

Instead of a full subdirectory filter, keep only specific files:

```bash
git filter-repo \
  --path packages/foo/ \
  --path-rename packages/foo/:'' \
  --path README.md \
  --path LICENSE
```

Useful when the extracted package wants to also carry root-level LICENSE or CONTRIBUTING.

## 3. Rewrite Author Emails

If the extracted repo is going public and the monorepo has internal emails, create a mailmap:

```
# mailmap.txt
Public Name <public@email.com>  Internal <alice@internal.example>
```

```bash
git filter-repo --subdirectory-filter packages/foo --mailmap mailmap.txt
```

## 4. Limit Branches

Only extract `main` and `release/*`:

```bash
git filter-repo --subdirectory-filter packages/foo --refs main refs/heads/release/*
```

## 5. Preserve Issues & PRs (They're Not Preserved)

Issues and PRs **cannot** be extracted via git tooling — they live in GitHub's database.

Options:

1. Export via `gh issue list --json ... > issues.json` and import via `gh issue create` against the new repo (loses thread structure; tedious).
2. Open a "History pointer" issue on the new repo linking to the original monorepo issues tagged with the package name.
3. For commercial tools, use github.com/stephen-turner/github-issue-mover or similar.

Default: option 2 — pragmatic, preserves findability.

## 6. Consumption Strategy: Published Package

Rewire monorepo `package.json`:

```json
{
  "dependencies": {
    "@org/foo": "^1.0.0"
  }
}
```

Publish from the extracted repo:

```bash
cd /path/to/extracted
npm publish --access public  # or --access restricted
```

Use changesets or release-please in the extracted repo for ongoing versioning.

## 7. Consumption Strategy: Git URL

```json
{
  "dependencies": {
    "@org/foo": "git+https://github.com/org/new-repo.git#<sha>"
  }
}
```

Lock to a SHA, not a branch — branch-pinned deps cause reproducibility nightmares.

## 8. Carry Over CODEOWNERS

The root monorepo CODEOWNERS likely had entries for the extracted subdir. Copy them into the extracted repo as the new root CODEOWNERS:

```bash
# Source entry:
# packages/foo/** @org/foo-team

# Becomes in new repo:
# ** @org/foo-team
# or more specific per-directory entries
```

## 9. Preserve CI Matrix Quality

The extracted repo's new `ci.yml` starts minimal. Port the relevant parts from the monorepo's root CI:

- Node / Python / Go version matrix
- OS matrix (if cross-platform was tested)
- Test sharding strategy
- Caching keys
- Secrets (re-add to the new repo via `gh secret set`)

## 10. Retain CHANGELOG

If the monorepo had a per-package `CHANGELOG.md`, it extracts correctly via filter-repo. If changelog entries were in the monorepo root, extract relevant sections manually into the new repo.

```bash
# After split:
cd /path/to/extracted
# The per-package CHANGELOG is now at root automatically
ls -la CHANGELOG.md
```

## 11. Cleanup Commits to Reclaim Space

After split, the monorepo's `.git` directory still references the old objects. To reclaim space (optional, most teams skip this):

```bash
# In the monorepo — CAREFUL, this rewrites history
git filter-repo --path packages/<name> --invert-paths --force
# Force-push all branches; coordinate with every collaborator
```

**Do not do this lightly.** It invalidates every existing clone and every open PR. Usually not worth it; monorepo .git grows slowly and the history is valuable audit material.

## 12. Automated End-to-End via Babysitter

```bash
babysitter run:create \
  --process-id monorepo-split-orchestrate \
  --entry .a5c/processes/monorepo-split/orchestrate.js#process \
  --prompt "Extract packages/foo into github.com/org/foo, carry CI, open rewire PR on monorepo" \
  --json
```

The process requests breakpoints before the filter-repo push, before the rewire PR, and before any merge.
