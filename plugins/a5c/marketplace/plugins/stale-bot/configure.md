# stale-bot — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `issueStaleDays` | integer | `60` | `days-before-issue-stale` |
| `issueCloseDays` | integer | `14` | `days-before-issue-close` |
| `prStaleDays` | integer | `30` | `days-before-pr-stale` |
| `prCloseDays` | integer | `7` | `days-before-pr-close` |
| `staleLabel` | string | `stale` | `stale-issue-label`/`stale-pr-label` |
| `exemptIssueLabels` | csv | `keep-open,pinned,good first issue,help wanted,security,epic` | `exempt-issue-labels` |
| `exemptPrLabels` | csv | `keep-open,pinned,security,wip` | `exempt-pr-labels` |
| `exemptMilestones` | `on`, `off` | `on` | `exempt-all-milestones` |
| `exemptAssignees` | `on`, `off` | `off` | `exempt-all-issue-assignees` |
| `removeStaleWhenUpdated` | `on`, `off` | `on` | `remove-issue-stale-when-updated` |
| `operationsPerRun` | integer | `200` | `operations-per-run` |
| `schedule` | cron | `0 1 * * *` | workflow `schedule.cron` |
| `ascending` | `on`, `off` | `on` | `ascending` |

## 2. Adjust Inactivity Windows

Edit `.github/workflows/stale.yml`:

```yaml
days-before-issue-stale: 90
days-before-issue-close: 21
days-before-pr-stale: 21
days-before-pr-close: 5
```

## 3. Exempt Additional Labels

```yaml
exempt-issue-labels: 'keep-open,pinned,security,epic,needs-design,blocked'
```

## 4. Per-Kind Custom Messaging

```yaml
stale-issue-message: |
  Hi! This issue hasn't had activity in 60 days. If it's still relevant, a quick comment keeps it alive.
close-issue-message: |
  Closing for now. If you'd like to revive this, comment with fresh context and a maintainer will reopen.
```

## 5. Pause the Bot Temporarily

Trigger via `workflow_dispatch` with no cron until backlog is cleared:

```yaml
on:
  # schedule:
  #   - cron: '0 1 * * *'
  workflow_dispatch:
```

## 6. Increase Throughput for Large Backlogs

```yaml
operations-per-run: 500
ascending: true   # Process oldest first
```

Split across two runs per day:

```yaml
schedule:
  - cron: '0 1 * * *'
  - cron: '0 13 * * *'
```

## 7. Different Windows per Repo Area (via Labels)

actions/stale supports a single config, so use labels creatively:

```yaml
exempt-issue-labels: 'area:library,keep-open,pinned'
```

Add `area:library` to items in long-lived areas so they age slowly manually.

## 8. Close Immediately Without Warning (Not Recommended)

```yaml
days-before-issue-stale: 0
days-before-issue-close: 30
```

Use sparingly; most communities prefer a warning window.

## 9. Post Stale Stats to a Channel

Append a step after `actions/stale`:

```yaml
- name: Post stats
  run: |
    STALE_COUNT=$(gh issue list --label stale --state open --json number | jq length)
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"Open stale issues: $STALE_COUNT\"}" \
      "$SLACK_WEBHOOK"
  env: { SLACK_WEBHOOK: '${{ secrets.SLACK_WEBHOOK }}' }
```

## 10. Audit Recently Auto-Closed Items

```bash
gh search issues --state closed --match body "automatically closed" --limit 50 --json number,title,closedAt
```

Run the babysitter process to review:

```bash
babysitter run:create \
  --process-id stale-bot-audit \
  --entry .a5c/processes/stale-bot/audit.js#process \
  --prompt "Review items auto-closed in the last 7 days, flag any that look like legitimate bug reports" \
  --json
```

## 11. Allow Assignees to Block Auto-Close

```yaml
exempt-all-issue-assignees: true
exempt-all-pr-assignees: true
```

Useful for small teams where assignment signals active work.
