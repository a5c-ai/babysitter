# GitHub Actions CI/CD (Babysitter) — Configuration

## 1. Add or Remove Workflow Templates

### Adding a new workflow

Copy any workflow template from the install instructions and save to `.github/workflows/babysitter-<name>.yml`.

| Workflow | Trigger | Use Case |
|----------|---------|----------|
| `babysitter-issue-comment.yml` | `@babysitter` in issues/PRs | General-purpose interaction |
| `babysitter-pr-review.yml` | PR opened/updated | Automated code review |
| `babysitter-feature-tdd.yml` | Issue labeled `feature-request` | TDD feature development |
| `babysitter-gsd.yml` | `/gsd` in issue comment | Quick task execution |
| `babysitter-spec-kit.yml` | Manual dispatch | Spec-driven development |
| `babysitter-security.yml` | Weekly schedule + manual | Security scanning |
| `babysitter-incident-response.yml` | Issue labeled `incident` | Incident response |
| `babysitter-arch-docs.yml` | Code push + manual | Architecture documentation |

### Removing a workflow

Delete the corresponding `.yml` file from `.github/workflows/` and push the change.

## 2. Harness Selection

Change the AI harness used by modifying the `harness` input:

```yaml
- uses: a5c-ai/babysitter@main
  with:
    harness: internal    # Default: programmatic pi agent (no external CLI needed)
    # harness: pi        # Pi CLI
    # harness: claude-code  # Claude Code CLI
    # harness: codex     # OpenAI Codex CLI
    # harness: gemini-cli   # Google Gemini CLI
```

The `internal` harness is recommended for CI — it runs a programmatic pi-coding-agent without needing an external CLI binary.

## 3. Model Configuration

Models use the `provider:modelId` format. The provider determines which API key is required:

```yaml
- uses: a5c-ai/babysitter@main
  with:
    model: anthropic:claude-sonnet-4-20250514   # Anthropic
    # model: openai:gpt-4.1                     # OpenAI
    # model: azure-openai-responses:gpt-4.1     # Azure OpenAI
    # model: claude-sonnet-4-20250514            # Bare ID (auto-detected)
```

## 4. Credential Configuration

Pass the API key matching your provider:

```yaml
# Anthropic
anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}

# OpenAI
openai-api-key: ${{ secrets.OPENAI_API_KEY }}

# Google Gemini
gemini-api-key: ${{ secrets.GEMINI_API_KEY }}

# Azure OpenAI (requires additional config)
azure-openai-api-key: ${{ secrets.AZURE_OPENAI_API_KEY }}
azure-openai-project-name: ${{ vars.AZURE_OPENAI_PROJECT_NAME }}
azure-openai-deployment: ${{ vars.AZURE_OPENAI_DEPLOYMENT }}
azure-openai-base-url: ${{ vars.AZURE_OPENAI_BASE_URL }}
```

## 5. Customize Triggers

Edit the `on:` section of any workflow file:

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
    - cron: '0 9 * * 1-5'

# On specific labels
on:
  issues:
    types: [labeled]
```

### Change the trigger keyword

```yaml
if: contains(github.event.comment.body, '/run-babysitter')
```

## 6. Environment Variables

```yaml
- uses: a5c-ai/babysitter@main
  with:
    prompt: 'Your task'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
  env:
    BABYSITTER_MAX_ITERATIONS: 50
    BABYSITTER_QUALITY_THRESHOLD: 85
    BABYSITTER_LOG_LEVEL: debug
    BABYSITTER_TIMEOUT: 180000
```

## 7. Custom Process

Skip babysitter's Phase 1 (process creation from prompt) by providing a pre-built process:

```yaml
- uses: a5c-ai/babysitter@main
  with:
    process-path: .a5c/processes/my-custom-process.js
    prompt: 'Execute the custom process'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## 8. Pin SDK Version

For reproducible CI builds, pin the babysitter-sdk version by adding a pre-step:

```yaml
- name: Install specific SDK version
  run: npm install -g @a5c-ai/babysitter-sdk@0.0.187

- uses: a5c-ai/babysitter@main
  with:
    prompt: 'Your task'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## 9. Permissions

Adjust the `permissions:` block based on workflow needs:

```yaml
permissions:
  contents: write       # Git commits and pushes
  pull-requests: write  # Creating/commenting on PRs
  issues: write         # Creating/commenting on issues
  security-events: write # Security scanning results
  id-token: write       # OIDC authentication
```

## 10. Artifact Retention

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: .a5c/runs/
    retention-days: 14
```

## 11. Timeout Configuration

```yaml
- uses: a5c-ai/babysitter@main
  with:
    timeout-minutes: '45'
```

Recommended timeouts:
- Issue comments: 15-30 minutes
- PR review: 15-20 minutes
- Feature development: 30-60 minutes
- Security scanning: 30 minutes
- Spec-driven: 60 minutes

## 12. Using Action Outputs

```yaml
- uses: a5c-ai/babysitter@main
  id: babysitter
  with:
    prompt: 'Your task'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}

- name: Check results
  if: always()
  run: |
    echo "Run ID: ${{ steps.babysitter.outputs.run-id }}"
    echo "Status: ${{ steps.babysitter.outputs.status }}"
    echo "Iterations: ${{ steps.babysitter.outputs.iterations }}"
```

## Reference

- [Babysitter Action](https://github.com/a5c-ai/babysitter)
- [Setup Guide](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-babysitter.md)
- [GitHub Actions Setup (Claude Code)](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-claude-code.md)
- [GitHub Actions Setup (Codex)](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-codex.md)
- [GitHub Actions Setup (Gemini CLI)](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-gemini-cli.md)
