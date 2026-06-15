# contribution-graph — Install Instructions

Set up contributor analytics for your project — pull stats via the GitHub API, welcome first-time contributors automatically, and publish a lightweight activity dashboard (Markdown or static HTML) refreshed on a schedule. For humans to feel seen; for maintainers to see who to thank.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect repo visibility (public vs. private — API rate limits differ)
2. Check for existing contributor files: `CONTRIBUTORS.md`, `AUTHORS`, `CONTRIBUTING.md`
3. Detect bot activity patterns: `dependabot[bot]`, `renovate[bot]`, `github-actions[bot]`
4. Detect existing welcome automation: `.github/workflows/welcome.yml`, `actions/first-interaction`
5. Check for all-contributors: `.all-contributorsrc`
6. Detect CI minutes budget (GitHub Free vs. Team vs. Enterprise) to calibrate schedule cadence
7. Summarize findings to the user

### Stage 2: Feature Scope

Ask which pieces to install (multi-select):

1. **Contributor stats** — monthly/quarterly counts, top contributors, new vs. returning
2. **First-time contributor welcome** — auto-comment on first PR/issue
3. **Activity dashboard** — Markdown file or static site committed to repo
4. **All-contributors integration** — maintain `CONTRIBUTORS.md` + bot for emoji-tagged contributions
5. **All** — every feature

### Stage 3: Dashboard Format

Ask:

| Format | Pros | Cons |
|--------|------|------|
| Markdown in repo (`CONTRIBUTORS.md` or `docs/contributors.md`) | Zero infra, git-visible | Manual `git pull` to see latest |
| Static HTML via GitHub Pages | Nice visuals, shareable link | Extra workflow step |
| README badge + shields.io | One-liner, minimal | Limited detail |
| External (OSS Insights) | Rich graphs, no maintenance | External dependency |

Default: Markdown + a shields.io badge.

### Stage 4: Welcome Message Tone

Ask for tone preference:

- **Warm & enthusiastic** (default for open-source projects)
- **Professional & neutral** (default for enterprise internal)
- **Custom** — user-provided message

### Stage 5: Cadence

Ask:
- Stats refresh frequency: weekly, **monthly** (default), quarterly
- Include bots in stats? (default: **no** — filter `dependabot[bot]` etc.)
- Window for "active contributors": last 90 days (default)

## Step 2: Create the Stats Script

```bash
mkdir -p scripts/contribution-graph
```

Create `scripts/contribution-graph/collect.mjs`:

```javascript
#!/usr/bin/env node
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const windowDays = Number(process.env.CONTRIB_WINDOW_DAYS || 90);
const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
const excludeBots = /(\[bot\]|dependabot|renovate|github-actions)/i;

// Commits
const commits = await octokit.paginate(octokit.repos.listCommits, {
  owner, repo, since, per_page: 100,
});
const byAuthor = new Map();
for (const c of commits) {
  const login = c.author?.login ?? c.commit.author?.name ?? 'unknown';
  if (excludeBots.test(login)) continue;
  byAuthor.set(login, (byAuthor.get(login) ?? 0) + 1);
}

// PRs merged
const prs = await octokit.paginate(octokit.pulls.list, {
  owner, repo, state: 'closed', per_page: 100,
});
const mergedPrs = prs.filter(
  (p) => p.merged_at && new Date(p.merged_at) >= new Date(since)
);
const prsByAuthor = new Map();
for (const p of mergedPrs) {
  const login = p.user?.login ?? 'unknown';
  if (excludeBots.test(login)) continue;
  prsByAuthor.set(login, (prsByAuthor.get(login) ?? 0) + 1);
}

// First-time contributors in window
const firstTime = new Set();
const allPrs = await octokit.paginate(octokit.pulls.list, {
  owner, repo, state: 'all', per_page: 100,
});
const firstPrByUser = new Map();
for (const p of allPrs) {
  const login = p.user?.login ?? 'unknown';
  if (excludeBots.test(login)) continue;
  const existing = firstPrByUser.get(login);
  if (!existing || new Date(p.created_at) < new Date(existing)) {
    firstPrByUser.set(login, p.created_at);
  }
}
for (const [login, firstAt] of firstPrByUser) {
  if (new Date(firstAt) >= new Date(since)) firstTime.add(login);
}

const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

console.log(JSON.stringify({
  window: { days: windowDays, since },
  totals: {
    commits: commits.length,
    mergedPrs: mergedPrs.length,
    activeAuthors: byAuthor.size,
    firstTimeContributors: firstTime.size,
  },
  topByCommits: top(byAuthor),
  topByMergedPrs: top(prsByAuthor),
  firstTimeContributors: [...firstTime],
}, null, 2));
```

