# monorepo-split — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Pre-split (never ran)** — Remove the scaffolded scripts; nothing was executed
2. **Post-split (executed successfully)** — Remove scripts; the extracted repo and monorepo rewire remain
3. **Mid-split (paused or partial)** — Diagnose state and decide whether to resume or rollback

**Warning**: If the split already ran, the extracted repository is an independent entity with its own history, PRs, and releases. Removing this plugin from the source monorepo does **not** affect the extracted repo. Similarly, this uninstaller does not rollback a split; rollback is a separate, careful operation.

## Step 2: Determine State

```bash
# Was a split branch ever created in the monorepo?
git branch -a | grep '^\s*split/' || echo "No split branches found."

# Was the package removed from the monorepo?
ls packages/<name>/ 2>/dev/null && echo "Still present." || echo "Already removed."
```

## Step 3: Remove the Split Scripts

```bash
rm -rf scripts/monorepo-split
```

## Step 4: Uninstall filter-repo (If Installed Only for This)

**Do not remove** if other workflows (audit, rewrite-history, anonymization) use it.

```bash
# macOS
brew uninstall git-filter-repo

# Debian / Ubuntu
sudo apt remove git-filter-repo

# pip
pip uninstall git-filter-repo
```

## Step 5: Rollback a Mid-split

If the split branch was created but never pushed:

```bash
git branch -D split/<name>
```

If the split was pushed but the monorepo rewire never landed:

1. Decide whether to keep the extracted repo or delete it
2. To delete: `gh repo delete <org>/<new-repo> --yes`
3. Leave the monorepo untouched

If the monorepo rewire partially landed:

- Revert the rewire PR if it broke consumers
- Or finish the rewire carefully

## Step 6: Rollback a Completed Split (Rare)

Reversing a split is non-trivial and almost always a mistake:

1. `git revert` the monorepo rewire PR (re-adds the subdir and restores workspace consumption)
2. Archive the extracted repo (see `repo-archival` plugin)
3. Make sure no external consumers have already migrated to depend on the extracted repo

If external consumers exist, do not rollback — migrate forward instead.

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/monorepo-split
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name monorepo-split --project --json
```

## Notes

- The extracted repo is an independent artifact; uninstalling this plugin on the source monorepo does not affect it
- Git history in the extracted repo (via `filter-repo`) is rewritten — SHAs do not match the source monorepo's SHAs. Any tooling that references original SHAs (e.g., deploy pipelines, issue comments linking commits) should be reviewed
- The monorepo's CHANGELOG may mention versions of the extracted package; keep those mentions — they are historical record
- If CODEOWNERS still routes issues to the extracted subdir path, update it after rewire
