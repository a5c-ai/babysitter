# GitHub Actions CI/CD — Configuration

## 1. Add or Remove Workflow Templates

### Adding a new workflow

Copy any of the workflow templates from the install instructions and save to `.github/workflows/babysitter-<name>.yml`. Available templates:

| Workflow | Trigger | Use Case |
|----------|---------|----------|
| `babysitter-issue-comment.yml` | `@claude` in issues/PRs | General-purpose Claude interaction |
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

### Change the `@claude` trigger keyword

In the issue comment workflow, modify the `contains()` check:

```yaml
if: contains(github.event.comment.body, '/babysitter')  # Change trigger word
```

## 3. Environment Variables

Configure babysitter behavior by adding `env:` to any workflow step:

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    # ... other config ...
  env:
    BABYSITTER_MAX_ITERATIONS: 50        # Limit iterations (default: 256)
    BABYSITTER_QUALITY_THRESHOLD: 85     # Quality gate (default: 80)
    BABYSITTER_LOG_LEVEL: debug          # Logging: info|debug|warn|error
    BABYSITTER_TIMEOUT: 180000           # Timeout in ms (default: 120000)
```

## 4. Pin Plugin Version

For reproducible CI builds, pin to a specific babysitter version:

```yaml
plugins: |
  babysitter@a5c.ai@4.0.142
```

## 5. Customize Permissions

Each workflow has a `permissions:` block. Adjust based on what the workflow needs:

```yaml
permissions:
  contents: write       # For git commits and pushes
  pull-requests: write  # For creating/commenting on PRs
  issues: write         # For creating/commenting on issues
  security-events: write # For security scanning results
  id-token: write       # For OIDC authentication
```

Remove `write` permissions that aren't needed for read-only workflows (e.g., PR review can use `contents: read`).

## 6. Artifact Retention

Adjust how long babysitter run artifacts are kept:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: .a5c/runs/
    retention-days: 14  # Default: 7, increase for audit trails
```

## 7. Timeout Configuration

Set workflow-level timeouts to prevent runaway jobs:

```yaml
jobs:
  claude:
    runs-on: ubuntu-latest
    timeout-minutes: 45  # Adjust per workflow complexity
```

Recommended timeouts:
- Issue comments: 15-30 minutes
- PR review: 15-20 minutes
- Feature development: 30-60 minutes
- Security scanning: 30 minutes
- Spec-driven: 60 minutes

## 8. Custom Prompts

Modify the `prompt:` field in any workflow to change what babysitter does:

```yaml
prompt: |
  /babysitter:call <your-custom-prompt-here>

  REPO: ${{ github.repository }}
  # Add any context variables needed
```

Use babysitter methodologies in prompts:
- `/babysitter:call use TDD Quality Convergence for ...` — Test-driven development
- `/babysitter:call use GSD methodology for ...` — Quick prototyping
- `/babysitter:call use Spec-Kit for ...` — Specification-driven
- `/babysitter:call use specializations/<domain>/<process> for ...` — Domain-specific

## Reference

- [GitHub Actions Setup Guide](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup.md)
- [Claude Code Action](https://github.com/anthropics/claude-code-action)
- [Claude Code Action Setup](https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md)
