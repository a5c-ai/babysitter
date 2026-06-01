# stale-bot — Install Instructions

Auto-triage stale issues and pull requests using `actions/stale`. Applies a warning label after inactivity, closes after a grace period, and respects per-kind rules (issues vs PRs) with escape-hatch labels that prevent auto-closure.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Count open issues and PRs (`gh issue list --state open --json number | jq length`, same for PRs)
2. Check for existing `.github/workflows/*stale*` config
3. Check for existing triage labels: `stale`, `wontfix`, `keep-open`, `pinned`, `good first issue`
4. Inspect recent issue/PR activity to estimate inactivity distribution
5. Summarize findings to the user

### Stage 2: Inactivity Windows

Ask (issues vs PRs — different defaults):

| Target | days-before-stale | days-before-close |
|--------|-------------------|-------------------|
| Issues | `60` (default) | `14` |
| PRs | `30` (default) | `7` |

Adjust for project pace: active projects can be more aggressive; long-lived OSS projects often stretch to 180/30.

### Stage 3: Exempt Labels

Ask which labels should exempt items from the bot:

- `keep-open` (default)
- `pinned` (default)
- `good first issue` (default — don't scare off newcomers)
- `help wanted`
- `security`
- `epic`
- `in-progress`

### Stage 4: Exempt Authors / Milestones

Ask:
- Exempt items assigned to a milestone? (default: yes)
- Exempt items with assignees? (default: no — assigned-but-idle work should still age)
- Exempt items from maintainers? (default: no — consistency matters)

### Stage 5: Messaging Tone

Ask:
- Friendly tone (default) / Terse
- Include contribution CTA on stale PR? (default: yes)
- Suggest re-opening with new context? (default: yes on close)

## Step 2: Create Stale Workflow

Create `.github/workflows/stale.yml`:

```yaml
name: Stale
on:
  schedule:
    - cron: '0 1 * * *'   # Daily 01:00 UTC
  workflow_dispatch:

permissions:
  issues: write
  pull-requests: write

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          # Issues
          days-before-issue-stale: 60
          days-before-issue-close: 14
          stale-issue-label: stale
          stale-issue-message: |
            This issue has been automatically marked as stale because it has not had
            recent activity. It will be closed in 14 days if no further activity occurs.
            If this is still relevant, please comment below or remove the `stale` label.
          close-issue-message: |
            This issue was automatically closed because it remained stale.
            You can re-open it if you have new information.
          # PRs
          days-before-pr-stale: 30
          days-before-pr-close: 7
          stale-pr-label: stale
          stale-pr-message: |
            This pull request has been automatically marked as stale because it has not had
            recent activity. It will be closed in 7 days if no further activity occurs.
            Rebase on main, push an update, or drop a comment to keep it alive.
          close-pr-message: |
            Closing this PR due to inactivity. Feel free to reopen with updates.
          # Exemptions
          exempt-issue-labels: 'keep-open,pinned,good first issue,help wanted,security,epic'
          exempt-pr-labels: 'keep-open,pinned,security,wip'
          exempt-all-milestones: true
          exempt-all-issue-assignees: false
          exempt-all-pr-assignees: false
          # Behavior
          remove-issue-stale-when-updated: true
          remove-pr-stale-when-updated: true
          operations-per-run: 200
          ascending: true   # Oldest first, so high-backlog repos make steady progress
```

## Step 3: Seed Required Labels

```bash
gh label create "stale" --color "ededed" --description "No recent activity" --force
gh label create "keep-open" --color "0e8a16" --description "Exempt from stale bot" --force
gh label create "pinned" --color "1d76db" --description "Pinned issue — never close" --force
gh label create "security" --color "ee0701" --description "Security-sensitive; do not auto-close" --force
gh label create "wip" --color "fbca04" --description "Work in progress; PR not ready" --force
```

Or script it in `scripts/seed-stale-labels.sh`.

## Step 4: Configure Grace Periods (Optional Variants)

Different cadences for different repos:

### Active product repo

```yaml
days-before-issue-stale: 30
days-before-issue-close: 7
days-before-pr-stale: 14
days-before-pr-close: 5
```

### Long-tail OSS library

```yaml
days-before-issue-stale: 180
days-before-issue-close: 30
days-before-pr-stale: 60
days-before-pr-close: 14
```

### Docs-only repo

```yaml
days-before-issue-stale: 90
days-before-issue-close: 30
```

## Step 5: Pin Protected Issues

Before first run, pin issues that must not be closed:

```bash
gh issue list --state open --json number,title --jq '.[] | select(.title | test("Tracking|RFC|Proposal"; "i")) | .number' \
  | xargs -n1 -I{} gh issue edit {} --add-label "pinned"
```

## Step 6: Initial Dry Run

```yaml
# Temporarily add to the workflow for first run
operations-per-run: 30
debug-only: true
```

Run via `workflow_dispatch`, inspect what **would** have been actioned, then remove `debug-only`.

## Step 7: Announce to Contributors

Add a section to `CONTRIBUTING.md`:

```markdown
## Stale Issues and PRs

- Issues with no activity for 60 days get a `stale` label
- After 14 more days with no response, they are auto-closed
- PRs have shorter windows (30/7)
- Add `keep-open`, `pinned`, or `security` to exempt an item
- Closed-as-stale items can always be reopened with new context
```

## Step 8: Monitor First Month

```bash
gh search issues --state closed --match body "automatically closed because it remained stale" \
  --json number,title,closedAt
```

Watch for misfires (e.g. valid reports closed too aggressively). Adjust windows and exemption labels.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name stale-bot --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. Workflow runs daily (check Actions → Stale)
2. Test issue labeled `stale` after crossing the inactivity threshold
3. Removing the stale label (or commenting) removes it on next run
4. Exempt labels prevent labeling
5. Closed items include the close message
6. Contributors can find the policy in CONTRIBUTING.md

## Reference

- actions/stale: https://github.com/actions/stale
- Managing issue lifecycle: https://docs.github.com/en/issues/tracking-your-work-with-issues/marking-issues-or-pull-requests-as-a-duplicate
- Best practices for OSS maintenance: https://opensource.guide/best-practices/
