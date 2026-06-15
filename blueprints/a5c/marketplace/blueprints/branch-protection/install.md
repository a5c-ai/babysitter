# branch-protection — Install Instructions

Define branch protection rules as code, apply them via the GitHub API, and enforce a required-checks matrix per branch. Protects `main`, release branches, and any configured production/staging branches from direct pushes, unreviewed merges, or missing required checks.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect default branch (`gh repo view --json defaultBranchRef`)
2. Check current protection via `gh api repos/:owner/:repo/branches/:branch/protection`
3. Check which workflows exist in `.github/workflows/` (potential required checks)
4. Detect if CODEOWNERS exists (`codeowners` plugin companion)
5. Check if repo is public/private (impacts features available)
6. Summarize findings to the user

### Stage 2: Branches to Protect

Ask:
- Primary branch: `main` (default) / `master` / other
- Also protect: `staging`, `next`, `release/*`, `1.x`, etc.
- Include wildcard patterns? (default: yes — `release/*`)

### Stage 3: Required Checks

Ask (multi-select, per branch):
- Required status checks: CI jobs that must pass (auto-listed from existing workflows)
- Strict mode: require branches to be up-to-date before merge (default: yes)
- Required Code Owner reviews (requires CODEOWNERS plugin/file)? (default: yes if present)
- Minimum approving reviews: `1` (default) / `2` for sensitive branches
- Dismiss stale reviews on new push? (default: yes)
- Require review from someone other than last pusher? (default: yes)

### Stage 4: Merge Settings

Ask:
- Require signed commits? (default: no — switch to yes for regulated projects)
- Require linear history? (default: yes)
- Require conversation resolution before merge? (default: yes)
- Allow force push? (default: no)
- Allow deletions? (default: no)
- Restrict who can push? (default: no — rely on PR workflow instead)

### Stage 5: Bypass

Ask:
- Admins bypass protections? (default: no — "everyone follows the rules")
- Apps allowed to bypass (e.g. release-please-bot, dependabot)? (default: yes for dependabot)

## Step 2: Define Protection Rules as Code

Create `.github/branch-protection.yaml`:

```yaml
version: 1
branches:
  - name: main
    required_status_checks:
      strict: true
      checks:
        - context: build
        - context: test
        - context: lint
        - context: type-check
        - context: a11y-lint
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
      require_last_push_approval: true
    required_linear_history: true
    required_conversation_resolution: true
    required_signatures: false
    allow_force_pushes: false
    allow_deletions: false
    lock_branch: false
    bypass_pull_request_allowances:
      users: []
      teams: []
      apps: [dependabot]

  - name: staging
    required_status_checks:
      strict: true
      checks: [{ context: build }, { context: test }, { context: lint }]
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
    required_linear_history: true
    allow_force_pushes: false
    allow_deletions: false

  - name: 'release/*'
    required_status_checks:
      strict: true
      checks: [{ context: build }, { context: test }]
    required_pull_request_reviews:
      required_approving_review_count: 2
      require_code_owner_reviews: true
    allow_force_pushes: false
    allow_deletions: false
```

## Step 3: Install Apply Script

Create `scripts/apply-branch-protection.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { Octokit } from '@octokit/rest';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN required');
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
if (!owner || !repo) throw new Error('GITHUB_REPOSITORY required (owner/repo)');

const cfg = parse(readFileSync('.github/branch-protection.yaml', 'utf8'));
const octokit = new Octokit({ auth: token });

for (const b of cfg.branches) {
  const body = {
    owner, repo, branch: b.name,
    required_status_checks: b.required_status_checks ?? null,
    enforce_admins: b.enforce_admins ?? true,
    required_pull_request_reviews: b.required_pull_request_reviews ?? null,
    restrictions: null,
    required_linear_history: b.required_linear_history ?? false,
    allow_force_pushes: b.allow_force_pushes ?? false,
    allow_deletions: b.allow_deletions ?? false,
    required_conversation_resolution: b.required_conversation_resolution ?? false,
    lock_branch: b.lock_branch ?? false,
    required_signatures: b.required_signatures ?? false,
  };
  try {
    await octokit.repos.updateBranchProtection(body);
    console.log(`OK: ${b.name}`);
  } catch (err) {
    console.error(`FAIL: ${b.name} -> ${err.message}`);
    process.exitCode = 1;
  }
}
```

