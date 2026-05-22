# dora-metrics — Install Instructions

Set up DORA four-keys tracking for your project — deployment frequency, lead time for changes, change failure rate, and mean time to recovery — sourced from the GitHub API with a monthly report issue filed automatically. Dashboards optional; the data is the point.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect git host: GitHub, GitLab, Bitbucket (this plugin targets **GitHub** primarily)
2. Detect deploy signal source:
   - GitHub Environments + deployment API events
   - Workflow runs with name pattern `deploy*` / `release*`
   - Release creation events (`v*` tags)
   - External: Argo CD, Flux, Spinnaker webhooks
3. Detect incident signal source:
   - Issue labels (`incident`, `sev-1`, `sev-2`, `outage`)
   - PagerDuty / Opsgenie / incident.io API
   - Revert PR patterns (`git log --grep='Revert'`)
4. Check for existing DORA tooling: `four-keys/`, `dora.yaml`, `.github/workflows/dora*`
5. Check default branch name: `main` vs. `master` vs. `trunk`
6. Summarize findings to the user

### Stage 2: Metrics Scope

Ask which of the four keys to track (default: all four):

1. **Deployment frequency** — how often production deploys happen
2. **Lead time for changes** — time from commit → production deploy
3. **Change failure rate** — % of deploys that cause incidents / rollbacks
4. **Mean time to recovery (MTTR)** — time from incident open → resolved

### Stage 3: Deploy Signal

Ask how "a deploy" is defined in this project:

| Signal | Best for |
|--------|----------|
| GitHub Environment = `production` + `success` | Projects using GitHub Environments |
| Workflow run named `deploy-prod` with `conclusion: success` | Projects with named deploy workflows |
| Release published on default branch | Projects with formal release cadence |
| Tag matching `v*.*.*` on default branch | Semver-tagged projects |
| External webhook (Argo / Flux) | GitOps projects |

### Stage 4: Incident Signal

Ask how "a failure" is defined:

- Issue opened with label `incident` or `sev-1` / `sev-2`
- PagerDuty incident API (read-only token)
- Revert commits merged to default branch
- Rollback deploys (deploy with `rollback=true` annotation)

### Stage 5: Report Cadence

Ask:
- Report frequency: weekly, biweekly, **monthly** (default), quarterly
- Report destination: GitHub issue (default), Slack channel, both
- Include per-team breakdown? (default: no, single project-wide report)
- Comparison window: prior period (default), trailing 12 months, none

## Step 2: Create DORA Query Script

```bash
mkdir -p .a5c/dora scripts/dora
```

Create `scripts/dora/query.mjs`:

```javascript
#!/usr/bin/env node
// Compute DORA four keys over a window via GitHub API
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const windowDays = Number(process.env.DORA_WINDOW_DAYS || 30);
const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

// 1. Deployment frequency
const deploys = await octokit.paginate(octokit.repos.listDeployments, {
  owner, repo, environment: 'production', per_page: 100,
});
const successfulDeploys = [];
for (const d of deploys) {
  if (new Date(d.created_at) < new Date(since)) break;
  const statuses = await octokit.repos.listDeploymentStatuses({
    owner, repo, deployment_id: d.id,
  });
  const final = statuses.data.find((s) => ['success', 'failure', 'error'].includes(s.state));
  if (final?.state === 'success') successfulDeploys.push({ ...d, finishedAt: final.created_at });
}
const deployFrequencyPerWeek = (successfulDeploys.length / windowDays) * 7;

// 2. Lead time: commit authored_at → deploy finishedAt
const leadTimesMs = [];
for (const d of successfulDeploys) {
  const { data: commit } = await octokit.repos.getCommit({ owner, repo, ref: d.sha });
  leadTimesMs.push(new Date(d.finishedAt) - new Date(commit.commit.author.date));
}
const medianLeadTimeHours = percentile(leadTimesMs, 50) / 3_600_000;

// 3. Change failure rate
const incidents = await octokit.paginate(octokit.issues.listForRepo, {
  owner, repo, state: 'all', labels: 'incident', since, per_page: 100,
});
const changeFailureRate = successfulDeploys.length
  ? incidents.length / successfulDeploys.length
  : 0;

// 4. MTTR
const mttrMs = incidents
  .filter((i) => i.closed_at)
  .map((i) => new Date(i.closed_at) - new Date(i.created_at));
const medianMttrHours = percentile(mttrMs, 50) / 3_600_000;

console.log(JSON.stringify({
  window: { days: windowDays, since },
  deployFrequencyPerWeek,
  medianLeadTimeHours,
  changeFailureRate,
  medianMttrHours,
  raw: { deploys: successfulDeploys.length, incidents: incidents.length },
}, null, 2));

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * (p / 100));
  return sorted[idx];
}
```

