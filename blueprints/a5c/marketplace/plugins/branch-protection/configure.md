# branch-protection — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `enforceAdmins` | `on`, `off` | `on` | yaml `enforce_admins` |
| `requireCodeOwnerReviews` | `on`, `off` | `on` | yaml `require_code_owner_reviews` |
| `minApprovals.main` | integer | `1` | yaml `required_approving_review_count` |
| `minApprovals.release` | integer | `2` | yaml |
| `dismissStaleReviews` | `on`, `off` | `on` | yaml |
| `requireLastPushApproval` | `on`, `off` | `on` | yaml |
| `linearHistory` | `on`, `off` | `on` | yaml |
| `conversationResolution` | `on`, `off` | `on` | yaml |
| `requireSignatures` | `on`, `off` | `off` | yaml |
| `allowForcePush` | `on`, `off` | `off` | yaml |
| `allowDeletions` | `on`, `off` | `off` | yaml |
| `bypassApps` | list of app slugs | `[dependabot]` | yaml `bypass_pull_request_allowances.apps` |
| `driftSchedule` | cron | `0 7 * * 1` | workflow cron |

## 2. Add a New Protected Branch

Edit `.github/branch-protection.yaml`:

```yaml
branches:
  - name: main
    # ...
  - name: production
    required_status_checks:
      strict: true
      checks: [{ context: build }, { context: test }, { context: security-scan }]
    required_pull_request_reviews:
      required_approving_review_count: 2
      require_code_owner_reviews: true
    required_linear_history: true
    required_signatures: true
    allow_force_pushes: false
    allow_deletions: false
```

Run `npm run branch-protection:apply`.

## 3. Add Required Status Checks

When a new CI job is added, include its job name as a check context:

```yaml
required_status_checks:
  strict: true
  checks:
    - context: build
    - context: test
    - context: new-check-name
```

## 4. Allow a Bot to Bypass

```yaml
bypass_pull_request_allowances:
  apps: [dependabot, release-please]
```

App must be installed on the repo.

## 5. Enable Signed Commits

```yaml
required_signatures: true
```

Team members must configure GPG/SSH signing locally (`git config commit.gpgsign true`). Unsigned commits will be rejected by GitHub.

## 6. Switch to GitHub Rulesets

Rulesets are the newer API and support pattern-based targeting (e.g. `refs/heads/release/*` without wildcard translation).

```bash
gh api repos/:owner/:repo/rulesets --input ruleset.json
```

Minimal ruleset JSON:

```json
{
  "name": "Main branch protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 1 } }
  ]
}
```

## 7. Relax Temporarily for a Large Merge

```bash
gh api --method PUT repos/:owner/:repo/branches/main/protection \
  -F enforce_admins=false
# Do the merge
npm run branch-protection:apply   # Restore from yaml
```

## 8. Different Rules per Staging Environment

Use a separate file per environment:

```
.github/branch-protection.yaml            # prod
.github/branch-protection.staging.yaml    # staging
```

Edit the apply script to accept a config path via env var.

## 9. Audit Recent Bypass Events

```bash
gh api repos/:owner/:repo/actions/workflows/branch-protection.yml/runs --paginate \
  | jq '.workflow_runs[] | select(.conclusion == "failure") | { id, html_url }'
```

## 10. Regenerate from Current GitHub State

```bash
babysitter run:create \
  --process-id branch-protection-export \
  --entry .a5c/processes/branch-protection/export.js#process \
  --prompt "Read current branch protection for all branches and emit .github/branch-protection.yaml" \
  --json
```

## 11. Change Drift Schedule

```yaml
schedule:
  - cron: '0 3 * * *'   # daily 03:00 UTC
```
