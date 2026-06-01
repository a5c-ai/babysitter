# scorecard — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `schedule` | cron expression | `19 4 * * 1` | `scorecard.yml` `on.schedule` |
| `onPush` | `on`, `off` | `on` | `on.push.branches` |
| `onPR` | `on`, `off` | `off` | `on.pull_request` |
| `publishResults` | `on`, `off` | `on` for public | `ossf/scorecard-action` `publish_results` |
| `uploadSarif` | `on`, `off` | `on` | `codeql-action/upload-sarif` step |
| `remediationThreshold` | `0`–`10` | `5` | `THRESHOLD` env in remediation workflow |
| `issueLabels` | csv of label names | `security,scorecard` | remediation workflow |
| `badgeInReadme` | `on`, `off` | `on` for public | `README.md` |
| `disabledChecks` | list of check ids | `[]` | `.github/scorecard.yml` |

## 2. Change the Schedule

```yaml
on:
  schedule:
    - cron: '0 6 * * 0'   # Sundays 06:00 UTC
```

Avoid the top of the hour — Scorecard's rate limits prefer distributed schedules.

## 3. Adjust Remediation Threshold

```yaml
env:
  THRESHOLD: '7'   # only open issues for checks scoring below 7
```

Raising the threshold produces more issues; lowering it produces fewer. `5` is the OpenSSF-recommended minimum for "actionable".

## 4. Disable Specific Checks

Create or edit `.github/scorecard.yml`:

```yaml
annotations:
  - checks:
      - Binary-Artifacts
      - Fuzzing
    reasons:
      - reason: not-applicable
        comment: No binary artifacts shipped; fuzzing not feasible for this domain.
```

Valid `reason` values: `test-data`, `remediated`, `not-applicable`, `not-supported`, `not-detected`.

## 5. Private Repo Token

Scorecard checks `Branch-Protection`, `Webhooks`, and `Dependency-Update-Tool` need `repo`-scoped access. Create a fine-grained PAT with read-only repo scope, add as `SCORECARD_TOKEN`:

```yaml
- uses: ossf/scorecard-action@v2.4.2
  with:
    results_file: results.sarif
    results_format: sarif
    repo_token: ${{ secrets.SCORECARD_TOKEN }}
    publish_results: false   # private repos can't publish
```

## 6. Custom Badge Location

Embed the badge in a table:

```markdown
| Metric | Status |
|--------|--------|
| Scorecard | [![Scorecard](https://api.scorecard.dev/projects/github.com/OWNER/REPO/badge)](https://scorecard.dev/viewer/?uri=github.com/OWNER/REPO) |
| CI | ... |
```

## 7. Remediation Issue Template

Customize the body in `scorecard-remediation.yml`:

```bash
gh issue create \
  --title "$title" \
  --label "security,scorecard,good-first-issue" \
  --body "$(cat <<EOF
## Check: $check

**Score**: $score / 10
**Description**: $desc

### Remediation

See the [Scorecard checks reference](https://github.com/ossf/scorecard/blob/main/docs/checks.md#${check,,}).

### Acceptance criteria

- [ ] Re-run Scorecard and confirm score ≥ $THRESHOLD
- [ ] No regression in other checks

### Links

- Scorecard viewer: https://scorecard.dev/viewer/?uri=github.com/${{ github.repository }}
EOF
)"
```

## 8. Per-Branch Runs

Run Scorecard against release branches too:

```yaml
on:
  push:
    branches: [main, release/*]
```

Results are uploaded per ref. The badge reflects the default branch only.

## 9. Use in Private Org with Reusable Workflow

Wrap `scorecard.yml` as a reusable workflow at `.github/workflows/scorecard-reusable.yml` in an org-level repo, then call from every repo with `uses: org/.github/.github/workflows/scorecard-reusable.yml@v1`.

## 10. Gate PRs on Key Checks (Optional, Advanced)

Scorecard itself is not designed as a PR blocker. To approximate: run on PRs, extract specific check scores, and fail the job if a specific check regresses:

```yaml
- run: |
    score=$(jq -r '.runs[0].tool.driver.rules[] | select(.id=="Pinned-Dependencies") | .properties.score' results.sarif)
    if [ "${score%.*}" -lt 8 ]; then
      echo "Pinned-Dependencies score $score dropped below 8"
      exit 1
    fi
```

Warning: this increases PR latency — only gate on checks whose failure is fixable in the PR itself (Pinned-Dependencies, Token-Permissions).

## 11. Babysitter-Driven Remediation Process

A babysitter process can iterate through Scorecard findings and draft fixes:

```bash
babysitter run:create \
  --process-id scorecard-remediation \
  --entry .a5c/processes/scorecard/remediate.js#process \
  --prompt "Fix the three lowest-scoring Scorecard checks, one PR per check"
```

Keep the process interactive (human-approved breakpoints between drafts) — Scorecard checks frequently require judgment calls that should not be auto-merged.

## 12. Retention

Workflow artifacts default to 30 days. Bump for audit trails:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: scorecard-results
    path: results.sarif
    retention-days: 365
```
