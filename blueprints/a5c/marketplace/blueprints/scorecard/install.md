# scorecard — Install Instructions

Configure the OpenSSF Scorecard for your repository — weekly scheduled workflow + on-push runs, results uploaded to GitHub's code-scanning dashboard, a README badge showing the current score, and an optional babysitter-driven process that auto-opens remediation issues for any check scoring below a configured threshold.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check repo visibility: Scorecard runs differently for public vs private repos
2. Check for existing Scorecard config: `.github/workflows/scorecard.yml`, `.github/scorecard.yml`
3. Check branch protection on `main` / `staging` (informs the `Branch-Protection` check)
4. Check for signed releases, SBOM, pinned Actions, Dependabot (informs several checks)
5. Check GitHub Advanced Security status (affects code-scanning SARIF upload permissions on private repos)
6. Summarize findings — predict which Scorecard checks are likely to fail

### Stage 2: Trigger Scope

Ask (multi-select):

1. **Weekly schedule** (recommended, low cost) — `cron: '19 4 * * 1'` (pick a non-peak hour)
2. **On push to default branch**
3. **On pull request to default branch** (read-only run; cannot upload to code scanning)
4. **Manual `workflow_dispatch`**

### Stage 3: Upload Target

Ask:
- Upload SARIF to GitHub code scanning? Default: **yes**
- Publish results publicly to `scorecard.dev`? Default: **yes** for public repos, **no** for private
- Upload as workflow artifact for audit? Default: **yes**

### Stage 4: Remediation

Ask:
- Auto-open GitHub issues for checks scoring below a threshold? Default: **yes**, threshold `5`
- Assign remediation issues to which label? Default: `security,scorecard,good-first-issue`
- Use a babysitter process to draft and commit fixes? Default: **offer but do not auto-run**

### Stage 5: Badge

Ask:
- Add a Scorecard badge to README? Default: **yes** for public repos
- Badge location: top of README? Default: **yes**

## Step 2: Prerequisites

1. Repo must have `contents: read` and for SARIF upload `security-events: write` + `id-token: write`
2. For public repo → `scorecard.dev` publication, register as a publishing repo at https://scorecard.dev (first-time setup)
3. For private repos, GitHub Advanced Security is required to upload SARIF to code scanning

## Step 3: Scorecard Workflow

Create `.github/workflows/scorecard.yml`:

```yaml
name: Scorecard

on:
  branch_protection_rule:
  schedule:
    - cron: '19 4 * * 1'  # Mondays 04:19 UTC
  push:
    branches: [main]
  workflow_dispatch:

permissions: read-all

jobs:
  analysis:
    name: Scorecard analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      id-token: write
      contents: read
      actions: read
      # required for private repos
      checks: read
      deployments: read
      issues: read
      discussions: read
      statuses: read

    steps:
      - name: Checkout
        uses: actions/checkout@v6
        with:
          persist-credentials: false

      - name: Run Scorecard
        uses: ossf/scorecard-action@v2.4.2
        with:
          results_file: results.sarif
          results_format: sarif
          # For public repos: publish to scorecard.dev
          publish_results: true
          # For private repos: create a PAT with repo scope and set as SCORECARD_TOKEN
          # repo_token: ${{ secrets.SCORECARD_TOKEN }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: scorecard-results
          path: results.sarif
          retention-days: 30

      - name: Upload to code scanning
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

For private repos, uncomment the `repo_token` line and add the secret at `Settings → Secrets and variables → Actions`.

## Step 4: Scorecard Config (Optional)

Create `.github/scorecard.yml` to tune which checks run:

```yaml
# Opt out of specific checks
annotations:
  - checks:
      - Binary-Artifacts
    reasons:
      - reason: not-applicable
        comment: >
          We vendor <tool> pre-compiled binaries under vendor/ with verifiable
          checksums and signed provenance. Binary-Artifacts check does not
          reflect that.
