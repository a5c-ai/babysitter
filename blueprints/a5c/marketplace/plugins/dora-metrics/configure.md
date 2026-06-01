# dora-metrics — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `windowDays` | integer | `30` | `DORA_WINDOW_DAYS` env var in workflow |
| `deploySignal` | `environment`, `workflow`, `release`, `tag`, `webhook` | `environment` | `query.mjs` deploy detection |
| `productionEnvironment` | environment name | `production` | GitHub API `environment` filter |
| `deployWorkflowName` | workflow filename | `deploy-prod.yml` | workflow-signal only |
| `incidentLabel` | label string | `incident` | GitHub issue search |
| `incidentSource` | `github`, `pagerduty`, `opsgenie`, `incident.io` | `github` | which API to query |
| `reportCadence` | cron string | `0 9 1 * *` | workflow schedule |
| `reportDestination` | `issue`, `slack`, `both` | `issue` | post-step |
| `teamBreakdown` | `on`, `off` | `off` | group by CODEOWNERS |
| `priorPeriodDelta` | `on`, `off` | `on` | compute + compare prior window |
| `dashboardUrl` | URL | (unset) | optional POST target |

## 2. Change the Reporting Window

Edit `.github/workflows/dora-report.yml`:

```yaml
env:
  DORA_WINDOW_DAYS: 90  # quarterly
```

Or run ad-hoc:

```bash
DORA_WINDOW_DAYS=7 npm run dora  # last week
```

## 3. Change the Deploy Signal

### Workflow-name-based

Edit `scripts/dora/query.mjs` — replace the deployments loop with:

```javascript
const runs = await octokit.paginate(octokit.actions.listWorkflowRunsForRepo, {
  owner, repo, status: 'success', per_page: 100,
});
const successfulDeploys = runs.filter(
  (r) => r.name === 'deploy-prod' && new Date(r.created_at) >= new Date(since)
).map((r) => ({ sha: r.head_sha, finishedAt: r.updated_at }));
```

### Release-based

```javascript
const releases = await octokit.paginate(octokit.repos.listReleases, {
  owner, repo, per_page: 100,
});
const successfulDeploys = releases
  .filter((r) => !r.draft && new Date(r.published_at) >= new Date(since))
  .map((r) => ({ sha: r.target_commitish, finishedAt: r.published_at }));
```

## 4. Switch Incident Source to PagerDuty

```javascript
const res = await fetch(
  `https://api.pagerduty.com/incidents?since=${since}&statuses[]=resolved&service_ids[]=${SERVICE_ID}`,
  { headers: { Authorization: `Token token=${process.env.PAGERDUTY_TOKEN}` } }
);
const { incidents } = await res.json();
```

Add the secret:

```bash
gh secret set PAGERDUTY_TOKEN
```

## 5. Per-Team Breakdown via CODEOWNERS

Parse `.github/CODEOWNERS` and for each deploy's SHA, map changed files → owning team. Requires a second pass over `compareCommits`. Enable with:

```yaml
env:
  DORA_TEAM_BREAKDOWN: "true"
```

Output adds a `perTeam` object; the report renders a table per team.

## 6. Post to Slack

Add a step:

```yaml
- name: Post to Slack
  uses: slackapi/slack-github-action@v2
  with:
    webhook: ${{ secrets.SLACK_DORA_WEBHOOK }}
    webhook-type: incoming-webhook
    payload: |
      {
        "text": "DORA ${{ github.run_id }}",
        "blocks": [ ... ]
      }
```

## 7. Change Performance Band Thresholds

Edit `docs/dora/bands.md` if your organization uses custom thresholds (e.g. regulated industries). Also update the report template to color-code against local thresholds rather than Accelerate defaults.

## 8. Include Revert Commits as Failures

Add to `query.mjs`:

```javascript
const reverts = await octokit.search.commits({
  q: `repo:${owner}/${repo} message:"Revert" committer-date:>=${since}`,
});
const totalFailures = incidents.length + reverts.data.total_count;
```

## 9. Exclude Bot-Authored Deploys

```javascript
const humanDeploys = successfulDeploys.filter(
  (d) => !/dependabot|renovate|\[bot\]/i.test(d.creator?.login ?? '')
);
```

## 10. Change Percentile

The script defaults to p50 for lead time and MTTR. To use p85 (closer to SRE SLO practice):

```javascript
const medianLeadTimeHours = percentile(leadTimesMs, 85) / 3_600_000;
```

## 11. Backfill Historical Data

Run the script across prior windows and collect into a CSV:

```bash
for m in $(seq 1 12); do
  DORA_WINDOW_DAYS=30 DORA_OFFSET_DAYS=$((m * 30)) node scripts/dora/query.mjs >> history.ndjson
done
```

(Script must be extended with `DORA_OFFSET_DAYS` support — shifts the `since` anchor.)