```bash
npm install -D @octokit/rest yaml
```

Add to `package.json`:

```json
{
  "scripts": {
    "branch-protection:apply": "node scripts/apply-branch-protection.mjs",
    "branch-protection:diff": "node scripts/diff-branch-protection.mjs"
  }
}
```

## Step 4: Create Diff Script (Detect Drift)

Create `scripts/diff-branch-protection.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { Octokit } from '@octokit/rest';

const cfg = parse(readFileSync('.github/branch-protection.yaml', 'utf8'));
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

let drift = 0;
for (const b of cfg.branches) {
  try {
    const remote = (await octokit.repos.getBranchProtection({ owner, repo, branch: b.name })).data;
    // Shallow compare key fields — extend as needed
    const localReviews = b.required_pull_request_reviews?.required_approving_review_count;
    const remoteReviews = remote.required_pull_request_reviews?.required_approving_review_count;
    if (localReviews !== remoteReviews) {
      console.log(`drift: ${b.name} reviews ${remoteReviews} -> ${localReviews}`);
      drift++;
    }
  } catch (err) {
    if (err.status === 404) {
      console.log(`missing protection: ${b.name}`);
      drift++;
    } else throw err;
  }
}
process.exit(drift ? 1 : 0);
```

## Step 5: Create GitHub Actions Workflow

Create `.github/workflows/branch-protection.yml`:

```yaml
name: Branch Protection
on:
  push:
    branches: [main]
    paths: ['.github/branch-protection.yaml', 'scripts/*branch-protection*']
  workflow_dispatch:
  schedule:
    - cron: '0 7 * * 1'  # Monday 07:00 UTC — drift check
permissions:
  contents: read
jobs:
  apply:
    if: github.event_name != 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - name: Apply protection rules
        env:
          GITHUB_TOKEN: ${{ secrets.BRANCH_PROTECTION_TOKEN }}
        run: npm run branch-protection:apply

  drift:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - name: Detect drift
        env:
          GITHUB_TOKEN: ${{ secrets.BRANCH_PROTECTION_TOKEN }}
        run: npm run branch-protection:diff
```

**Important**: `BRANCH_PROTECTION_TOKEN` must be a PAT or GitHub App token with `admin:repo` scope. The default `GITHUB_TOKEN` **cannot** modify branch protection.

## Step 6: Document Required-Checks Matrix

Create `.github/BRANCH_PROTECTION.md`:

```markdown
# Branch Protection Matrix

| Branch | Checks | Reviews | CODEOWNERS | Signed | Linear | Force push |
|--------|--------|---------|------------|--------|--------|------------|
| `main` | build, test, lint, type-check, a11y-lint | 1 | yes | no | yes | no |
| `staging` | build, test, lint | 1 | no | no | yes | no |
| `release/*` | build, test | 2 | yes | no | no | no |
```

## Step 7: Seed and Apply

```bash
# Local dry run (requires GITHUB_TOKEN in env)
GITHUB_REPOSITORY=<org>/<repo> GITHUB_TOKEN=<pat> npm run branch-protection:diff

# First apply (via CI workflow, or locally with admin token)
GITHUB_REPOSITORY=<org>/<repo> GITHUB_TOKEN=<pat> npm run branch-protection:apply
```

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name branch-protection --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. `gh api repos/:owner/:repo/branches/main/protection` matches the yaml
2. Attempting to push directly to `main` is rejected
3. Opening a PR without the required checks blocks merge
4. CODEOWNERS review is requested (if enabled)
5. Drift workflow detects manual changes to protection via GitHub UI
6. Apply workflow runs on edits to `.github/branch-protection.yaml`

## Reference

- GitHub API — Update branch protection: https://docs.github.com/en/rest/branches/branch-protection#update-branch-protection
- Required PR reviews: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule
- GitHub rulesets (alternative, newer API): https://docs.github.com/en/rest/repos/rules
