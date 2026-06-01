# dora-metrics — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep workflow, script, and historical reports
2. **Everything** — Remove query script, workflow, dashboard integration, and plugin registration
3. **Selective** — Let the user choose which pieces to remove

**Warning**: Historical DORA report issues are organizational memory of deployment and incident trends. Do not delete those issues. Confirm the scope before proceeding.

## Step 2: Remove the Report Workflow

```bash
rm -f .github/workflows/dora-report.yml
```

If the DORA job was added to an existing workflow, remove only the `report` job — preserve the rest.

## Step 3: Remove the Query Script

```bash
rm -rf scripts/dora
```

## Step 4: Remove npm Script

Edit `package.json`:

```json
{
  "scripts": {
    "dora": "..."
  }
}
```

Delete the `dora` entry.

## Step 5: Remove Dependencies (if unused elsewhere)

```bash
npm uninstall @octokit/rest
```

**Do not remove** `@octokit/rest` if other scripts / workflows use it. Check with:

```bash
grep -rn "@octokit/rest" . --include="*.mjs" --include="*.js" --include="*.ts"
```

## Step 6: Remove Performance-band Docs

```bash
rm -f docs/dora/bands.md
rmdir docs/dora 2>/dev/null || true
```

## Step 7: Keep or Remove Historical Report Issues

**Default: keep.** Historical monthly issues labelled `dora` are the point of running the plugin in the first place. If the user insists on removing them:

```bash
gh issue list --label dora --state all --json number -q '.[].number' \
  | xargs -I {} gh issue delete {} --yes
```

Only do this with explicit user confirmation.

## Step 8: Remove Labels (Optional)

If `sev-1` / `sev-2` / `incident` labels were created solely for this plugin:

```bash
gh label delete dora --yes
```

**Do not remove** `incident` / `sev-*` labels — they are shared with on-call and triage.

## Step 9: Remove Dashboard Integration

If `DORA_DASHBOARD_URL` / `DORA_DASHBOARD_TOKEN` secrets were added, remove them from repo secrets:

```bash
gh secret remove DORA_DASHBOARD_URL
gh secret remove DORA_DASHBOARD_TOKEN
```

## Step 10: Remove Processes

```bash
rm -rf .a5c/processes/dora-metrics
```

## Step 11: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name dora-metrics --project --json
```

## Notes

- Historical reports remain a valuable baseline — even without the plugin running, future manual queries can be compared against them
- If the project migrates to an external DORA tool (LinearB, Sleuth, Haystack), export reports first rather than deleting them
- PagerDuty / Opsgenie read tokens, if configured, should be revoked in the provider UI after uninstall