```

## Step 5: README Badge

Add near the top of `README.md`:

```markdown
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/OWNER/REPO/badge)](https://scorecard.dev/viewer/?uri=github.com/OWNER/REPO)
```

Replace `OWNER/REPO` with your slug. The badge updates automatically after each Scorecard run.

## Step 6: Remediation — Auto-Open Issues

Create `.github/workflows/scorecard-remediation.yml`:

```yaml
name: Scorecard Remediation
on:
  workflow_run:
    workflows: [Scorecard]
    types: [completed]
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  open-issues:
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    runs-on: ubuntu-latest
    env:
      THRESHOLD: '5'
    steps:
      - uses: actions/checkout@v6
      - name: Download SARIF
        uses: actions/download-artifact@v4
        with:
          name: scorecard-results
          github-token: ${{ secrets.GITHUB_TOKEN }}
          run-id: ${{ github.event.workflow_run.id }}
      - name: Parse and open issues
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Extract check name + score from SARIF rules properties
          jq -r '.runs[0].tool.driver.rules[] | "\(.id)\t\(.properties.score)\t\(.shortDescription.text)"' results.sarif \
            | while IFS=$'\t' read -r check score desc; do
                if [ "${score%.*}" -lt "$THRESHOLD" ] && [ "$score" != "-1" ]; then
                  title="Scorecard: $check scored $score"
                  existing=$(gh issue list --search "$title in:title" --state open --json number --jq '.[0].number')
                  if [ -z "$existing" ]; then
                    gh issue create \
                      --title "$title" \
                      --label "security,scorecard" \
                      --body "**Check**: $check\\n**Score**: $score / 10\\n**Description**: $desc\\n\\nRemediation guide: https://github.com/ossf/scorecard/blob/main/docs/checks.md#${check,,}"
                  else
                    echo "Issue already open: #$existing for $check"
                  fi
                fi
              done
```

## Step 7: Pin Third-Party Actions

Scorecard's `Pinned-Dependencies` check flags any `uses:` referencing a floating tag or branch. Pin all third-party Actions to a commit SHA:

```yaml
# Instead of:
- uses: actions/checkout@v6
# Use:
- uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332  # v6
```

The `scorecard-action` itself accepts a tag reference because it is maintained by OpenSSF — that's acceptable. For everything else, pin SHAs and tag them in a comment.

## Step 8: Common Remediations

Document in `SECURITY.md`:

- **Branch-Protection**: enable required reviews + require status checks + require linear history on `main`
- **Code-Review**: require at least one reviewing approval on PRs
- **Dangerous-Workflow**: avoid `pull_request_target` with `workflow_run` for untrusted input
- **Dependency-Update-Tool**: enable Dependabot or Renovate
- **Fuzzing**: enable OSS-Fuzz or CIFuzz
- **License**: ensure a `LICENSE` file exists at repo root
- **Maintained**: have at least one commit per 90 days
- **Packaging**: publish releases (via GitHub Releases) for versioned artifacts
- **Pinned-Dependencies**: pin Actions + Dockerfile base images to SHAs
- **SAST**: run CodeQL or similar SAST tool
- **Security-Policy**: add `SECURITY.md` with vulnerability reporting instructions
- **Signed-Releases**: sign release artifacts via cosign / Sigstore (see `slsa-provenance` plugin)
- **Token-Permissions**: set `permissions: read-all` at workflow top-level; escalate per-job

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name scorecard --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify

1. Workflow runs on first push to `main`
2. Results visible at `Security → Code scanning → Scorecard` in the repo UI
3. Public repos: `https://scorecard.dev/viewer/?uri=github.com/OWNER/REPO` renders the report
4. README badge renders the current score
5. Remediation workflow opens issues for failing checks
6. Pinned-Dependencies score increases after pinning Actions to SHAs

## Reference

- OpenSSF Scorecard: https://github.com/ossf/scorecard
- scorecard-action: https://github.com/ossf/scorecard-action
- Checks reference: https://github.com/ossf/scorecard/blob/main/docs/checks.md
- Public viewer: https://scorecard.dev/
