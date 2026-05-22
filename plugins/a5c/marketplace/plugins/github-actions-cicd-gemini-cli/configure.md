# GitHub Actions CI/CD (Gemini CLI) — Configuration

## 1. Add or Remove Workflow Templates

### Adding a new workflow

Copy any of the workflow templates from the install instructions and save to `.github/workflows/babysitter-<name>.yml`. Available templates:

| Workflow | Trigger | Use Case |
|----------|---------|----------|
| `babysitter-issue-comment.yml` | `@gemini` in issues/PRs | General-purpose Gemini interaction |
| `babysitter-pr-review.yml` | PR opened/updated | Automated code review |
| `babysitter-feature-tdd.yml` | Issue labeled `feature-request` | TDD feature development |
| `babysitter-gsd.yml` | `/gsd` in issue comment | Quick task execution |
| `babysitter-spec-kit.yml` | Manual dispatch | Spec-driven development |
| `babysitter-security.yml` | Weekly schedule + manual | Security scanning |
| `babysitter-incident-response.yml` | Issue labeled `incident` | Incident response |
| `babysitter-arch-docs.yml` | Code push + manual | Architecture documentation |

### Removing a workflow

Delete the corresponding `.yml` file from `.github/workflows/` and push the change.

## 2. Customize Triggers

### Change which events trigger a workflow

Edit the `on:` section of any workflow file. Common trigger patterns:

```yaml
# Only on specific branches
on:
  push:
    branches: [main, develop]

# Only on specific file changes
on:
  push:
    paths: ['src/**', 'packages/**']

# On a schedule
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Weekdays at 9 AM UTC

# On specific labels
on:
  issues:
    types: [labeled]
# then in job: if: github.event.label.name == 'your-label'
```

### Change the `@gemini` trigger keyword

In the issue comment workflow, modify the `contains()` check:

```yaml
if: contains(github.event.comment.body, '/babysitter')  # Change trigger word
```

## 3. Authentication Method

Gemini CLI supports three authentication methods. Switch between them in your workflow:

### API Key (simplest)

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
```

### Vertex AI

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    google_api_key: ${{ secrets.GOOGLE_API_KEY }}
    use_vertex_ai: "true"
```

### GCP Workload Identity Federation (recommended for production)

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}

- uses: google-github-actions/run-gemini-cli@v1
  with:
    gcp_workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    gcp_project_id: ${{ vars.GCP_PROJECT_ID }}
    gcp_service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}
    use_vertex_ai: "true"
```

Ensure the job has `id-token: write` permission for WIF.

## 4. Gemini CLI Settings

Pass settings as JSON to configure Gemini CLI behavior:

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    settings: |
      {
        "codeExecution": true,
        "sandbox": true
      }
```

## 5. Extensions

Install Gemini CLI extensions for additional capabilities:

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    extensions: '["@a5c-ai/babysitter-gemini", "@google/tool-name"]'
```

## 6. Environment Variables

Configure babysitter behavior by adding `env:` to any workflow step:

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    # ... other config ...
  env:
    BABYSITTER_MAX_ITERATIONS: 50        # Limit iterations (default: 65000)
    BABYSITTER_QUALITY_THRESHOLD: 85     # Quality gate (default: 80)
    BABYSITTER_LOG_LEVEL: debug          # Logging: info|debug|warn|error
    BABYSITTER_TIMEOUT: 180000           # Timeout in ms (default: 120000)
    BABYSITTER_EXTENSION_PATH: /usr/local/lib/node_modules/@a5c-ai/babysitter-gemini
```

## 7. Pin Versions

For reproducible CI builds, pin to specific versions:

```yaml
# Pin Gemini CLI version
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_cli_version: "1.2.3"  # latest | preview | nightly | semver

# Pin Babysitter SDK version
- name: Install Babysitter SDK
  run: npm install -g @a5c-ai/babysitter-sdk@4.0.142
```

## 8. Debug Logging

Enable Gemini CLI debug output and artifact upload:

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    gemini_debug: "true"
    upload_artifacts: "true"
```

## 9. Customize Permissions

Each workflow has a `permissions:` block. Adjust based on what the workflow needs:

```yaml
permissions:
  contents: write       # For git commits and pushes
  pull-requests: write  # For creating/commenting on PRs
  issues: write         # For creating/commenting on issues
  security-events: write # For security scanning results
  id-token: write       # Required for GCP Workload Identity Federation
```

Remove `write` permissions that aren't needed for read-only workflows (e.g., PR review can use `contents: read`).

## 10. Artifact Retention

Adjust how long babysitter run artifacts are kept:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: .a5c/runs/
    retention-days: 14  # Default: 7, increase for audit trails
```

## 11. Timeout Configuration

Set workflow-level timeouts to prevent runaway jobs:

```yaml
jobs:
  gemini:
    runs-on: ubuntu-latest
    timeout-minutes: 45  # Adjust per workflow complexity
```

Recommended timeouts:
- Issue comments: 15-30 minutes
- PR review: 15-20 minutes
- Feature development: 30-60 minutes
- Security scanning: 30 minutes
- Spec-driven: 60 minutes

## 12. Custom Prompts

Modify the `prompt:` field in any workflow to change what babysitter does:

```yaml
prompt: |
  You have the babysitter CLI available for orchestration.
  Use it for the following task:

  REPO: ${{ github.repository }}
  # Add any context variables needed
```

## Reference

- [GitHub Actions Setup Guide (Claude Code)](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-claude-code.md)
- [GitHub Actions Setup Guide (Codex)](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-codex.md)
- [GitHub Actions Setup Guide (Gemini CLI)](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-gemini-cli.md)
- [Gemini CLI Action](https://github.com/google-github-actions/run-gemini-cli)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)

