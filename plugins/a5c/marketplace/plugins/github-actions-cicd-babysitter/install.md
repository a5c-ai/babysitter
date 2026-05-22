# GitHub Actions CI/CD (Babysitter) — Install Instructions

Set up babysitter-powered GitHub Actions workflows using the official [Babysitter Action](https://github.com/a5c-ai/babysitter) (`a5c-ai/babysitter@main`). This harness-agnostic action supports pi, claude-code, codex, gemini-cli, and more through a single interface. Based on the [official setup guide](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-babysitter.md).

## Step 1: Interview the User

Ask which workflow triggers and templates to install:

### Trigger Types

1. **Issue Comment Handler** (recommended) — Responds to `@babysitter` mentions in issue comments and PR review comments. Most versatile trigger.
2. **PR Review Automation** — Automatically runs babysitter-orchestrated code review when PRs are opened, synchronized, or marked ready for review.
3. **Feature Development (TDD)** — Triggers on issues labeled `feature-request`, implements features using TDD Quality Convergence methodology.
4. **GSD Quick Tasks** — Triggers on `/gsd` commands in issue comments for rapid prototyping.
5. **Spec-Driven Development** — Manual dispatch workflow for implementing specifications with compliance tracking.
6. **Security Scanning** — Scheduled + manual security scanning pipeline.
7. **Incident Response** — Triggers on issues labeled `incident`, executes incident response procedures.
8. **Architecture Documentation** — Triggers on code changes or manual dispatch, generates C4 architecture docs.
9. **All** — Install all workflow templates.

### Additional Options

Ask the user:
- Which branch should workflows target? (default: `main`)
- Should workflows create PRs automatically? (default: yes)
- What timeout should be set for workflow runs? (default: 30 minutes)
- Which AI harness to use? (default: `internal`; options: `internal`, `pi`, `claude-code`, `codex`, `gemini-cli`)
- Which model? (default: auto-detected; examples: `anthropic:claude-sonnet-4-20250514`, `openai:gpt-4.1`)
- Which provider credentials? (depends on harness/model selection)

## Step 2: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

## Step 3: Create Workflow Files

Based on the user's selections, create the corresponding workflow YAML files. All workflows use the `a5c-ai/babysitter@main` action.

### Common Configuration Block

All workflows share this core configuration:

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4
    with:
      fetch-depth: 1

  - name: Run Babysitter
    uses: a5c-ai/babysitter@main
    with:
      prompt: 'Your task description'
      anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Note:** Replace the credential input with the one matching the user's provider (e.g., `openai-api-key` for OpenAI, `gemini-api-key` for Gemini).

### Workflow: Issue Comment Handler (`babysitter-issue-comment.yml`)

```yaml
name: Babysitter

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]

jobs:
  babysitter:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@babysitter')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@babysitter')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@babysitter'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Babysitter
        uses: a5c-ai/babysitter@main
        with:
          prompt: ${{ github.event.comment.body || github.event.issue.body }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Workflow: PR Review (`babysitter-pr-review.yml`)

```yaml
name: Babysitter PR Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Babysitter PR Review
        uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Review PR #${{ github.event.pull_request.number }} in ${{ github.repository }}.
            Analyze for code quality, security, performance, and test coverage.
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Workflow: Feature Development TDD (`babysitter-feature-tdd.yml`)

```yaml
name: Babysitter TDD Feature

on:
  issues:
    types: [labeled]

jobs:
  develop:
    if: github.event.label.name == 'feature-request'
    runs-on: ubuntu-latest
    timeout-minutes: 60
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Babysitter TDD
        uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Implement the feature in issue #${{ github.event.issue.number }}
            using TDD methodology. Write failing tests first, implement, refactor,
            iterate until quality threshold is met. Create a PR when complete.
          max-iterations: '50'
          timeout-minutes: '60'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Workflow: GSD Quick Tasks (`babysitter-gsd.yml`)

```yaml
name: Babysitter GSD

on:
  issue_comment:
    types: [created]

jobs:
  gsd:
    if: contains(github.event.comment.body, '/gsd')
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Babysitter GSD
        uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Use GSD methodology for rapid implementation:
            ${{ github.event.comment.body }}
          max-iterations: '20'
          timeout-minutes: '15'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Workflow: Spec-Driven Development (`babysitter-spec-kit.yml`)

```yaml
name: Babysitter Spec-Kit

on:
  workflow_dispatch:
    inputs:
      spec_file:
        description: 'Path to specification file'
        required: true
        type: string

jobs:
  implement:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Babysitter Spec-Kit
        uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Implement the specification at ${{ inputs.spec_file }}.
            Parse the spec, plan, implement with validation, generate compliance report.
          timeout-minutes: '60'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Workflow: Security Scanning (`babysitter-security.yml`)

```yaml
name: Babysitter Security

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * 1'

jobs:
  security:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write
      pull-requests: write
      security-events: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Babysitter Security Scan
        uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Run a comprehensive security scan of ${{ github.repository }}.
            SAST analysis, dependency scanning, secret detection.
            Report findings and create a PR with fixes.
          timeout-minutes: '30'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Workflow: Incident Response (`babysitter-incident-response.yml`)

```yaml
name: Babysitter Incident Response

on:
  issues:
    types: [opened, labeled]

jobs:
  incident:
    if: contains(github.event.issue.labels.*.name, 'incident')
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Babysitter Incident Response
        uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Incident response for issue #${{ github.event.issue.number }}:
            "${{ github.event.issue.title }}"
            Analyze, identify affected systems, generate runbook, document timeline.
          timeout-minutes: '30'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Workflow: Architecture Documentation (`babysitter-arch-docs.yml`)

```yaml
name: Babysitter Architecture Docs

on:
  workflow_dispatch:
  push:
    paths: ['src/**', 'packages/**']

jobs:
  docs:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Babysitter Architecture Documentation
        uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Generate architecture documentation for ${{ github.repository }}.
            C4 diagrams, system overview, data flow, API docs.
            Update docs/ and create a PR.
          timeout-minutes: '30'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Step 4: Configure GitHub Secrets

Instruct the user to add the API key secret matching their provider:

| Provider | Secret Name | Where to Get |
|----------|-------------|--------------|
| Anthropic | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| Google | `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| Azure | `AZURE_OPENAI_API_KEY` | Azure Portal |

Guide them to: `https://github.com/<owner>/<repo>/settings/secrets/actions`

## Step 5: Configure Environment Variables (Optional)

Create a `.github/babysitter.env` reference file:

```
# Babysitter Configuration for GitHub Actions
# Set these as env vars in your workflow YAML

# BABYSITTER_RUNS_DIR=.a5c/runs
# BABYSITTER_MAX_ITERATIONS=100
# BABYSITTER_QUALITY_THRESHOLD=85
# BABYSITTER_LOG_LEVEL=debug
```

## Step 6: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name github-actions-cicd-babysitter --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 7: Verify Setup

After creating the workflow files:

1. Commit and push the `.github/workflows/` changes
2. Test by creating an issue with `@babysitter` in the body
3. Verify the workflow triggers in the Actions tab
4. Check that the babysitter-agent runtime builds and runs correctly in the logs

## Reference

- [Babysitter Action](https://github.com/a5c-ai/babysitter)
- [Setup Guide](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-babysitter.md)
- [Harness-specific guides](https://github.com/a5c-ai/babysitter/blob/main/docs/):
  - [Claude Code](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-claude-code.md)
  - [Codex](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-codex.md)
  - [Gemini CLI](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-gemini-cli.md)