Install deps:

```bash
npm install -D @octokit/rest
```

## Step 3: Create the Dashboard Renderer

Create `scripts/contribution-graph/render.mjs`:

```javascript
#!/usr/bin/env node
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const lines = [];
lines.push(`# Contributors`);
lines.push('');
lines.push(`Last ${data.window.days} days (since ${data.window.since.slice(0, 10)}).`);
lines.push('');
lines.push('## Activity');
lines.push('| Metric | Count |');
lines.push('|--------|-------|');
lines.push(`| Commits | ${data.totals.commits} |`);
lines.push(`| Merged PRs | ${data.totals.mergedPrs} |`);
lines.push(`| Active authors | ${data.totals.activeAuthors} |`);
lines.push(`| First-time contributors | ${data.totals.firstTimeContributors} |`);
lines.push('');
lines.push('## Top 20 by commits');
lines.push('| Contributor | Commits |');
lines.push('|-------------|---------|');
for (const [login, n] of data.topByCommits) {
  lines.push(`| [@${login}](https://github.com/${login}) | ${n} |`);
}
lines.push('');
lines.push('## First-time contributors this window');
lines.push(data.firstTimeContributors.map((l) => `[@${l}](https://github.com/${l})`).join(', ') || '_none_');
fs.writeFileSync('docs/contributors.md', lines.join('\n') + '\n');
```

## Step 4: Create the Refresh Workflow

Create `.github/workflows/contribution-graph.yml`:

```yaml
name: Contribution graph

on:
  schedule:
    - cron: '0 7 1 * *'  # monthly
  workflow_dispatch:

permissions:
  contents: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - name: Collect stats
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CONTRIB_WINDOW_DAYS: 90
        run: node scripts/contribution-graph/collect.mjs > contrib.json
      - name: Render dashboard
        run: node scripts/contribution-graph/render.mjs contrib.json
      - name: Commit updated dashboard
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          if ! git diff --quiet docs/contributors.md; then
            git add docs/contributors.md
            git commit -m "chore: refresh contributor stats [skip ci]"
            git push
          fi
```

## Step 5: Welcome Workflow

Create `.github/workflows/welcome.yml`:

```yaml
name: Welcome first-time contributors

on:
  pull_request_target:
    types: [opened]
  issues:
    types: [opened]

permissions:
  pull-requests: write
  issues: write

jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/first-interaction@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          issue-message: |
            Thanks for opening your first issue here! A maintainer will take a look soon. In the meantime, please ensure you have filled out the template completely — it helps us help you faster.
          pr-message: |
            Welcome, and thanks for your first contribution! A maintainer will review this soon.

            A few things that help your PR get merged quickly:
            - All tests pass in CI
            - Commits follow the project's commit-message style (see `CONTRIBUTING.md`)
            - If the change is user-facing, add an entry to `CHANGELOG.md`

            If you get stuck, don't hesitate to ask questions in the PR thread.
```

## Step 6: all-contributors Integration (Optional)

```bash
npm install -D all-contributors-cli
npx all-contributors init
```

Answer the prompts (project name, repo, image size). This creates `.all-contributorsrc` and adds a contributors section to the README.

Add the all-contributors bot to the repo (https://allcontributors.org/docs/en/bot/overview) so `@all-contributors` comments add entries automatically.

## Step 7: README Badge

Add to `README.md`:

```markdown
![Contributors](https://img.shields.io/github/contributors/<owner>/<repo>)
![Activity](https://img.shields.io/github/commit-activity/m/<owner>/<repo>)
```

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name contribution-graph --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. `node scripts/contribution-graph/collect.mjs` produces valid JSON
2. `docs/contributors.md` renders with top-20 table and first-time list
3. Monthly workflow runs and commits updates when stats change
4. Welcome workflow posts on a test issue opened by a non-maintainer account
5. README badge renders
6. all-contributors (if enabled) accepts `@all-contributors please add @user for code` comments

## Reference

- Octokit REST.js: https://github.com/octokit/rest.js
- all-contributors spec: https://allcontributors.org/
- first-interaction action: https://github.com/actions/first-interaction
- shields.io: https://shields.io/
- OSS Insights: https://ossinsight.io/
