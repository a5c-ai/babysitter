# repo-archival — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Pre-archival (never ran)** — Full removal; the scaffold was never used
2. **Post-archival (already executed)** — Clean up only the plugin scripts; keep all archive artifacts
3. **Mid-archival (paused)** — Stop the process; decide whether to resume or rollback

**Warning**: If archival has already been executed, the repo is read-only on GitHub. Changes to the working tree are still possible locally but cannot be pushed. Removing archive artifacts (`docs/archive/*`) after archival is highly discouraged — they are the post-mortem record.

## Step 2: Determine Archival State

Check:

```bash
# Is ARCHIVAL.md marked "Archived"?
grep -c 'Status:.*Archived' ARCHIVAL.md 2>/dev/null || echo 0

# Is the repo archived on GitHub?
gh repo view --json isArchived -q .isArchived 2>/dev/null
```

If `isArchived == true`, the repo cannot accept new pushes. This uninstaller is mostly documentation; the "unarchive" step (if desired) must be done via GitHub Settings → Danger Zone.

## Step 3: Rollback Mid-archival (If Paused)

If archival was started but not executed:

```bash
# Restore original README
cp docs/archive/README-original.md README.md

# Close the archival announcement issue
gh issue list --label archival-notice --state open --json number \
  | jq -r '.[].number' \
  | xargs -I {} gh issue close {} --comment "Archival cancelled."

# Remove Unreleased CHANGELOG entry for "Final release" if it was drafted
$EDITOR CHANGELOG.md
```

Delete the checklist:

```bash
rm -f ARCHIVAL.md
```

## Step 4: Remove Scripts (Pre-archival Only)

**Only if archival was never executed.**

```bash
rm -rf scripts/archival
```

## Step 5: Remove Scaffolded Templates (Pre-archival Only)

```bash
rm -f docs/archive/README-redirect-template.md
```

**Keep** `docs/archive/README-original.md`, `docs/archive/dependency-graph.json`, `docs/archive/ci-snapshot/`, and `docs/archive/MIGRATION.md` even in pre-archival state — they are snapshots of work already done.

## Step 6: Post-archival Cleanup

If archival is complete:

```bash
# Only remove the babysitter scaffolding; preserve everything under docs/archive/
rm -rf scripts/archival
```

**Do not touch**:
- `docs/archive/*` — historical record
- `ARCHIVAL.md` — the audit trail of the archival itself
- `README.md` — redirect for future visitors
- `CHANGELOG.md` — includes the final-release entry
- Any git tags or releases

## Step 7: Unarchive the Repo (Rare)

If archival was executed in error:

1. Navigate to the repo Settings page on GitHub
2. Scroll to Danger Zone → "Unarchive this repository"
3. Click Unarchive

After unarchiving:

- Restore README from `docs/archive/README-original.md` if desired
- Reopen closed issues / PRs selectively (cannot bulk-reopen archived items; must be done one at a time)
- Un-deprecate npm / PyPI packages:
  ```bash
  npm deprecate <pkg>@'*' ''
  ```
- Re-enable CI workflows (archived repos silently skip schedules)

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/repo-archival
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name repo-archival --project --json
```

## Notes

- Archiving is one of the few near-irreversible operations in a repo's life; this uninstaller deliberately refuses to touch archive artifacts
- Stakeholders who received notifications may still have expectations; communicate any reversal explicitly
- If the successor project references this repo's archive, do not break those links