## Step 3: Install Dependencies

```bash
npm install -D @octokit/rest
```

Or if the project is Python-first, add `scripts/dora/query.py` using `PyGithub` instead.

## Step 4: DORA Performance Bands

Create `docs/dora/bands.md` for reference when reading reports:

```markdown
# DORA performance bands (Accelerate, 2023)

| Metric | Elite | High | Medium | Low |
|--------|-------|------|--------|-----|
| Deployment frequency | Multiple / day | Weekly–monthly | Monthly–6mo | Less than 6mo |
| Lead time for changes | < 1 hour | 1 day–1 week | 1 week–1 month | > 1 month |
| Change failure rate | 0–5% | 10% | 10–15% | 15–64% |
| MTTR | < 1 hour | < 1 day | 1 day–1 week | > 1 week |
```

## Step 5: Create the Monthly Report Workflow

Create `.github/workflows/dora-report.yml`:

```yaml
name: DORA monthly report

on:
  schedule:
    - cron: '0 9 1 * *'  # 1st of month, 09:00 UTC
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - name: Compute DORA metrics
        id: dora
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          DORA_WINDOW_DAYS: 30
        run: |
          node scripts/dora/query.mjs > dora.json
          cat dora.json
      - name: Compute prior-period delta
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          DORA_WINDOW_DAYS: 60
        run: node scripts/dora/query.mjs > dora-prev.json
      - name: Open monthly report issue
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const cur = JSON.parse(fs.readFileSync('dora.json'));
            const prev = JSON.parse(fs.readFileSync('dora-prev.json'));
            const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const body = [
              `# DORA metrics — ${month}`,
              '',
              '| Metric | This period | Prior period |',
              '|--------|-------------|--------------|',
              `| Deploy frequency (per week) | ${cur.deployFrequencyPerWeek.toFixed(2)} | ${prev.deployFrequencyPerWeek.toFixed(2)} |`,
              `| Lead time (hours, p50) | ${cur.medianLeadTimeHours.toFixed(1)} | ${prev.medianLeadTimeHours.toFixed(1)} |`,
              `| Change failure rate | ${(cur.changeFailureRate * 100).toFixed(1)}% | ${(prev.changeFailureRate * 100).toFixed(1)}% |`,
              `| MTTR (hours, p50) | ${cur.medianMttrHours.toFixed(1)} | ${prev.medianMttrHours.toFixed(1)} |`,
              '',
              'See [docs/dora/bands.md](../blob/main/docs/dora/bands.md) for performance bands.',
            ].join('\n');
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `DORA metrics — ${month}`,
              body,
              labels: ['dora', 'metrics'],
            });
```

## Step 6: Ad-hoc Query Script

Add a convenience script to `package.json`:

```json
{
  "scripts": {
    "dora": "node scripts/dora/query.mjs"
  }
}
```

Usage:

```bash
GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo DORA_WINDOW_DAYS=30 npm run dora
```

## Step 7: Optional — Push to a Dashboard

If the project has a Grafana / Datadog / internal dashboard, extend `query.mjs` to also POST results:

```javascript
await fetch(process.env.DORA_DASHBOARD_URL, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.DORA_DASHBOARD_TOKEN}` },
  body: JSON.stringify({ metric: 'dora', ...result }),
});
```

## Step 8: Incident Label Seeding

If no `incident` label exists:

```bash
gh label create incident --description "Production incident (any severity)" --color B60205
gh label create sev-1 --color B60205
gh label create sev-2 --color D93F0B
gh label create sev-3 --color FBCA04
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name dora-metrics --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `npm run dora` produces a valid JSON object with all four metrics
2. Workflow runs on schedule and opens an issue titled `DORA metrics — <Month YYYY>`
3. Report includes delta vs. prior period
4. `docs/dora/bands.md` exists for interpretation
5. `incident` label exists on the repo
6. Baseline report committed and reviewed with the user

## Reference

- Accelerate (Forsgren et al., 2018): https://itrevolution.com/product/accelerate/
- DORA 2023 report: https://cloud.google.com/devops/state-of-devops
- Google's Four Keys project: https://github.com/dora-team/fourkeys
- GitHub Deployments API: https://docs.github.com/en/rest/deployments/deployments
