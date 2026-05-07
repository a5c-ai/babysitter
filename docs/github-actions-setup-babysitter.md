---
title: Babysitter GitHub Action Setup
description: Configure the official Babysitter GitHub Action for harness-agnostic orchestration workflows in GitHub Actions.
last_updated: 2026-04-26
---

# Using the Babysitter GitHub Action

This guide explains how to use the official [Babysitter GitHub Action](https://github.com/a5c-ai/babysitter) (`a5c-ai/babysitter@main`) for automated, AI-orchestrated workflows in your CI/CD pipeline.

## Overview

The Babysitter action is **harness-agnostic** — it supports multiple AI harnesses (pi, claude-code, codex, gemini-cli, and more) through a single action interface. It builds the local `babysitter-agent` runtime from the action repository, resolves credentials for the selected provider, and runs `babysitter-agent yolo` to execute deterministic, event-sourced orchestration with quality gates, iterative refinement, and multi-step process management.

Unlike harness-specific actions (`anthropics/claude-code-action`, `openai/codex-action`, `google-github-actions/run-gemini-cli`), this action lets you switch harnesses with a single input change while keeping the same workflow structure.

## Quick Start

### Basic Setup

```yaml
name: Babysitter

on:
  issue_comment:
    types: [created]
  issues:
    types: [opened, assigned]

jobs:
  babysitter:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@babysitter')) ||
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
          prompt: |
            ${{ github.event.comment.body || github.event.issue.body }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### With a Specific Harness and Model

```yaml
- name: Run Babysitter
  uses: a5c-ai/babysitter@main
  with:
    prompt: 'Review this PR for code quality and security issues'
    harness: codex
    model: openai:gpt-4.1
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Using the Internal Harness (Default)

The `internal` harness uses a programmatic pi-coding-agent — no external CLI needed. It reads credentials from environment variables and resolves models via the `provider:modelId` pattern:

```yaml
- name: Run Babysitter
  uses: a5c-ai/babysitter@main
  with:
    prompt: 'Implement the feature described in this issue'
    model: anthropic:claude-sonnet-4-20250514
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Authentication

### Provider Credentials

Pass the API key matching your model's provider:

| Provider | Input | Environment Variable |
|----------|-------|---------------------|
| Anthropic | `anthropic-api-key` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai-api-key` | `OPENAI_API_KEY` |
| Google Gemini | `gemini-api-key` | `GEMINI_API_KEY` |
| Azure OpenAI | `azure-openai-api-key` | `AZURE_OPENAI_API_KEY` |

### Azure OpenAI Configuration

Azure requires additional configuration beyond the API key:

```yaml
- uses: a5c-ai/babysitter@main
  with:
    prompt: 'Your task'
    model: azure-openai-responses:gpt-4.1
    azure-openai-api-key: ${{ secrets.AZURE_OPENAI_API_KEY }}
    azure-openai-project-name: ${{ vars.AZURE_OPENAI_PROJECT_NAME }}
    azure-openai-deployment: ${{ vars.AZURE_OPENAI_DEPLOYMENT }}
    azure-openai-base-url: ${{ vars.AZURE_OPENAI_BASE_URL }}
```

### Model Selection

Models use the `provider:modelId` format. The provider determines which API key is required:

```yaml
# Anthropic
model: anthropic:claude-sonnet-4-20250514
model: anthropic:claude-opus-4-5

# OpenAI
model: openai:gpt-4.1
model: openai:o4-mini

# Azure OpenAI
model: azure-openai-responses:gpt-4.1

# Bare model ID (auto-detected from available credentials)
model: claude-sonnet-4-20250514
```

## Configuration Options

### Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `prompt` | No | — | Task prompt. GitHub context vars available via shell expansion. |
| `harness` | No | `internal` | AI harness: internal, pi, claude-code, codex, gemini-cli |
| `model` | No | — | Model in `provider:modelId` format |
| `process-path` | No | — | Path to process definition (skips Phase 1) |
| `workspace` | No | `$GITHUB_WORKSPACE` | Working directory |
| `max-iterations` | No | `65000` | Max orchestration iterations |
| `runs-dir` | No | `~/.a5c/runs` | Run state directory |
| `timeout-minutes` | No | `30` | Step timeout |
| `verbose` | No | `false` | Enable debug output |
| `anthropic-api-key` | No | — | Anthropic API key |
| `openai-api-key` | No | — | OpenAI API key |
| `gemini-api-key` | No | — | Google Gemini API key |
| `azure-openai-api-key` | No | — | Azure OpenAI API key |
| `azure-openai-project-name` | No | — | Azure resource name |
| `azure-openai-deployment` | No | — | Azure deployment name |
| `azure-openai-base-url` | No | — | Azure endpoint URL |
| `github-token` | No | `${{ github.token }}` | GitHub API token |

### Action Outputs

| Output | Description |
|--------|-------------|
| `run-id` | Babysitter run ID |
| `run-dir` | Path to the run directory |
| `status` | Final status: completed, failed, or unknown |
| `iterations` | Number of orchestration iterations |

## Workflow Examples

### Issue Comment Handler

```yaml
name: Babysitter Issue Handler

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: a5c-ai/babysitter@main
        with:
          prompt: ${{ github.event.comment.body || github.event.issue.body }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### PR Review

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Review PR #${{ github.event.pull_request.number }} in ${{ github.repository }}.
            Analyze for code quality, security vulnerabilities, performance, and test coverage.
          harness: internal
          model: anthropic:claude-sonnet-4-20250514
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Feature Development (TDD)

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Implement the feature described in issue #${{ github.event.issue.number }}
            in ${{ github.repository }} using TDD methodology.
            Write failing tests first, implement, refactor, iterate until quality threshold is met.
            Create a PR when complete.
          max-iterations: '50'
          timeout-minutes: '60'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### GSD Quick Tasks

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Use GSD methodology for rapid implementation:
            ${{ github.event.comment.body }}
          max-iterations: '20'
          timeout-minutes: '15'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Spec-Driven Development

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Implement the specification at ${{ inputs.spec_file }} using Spec-Kit methodology.
            Parse the spec, generate an implementation plan, implement with continuous validation,
            and generate a compliance report.
          timeout-minutes: '60'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Security Scanning

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Run a comprehensive security scan of ${{ github.repository }}.
            Perform SAST analysis, dependency vulnerability scanning, and secret detection.
            Report findings and create a PR with fixes where possible.
          timeout-minutes: '30'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Architecture Documentation

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: a5c-ai/babysitter@main
        with:
          prompt: |
            Generate architecture documentation for ${{ github.repository }}.
            Create C4 model diagrams, system overview, data flow docs, and API docs.
            Update the docs/ directory and create a PR.
          timeout-minutes: '30'
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Multi-Harness Example (Codex)

```yaml
- uses: a5c-ai/babysitter@main
  with:
    prompt: 'Implement and test the feature'
    harness: codex
    model: openai:o4-mini
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Multi-Harness Example (Gemini CLI)

```yaml
- uses: a5c-ai/babysitter@main
  with:
    prompt: 'Analyze the codebase and generate documentation'
    harness: gemini-cli
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
```

## Environment Variables

Configure babysitter behavior via environment variables on the workflow step:

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

| Variable | Default | Description |
|----------|---------|-------------|
| `BABYSITTER_MAX_ITERATIONS` | `65000` | Max orchestration iterations |
| `BABYSITTER_QUALITY_THRESHOLD` | `80` | Quality gate threshold (0-100) |
| `BABYSITTER_LOG_LEVEL` | `info` | Logging: info, debug, warn, error |
| `BABYSITTER_TIMEOUT` | `120000` | Operation timeout in ms |
| `BABYSITTER_RUNS_DIR` | `~/.a5c/runs` | Run state directory override |
| `BABYSITTER_RUNS_SCOPE` | `global` | Set to `repo` to keep runs under `<repo>/.a5c/runs` |

## Artifacts and Outputs

### Run Artifacts

The action automatically uploads babysitter run artifacts (journals, task results, blobs) as a GitHub Actions artifact named `babysitter-runs`. Configure retention:

```yaml
# Override in your workflow after the babysitter step
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: ~/.a5c/runs/
    retention-days: 14
```

### Using Outputs

```yaml
- uses: a5c-ai/babysitter@main
  id: babysitter
  with:
    prompt: 'Your task'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}

- name: Check results
  run: |
    echo "Run ID: ${{ steps.babysitter.outputs.run-id }}"
    echo "Status: ${{ steps.babysitter.outputs.status }}"
    echo "Iterations: ${{ steps.babysitter.outputs.iterations }}"
```

## Prompt Templates

The prompt input supports GitHub context variables via shell expansion. Common variables:

| Variable | Description |
|----------|-------------|
| `${{ github.repository }}` | Owner/repo |
| `${{ github.event_name }}` | Event type |
| `${{ github.event.issue.number }}` | Issue number |
| `${{ github.event.pull_request.number }}` | PR number |
| `${{ github.event.comment.body }}` | Comment text |
| `${{ github.sha }}` | Commit SHA |
| `${{ github.ref }}` | Git ref |
| `${{ github.actor }}` | Triggering user |

## Troubleshooting

### Babysitter Agent Runtime Build Failed

The action builds `babysitter-agent` from the action repository. If it fails, check Node.js availability:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
```

### Authentication Errors

Ensure the correct API key secret is set for your harness/model:
- `internal` or `claude-code` with Anthropic models → `ANTHROPIC_API_KEY`
- `codex` or OpenAI models → `OPENAI_API_KEY`
- `gemini-cli` → `GEMINI_API_KEY`
- Azure models → `AZURE_OPENAI_API_KEY` plus project/deployment/URL

### Runs Timing Out

1. Reduce `max-iterations` (e.g., `50`)
2. Increase `timeout-minutes`
3. Use a simpler methodology (GSD vs TDD)
4. Break the task into smaller pieces

### No Output / Empty Results

Enable verbose mode for debugging:

```yaml
- uses: a5c-ai/babysitter@main
  with:
    prompt: 'Your task'
    verbose: 'true'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Reference

### Babysitter
- [Babysitter Repository](https://github.com/a5c-ai/babysitter)
- [Babysitter Agent Runtime](https://github.com/a5c-ai/babysitter/tree/main/packages/babysitter-agent)
- [Babysitter SDK](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)

### Harness-Specific Actions
- [Claude Code Action](https://github.com/anthropics/claude-code-action) — [Setup Guide](github-actions-setup-claude-code.md)
- [Codex Action](https://github.com/openai/codex-action) — [Setup Guide](github-actions-setup-codex.md)
- [Gemini CLI Action](https://github.com/google-github-actions/run-gemini-cli) — [Setup Guide](github-actions-setup-gemini-cli.md)

### Marketplace Plugins
- [github-actions-cicd-babysitter](https://github.com/a5c-ai/babysitter/blob/main/plugins/a5c/marketplace/plugins/github-actions-cicd-babysitter/configure.md) — Marketplace plugin for this action
- [github-actions-cicd-claude-code](https://github.com/a5c-ai/babysitter/blob/main/plugins/a5c/marketplace/plugins/github-actions-cicd-claude-code/configure.md) — Claude Code specific
- [github-actions-cicd-codex](https://github.com/a5c-ai/babysitter/blob/main/plugins/a5c/marketplace/plugins/github-actions-cicd-codex/configure.md) — Codex specific
- [github-actions-cicd-gemini-cli](https://github.com/a5c-ai/babysitter/blob/main/plugins/a5c/marketplace/plugins/github-actions-cicd-gemini-cli/configure.md) — Gemini CLI specific
