# scorecard — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Remediation only** — Remove auto-issue workflow, keep Scorecard analysis
2. **Analysis only** — Remove Scorecard workflow, keep remediation (rare)
3. **Everything** — Remove workflows, badge, config, documentation
4. **Selective** — Let the user pick

**Warning**: Removing Scorecard drops the weekly snapshot of the repo's supply-chain posture. Any open remediation issues tracked to Scorecard checks will become orphaned. Confirm before proceeding.

## Step 2: Remove Workflows

```bash
rm -f .github/workflows/scorecard.yml
rm -f .github/workflows/scorecard-remediation.yml
```

## Step 3: Remove Config

```bash
rm -f .github/scorecard.yml
```

## Step 4: Remove README Badge

Edit `README.md` and delete the line:

```markdown
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/OWNER/REPO/badge)](https://scorecard.dev/viewer/?uri=github.com/OWNER/REPO)
```

## Step 5: Remove SECURITY.md Additions

If `SECURITY.md` was extended with Scorecard-remediation guidance solely by this plugin, revert or trim those sections. Leave the base `SECURITY.md` (reporting instructions) intact — it benefits more than just Scorecard.

## Step 6: Close or Relabel Remediation Issues

Open issues with the `scorecard` label become orphaned when the workflow is removed. Decide:

- **Keep open** and change label to `tech-debt` (recommended if the findings are still valid)
- **Close with a comment** pointing to the removed workflow
- **Delete** (requires repo admin)

```bash
gh issue list --label scorecard --state open --json number --jq '.[].number' \
  | while read n; do gh issue comment "$n" --body "Scorecard plugin uninstalled; closing or relabeling this issue."; done
```

## Step 7: Remove Secrets

If `SCORECARD_TOKEN` was added for private-repo support, remove it at `Settings → Secrets and variables → Actions`.

## Step 8: Delete Published Results (Public Repos)

Public results on `scorecard.dev` update on each workflow run. Once the workflow is removed, the last published result persists indefinitely. To request removal, follow the deletion process documented at https://scorecard.dev (typically via GitHub issue on the `ossf/scorecard` repo).

## Step 9: Code Scanning Alerts

Existing SARIF uploads remain in `Security → Code scanning`. To clean:

1. Navigate to `Security → Code scanning → Scorecard`
2. Dismiss outstanding alerts manually, or wait for automatic closure after the configured retention period
3. Alternatively, filter by tool `scorecard` and dismiss in bulk via the GitHub UI

## Step 10: Unpin Actions (Optional)

If Actions were pinned to SHAs solely because of Scorecard's `Pinned-Dependencies` check, consider keeping them pinned — it remains a good practice. Unpin only if the team finds the maintenance overhead prohibitive:

```yaml
# from: uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332  # v6
# to:   uses: actions/checkout@v6
```

## Step 11: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name scorecard --project --json
```

## Notes

- The Scorecard public dataset retains historical scores for the repo indefinitely
- CI history from the removed workflows remains in GitHub Actions run history
- Any SARIF data uploaded to GitHub code scanning persists according to GitHub's retention policy
