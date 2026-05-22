# GitHub Actions CI/CD (Codex) — Configuration

## 1. Add or Remove Workflow Templates

### Adding a new workflow

Copy any of the workflow templates from the install instructions and save to `.github/workflows/babysitter-<name>.yml`. Available templates:

| Workflow | Trigger | Use Case |
|----------|---------|----------|
| `babysitter-issue-comment.yml` | `@codex` in issues/PRs | General-purpose Codex interaction |
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

### Change the `@codex` trigger keyword

In the issue comment workflow, modify the `contains()` check:

```yaml
if: contains(github.event.comment.body, '/babysitter')  # Change trigger word
```

## 3. Sandbox Mode

Codex supports several sandbox configurations. Change the `sandbox` parameter:

```yaml
- uses: openai/codex-action@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    sandbox: "workspace-write"  # workspace-write | read-only | danger-full-access
```

| Mode | Description | Use Case |
|------|-------------|----------|
| `workspace-write` | Read/write to workspace only | Default; feature development, refactoring |
| `read-only` | No filesystem writes | Code review, analysis |
| `danger-full-access` | Full system access | Complex builds requiring system packages |

## 4. Safety Strategy

Codex supports multiple safety strategies:

```yaml
- uses: openai/codex-action@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    safety-strategy: "drop-sudo"  # drop-sudo | unprivileged-user | read-only | unsafe
```

## 5. Environment Variables

Configure babysitter behavior by adding `env:` to any workflow step:

```yaml
- uses: openai/codex-action@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    # ... other config ...
  env:
    BABYSITTER_MAX_ITERATIONS: 50        # Limit iterations (default: 65000)
    BABYSITTER_QUALITY_THRESHOLD: 85     # Quality gate (default: 80)
    BABYSITTER_LOG_LEVEL: debug          # Logging: info|debug|warn|error
    BABYSITTER_TIMEOUT: 180000           # Timeout in ms (default: 120000)
```

## 6. Pin Versions

For reproducible CI builds, pin to specific versions:

```yaml
# Pin Codex version
- uses: openai/codex-action@v1
  with:
    codex-version: "0.1.2"

# Pin Babysitter SDK version
- name: Install Babysitter SDK
  run: npm install -g @a5c-ai/babysitter-sdk@4.0.142
```

## 7. Customize Permissions

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

## 8. Structured Output

Codex supports structured output via JSON schemas:

```yaml
- uses: openai/codex-action@v1
  id: codex
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    output-schema: |
      {
        "type": "object",
        "properties": {
          "summary": { "type": "string" },
          "files_changed": { "type": "array", "items": { "type": "string" } },
          "tests_passed": { "type": "boolean" }
        },
        "required": ["summary", "files_changed", "tests_passed"]
      }
    prompt: "Your task description"

- name: Use structured output
  run: echo "${{ steps.codex.outputs.final-message }}"
```

## 9. Artifact Retention

Adjust how long babysitter run artifacts are kept:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: .a5c/runs/
    retention-days: 14  # Default: 7, increase for audit trails
```

## 10. Timeout Configuration

Set workflow-level timeouts to prevent runaway jobs:

```yaml
jobs:
  codex:
    runs-on: ubuntu-latest
    timeout-minutes: 45  # Adjust per workflow complexity
```

Recommended timeouts:
- Issue comments: 15-30 minutes
- PR review: 15-20 minutes
- Feature development: 30-60 minutes
- Security scanning: 30 minutes
- Spec-driven: 60 minutes

## 11. Custom Prompts

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
- [Codex Action](https://github.com/openai/codex-action)
- [OpenAI Codex CLI](https://github.com/openai/codex)

