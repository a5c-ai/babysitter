# contribution-graph — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep scripts, workflows, dashboard
2. **Everything** — Remove stats scripts, workflows, `docs/contributors.md`, README badge
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing the welcome workflow silently strips onboarding for new contributors. Removing all-contributors entries erases public recognition. Confirm before proceeding.

## Step 2: Remove Workflows

```bash
rm -f .github/workflows/contribution-graph.yml
rm -f .github/workflows/welcome.yml
```

If the welcome job was part of a larger community workflow, remove only the relevant job.

## Step 3: Remove Scripts

```bash
rm -rf scripts/contribution-graph
```

## Step 4: Remove Dashboard

```bash
rm -f docs/contributors.md
```

**Keep** `CONTRIBUTORS.md` and `AUTHORS` — those are hand-maintained recognition, separate from the generated dashboard.

## Step 5: Remove README Badge

Edit `README.md` and delete:

```markdown
![Contributors](https://img.shields.io/github/contributors/...)
![Activity](https://img.shields.io/github/commit-activity/...)
```

## Step 6: Remove all-contributors (Optional)

**Do not remove** if the project has accumulated contributors in the README. The recognition is a feature.

If truly no longer wanted:

```bash
npm uninstall all-contributors-cli
rm -f .all-contributorsrc
```

And remove the contributors table from the README manually, preserving the names in `CONTRIBUTORS.md` first.

Uninstall the all-contributors bot via the GitHub app page.

## Step 7: Remove Dependencies (if unused)

```bash
npm uninstall @octokit/rest
```

Check first:

```bash
grep -rn "@octokit/rest" . --include="*.mjs" --include="*.js" --include="*.ts"
```

**Do not remove** if DORA plugin or other scripts use it.

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/contribution-graph
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name contribution-graph --project --json
```

## Notes

- Contributor names in `docs/contributors.md` and `CONTRIBUTORS.md` represent real people who invested in the project; keep them even without the tooling
- GitHub's native "Insights → Contributors" page remains available regardless of this plugin
- Historical commits in `git log` are the authoritative record; dashboards are derived data
- If migrating to an external analytics tool (OSS Insights, LinearB), export the last dashboard snapshot first
