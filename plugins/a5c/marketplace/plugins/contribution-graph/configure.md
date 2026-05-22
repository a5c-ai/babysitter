# contribution-graph — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `windowDays` | integer | `90` | `CONTRIB_WINDOW_DAYS` env |
| `cadence` | cron string | `0 7 1 * *` (monthly) | workflow schedule |
| `excludeBots` | regex | `(\[bot\]\|dependabot\|renovate\|github-actions)` | collect script |
| `topN` | integer | `20` | render script |
| `dashboardPath` | path | `docs/contributors.md` | render output |
| `includePrivateActivity` | `on`, `off` | `off` | requires PAT with `repo` scope |
| `welcomeTone` | `warm`, `neutral`, `custom` | `warm` | welcome workflow message |
| `welcomeOnIssue` | `on`, `off` | `on` | welcome workflow triggers |
| `welcomeOnPr` | `on`, `off` | `on` | welcome workflow triggers |
| `allContributors` | `on`, `off` | `off` | `.all-contributorsrc` + bot |
| `badgeInReadme` | `on`, `off` | `on` | shields.io badge |

## 2. Change the Window

```yaml
env:
  CONTRIB_WINDOW_DAYS: 30   # monthly view
# or
  CONTRIB_WINDOW_DAYS: 365  # annual summary
```

Or override per run:

```bash
CONTRIB_WINDOW_DAYS=7 node scripts/contribution-graph/collect.mjs
```

## 3. Customize the Welcome Message

Edit `.github/workflows/welcome.yml`:

```yaml
with:
  pr-message: |
    Hi @${{ github.event.pull_request.user.login }}, welcome!
    We appreciate first-time contributions. Our CI runs automatically; check back in ~10m for results.
    For substantial changes, please open an issue first so we can discuss approach.
```

Use GitHub Actions expressions sparingly — `first-interaction` renders the template once per user.

## 4. Change Excluded Bots

Edit `collect.mjs`:

```javascript
const excludeBots = /(\[bot\]|dependabot|renovate|github-actions|my-internal-bot)/i;
```

Or include bots in a separate section of the dashboard:

```javascript
const botActivity = commits.filter((c) => excludeBots.test(c.author?.login));
```

## 5. Include Private Repo Activity

The default `GITHUB_TOKEN` covers the current repo only. For an org-wide view, create a PAT with `repo` + `read:org` and store as a secret:

```bash
gh secret set ORG_METRICS_TOKEN
```

Update the workflow:

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.ORG_METRICS_TOKEN }}
```

## 6. Render as Static HTML

Swap the render step:

```javascript
// render-html.mjs (conceptual)
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const html = `<!doctype html><html><body><h1>Contributors</h1>...</body></html>`;
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/contributors.html', html);
```

Publish via GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`).

## 7. Add Streak / Recurring-contributor Metrics

Extend `collect.mjs`:

```javascript
// Contributors active in each of the last 3 windows = "recurring"
const months = [0, 1, 2].map((i) => {
  const from = new Date(Date.now() - (i + 1) * 30 * 86_400_000);
  const to = new Date(Date.now() - i * 30 * 86_400_000);
  return commits.filter((c) => {
    const d = new Date(c.commit.author.date);
    return d >= from && d < to;
  });
});
const recurring = new Set(
  months[0].map((c) => c.author?.login)
).intersection(
  new Set(months[1].map((c) => c.author?.login))
).intersection(
  new Set(months[2].map((c) => c.author?.login))
);
```

## 8. Thank First-time Contributors Post-merge

Add a second workflow `.github/workflows/thanks.yml`:

```yaml
on:
  pull_request_target:
    types: [closed]

jobs:
  thanks:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const author = context.payload.pull_request.user.login;
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner, repo: context.repo.repo,
              state: 'closed', creator: author, per_page: 100,
            });
            const merged = prs.filter((p) => p.merged_at);
            if (merged.length === 1) {
              await github.rest.issues.createComment({
                owner: context.repo.owner, repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                body: `🎉 Your first PR is merged — thank you @${author}!`,
              });
            }
```

## 9. Filter by CODEOWNERS Area

Group stats by file-owning team:

```javascript
// Pseudocode — read CODEOWNERS, map each PR's changed files to owning team
const ownership = parseCodeowners('.github/CODEOWNERS');
const perTeam = new Map();
for (const pr of mergedPrs) {
  const files = await octokit.pulls.listFiles({ ... });
  const teams = new Set(files.flatMap((f) => matchOwners(ownership, f.filename)));
  for (const t of teams) perTeam.set(t, (perTeam.get(t) ?? 0) + 1);
}
```

## 10. Disable Welcome for Specific Users

Add a filter step before `first-interaction`:

```yaml
- name: Skip welcome for org members
  uses: actions/github-script@v7
  id: skip
  with:
    script: |
      const { data } = await github.rest.orgs.checkMembershipForUser({
        org: context.repo.owner,
        username: context.payload.sender.login,
      }).catch(() => ({ data: null }));
      return data ? 'true' : 'false';
- uses: actions/first-interaction@v1
  if: steps.skip.outputs.result != 'true'
```

## 11. Thank All Contributors Periodically

Run a babysitter process quarterly that opens a "Thank you" issue tagging everyone who contributed:

```bash
babysitter run:create \
  --process-id contrib-quarterly-thanks \
  --entry .a5c/processes/contribution-graph/quarterly-thanks.js#process
```
