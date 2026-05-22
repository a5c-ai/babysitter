---
title: Codex GitHub Actions Setup
description: Integrate Babysitter orchestration with Codex GitHub Actions workflows.
last_updated: 2026-04-26
---

# Using Babysitter with Codex GitHub Actions

This guide explains how to integrate the Babysitter plugin with [OpenAI's Codex GitHub Action](https://github.com/openai/codex-action) for automated orchestration workflows in your CI/CD pipeline.

## Overview

The Babysitter plugin enables deterministic, event-sourced workflow orchestration for Codex. When combined with GitHub Actions, you can automate complex multi-step development processes with quality gates, human approval checkpoints, and iterative refinement.

Codex uses the `openai/codex-action@v1` action, which runs Codex CLI in a sandboxed environment with a Responses API proxy sidecar for secure API key handling.

## Quick Start

### Basic Setup

Add the Babysitter plugin to your Codex GitHub Actions workflow:

```yaml
name: Codex with Babysitter

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]

jobs:
  codex:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@codex')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@codex'))
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

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk @a5c-ai/babysitter-agent

      - name: Run Codex with Babysitter
        uses: openai/codex-action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          prompt: |
            You have the babysitter CLI available. Use it for orchestration.

            ${{ github.event.comment.body || github.event.issue.body }}
```

For comprehensive Codex Action setup instructions, see the [Codex Action README](https://github.com/openai/codex-action).

## Configuration Options

### Codex Action Parameters

```yaml
- uses: openai/codex-action@v1
  with:
    # Required
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    prompt: "Your task description"

    # Optional
    model: "o4-mini"                    # Model override
    sandbox: "workspace-write"          # workspace-write | read-only | danger-full-access
    safety-strategy: "drop-sudo"        # drop-sudo | unprivileged-user | read-only | unsafe
    codex-version: ""                   # Pin @openai/codex version
    working-directory: ""               # Defaults to repo root
    codex-args: ""                      # Extra CLI args (JSON array or shell string)
    effort: ""                          # Reasoning effort level
    allow-users: ""                     # Comma-separated GitHub usernames (or '*')
    allow-bots: "false"                 # Allow bot-triggered runs
```

### Babysitter Plugin Setup

Since Codex does not have a native plugin marketplace like Claude Code, install the Babysitter SDK as a build step:

```yaml
- name: Install Babysitter SDK
  run: npm install -g @a5c-ai/babysitter-sdk @a5c-ai/babysitter-agent
```

The `babysitter` CLI will then be available to Codex during execution.

## Workflow Examples

### Example 1: PR Review with Quality Gates

```yaml
name: Babysitter PR Review (Codex)

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

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk @a5c-ai/babysitter-agent

      - name: Run Babysitter PR Review
        uses: openai/codex-action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          sandbox: "read-only"
          prompt: |
            You have access to the babysitter CLI for orchestration.
            Use it to orchestrate a thorough code review using TDD Quality Convergence methodology.

            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Analyze the PR changes for:
            - Code quality and best practices
            - Security vulnerabilities
            - Performance implications
            - Test coverage

            Run: babysitter-agent call --harness codex --prompt "review this PR" --workspace .
```

### Example 2: Feature Development with TDD

```yaml
name: Babysitter TDD Feature (Codex)

on:
  issues:
    types: [labeled]

jobs:
  develop:
    if: github.event.label.name == 'feature-request'
    runs-on: ubuntu-latest
    timeout-minutes: 30
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

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk @a5c-ai/babysitter-agent

      - name: Run Babysitter TDD
        uses: openai/codex-action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          sandbox: "workspace-write"
          prompt: |
            You have the babysitter CLI available for orchestration.
            Implement the feature described in issue #${{ github.event.issue.number }} using TDD Quality Convergence methodology.

            REPO: ${{ github.repository }}
            ISSUE NUMBER: ${{ github.event.issue.number }}

            The process should:
            1. Write failing tests first
            2. Implement minimal code to pass tests
            3. Refactor for quality
            4. Iterate until 80% quality threshold is met

            Create a PR when complete.
```

### Example 3: GSD Quick Tasks

```yaml
name: Babysitter GSD (Codex)

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

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk @a5c-ai/babysitter-agent

      - name: Run Babysitter GSD
        uses: openai/codex-action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          sandbox: "workspace-write"
          allow-users: "*"
          prompt: |
            You have the babysitter CLI available.
            Use GSD methodology for the following task:

            ${{ github.event.comment.body }}

            Focus on rapid, working implementation with minimal overhead.
```

### Example 4: Structured Output

Codex supports structured output via JSON schemas:

```yaml
- name: Run Babysitter with Structured Output
  uses: openai/codex-action@v1
  id: codex
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    sandbox: "workspace-write"
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
    prompt: |
      You have the babysitter CLI available.
      Implement the requested feature and report results.

- name: Use structured output
  run: echo "${{ steps.codex.outputs.final-message }}"
```

## Sandbox Modes

Codex offers several sandbox configurations:

| Mode | Description | Use Case |
|------|-------------|----------|
| `workspace-write` | Read/write to workspace only | Default; feature development, refactoring |
| `read-only` | No filesystem writes | Code review, analysis |
| `danger-full-access` | Full system access | Complex builds requiring system packages |

## Environment Variables

```yaml
- uses: openai/codex-action@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    prompt: "..."
  env:
    # Babysitter configuration
    BABYSITTER_RUNS_SCOPE: repo
    BABYSITTER_MAX_ITERATIONS: 100
    BABYSITTER_QUALITY_THRESHOLD: 85
    BABYSITTER_LOG_LEVEL: debug
```

## Artifacts and Outputs

### Preserving Run State

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: .a5c/runs/
    retention-days: 7
```

### Codex Output

The action exposes a `final-message` output:

```yaml
- uses: openai/codex-action@v1
  id: codex
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    prompt: "..."

- name: Check results
  run: echo "${{ steps.codex.outputs.final-message }}"
```

## Best Practices

### 1. Choose the Right Sandbox Mode

Use the most restrictive sandbox that works for your task:
- `read-only` for reviews and analysis
- `workspace-write` for most development tasks
- `danger-full-access` only when system-level access is required

### 2. Set Reasonable Iteration Limits

```yaml
env:
  BABYSITTER_MAX_ITERATIONS: 50
```

### 3. Use Safety Strategies

Codex supports multiple safety strategies for sandboxed execution:

| Strategy | Description |
|----------|-------------|
| `drop-sudo` | Default; drops sudo privileges |
| `unprivileged-user` | Runs as unprivileged user |
| `read-only` | Read-only filesystem |
| `unsafe` | No sandboxing (not recommended) |

### 4. Handle Failures Gracefully

```yaml
- uses: openai/codex-action@v1
  id: codex
  continue-on-error: true
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    prompt: "..."

- name: Handle failure
  if: steps.codex.outcome == 'failure'
  run: echo "Codex run failed - check artifacts"
```

## Troubleshooting

### Babysitter CLI Not Found

Ensure the SDK is installed before the Codex step:

```yaml
- name: Install Babysitter SDK
  run: npm install -g @a5c-ai/babysitter-sdk @a5c-ai/babysitter-agent
```

### Sandbox Permission Errors

If Codex cannot write files, check the sandbox mode:
- Use `workspace-write` for tasks that modify code
- Use `danger-full-access` if system packages are needed

### Runs Timing Out

1. Reduce `BABYSITTER_MAX_ITERATIONS`
2. Use simpler methodology (GSD vs TDD)
3. Break task into smaller pieces

## Related Documentation

### Codex Action
- [Codex Action Repository](https://github.com/openai/codex-action)
- [OpenAI Codex CLI](https://github.com/openai/codex)

### Babysitter Plugin
- [Getting Started](./reference/GETTING_STARTED.md)
- [Process Selection Guide](https://github.com/a5c-ai/babysitter/blob/main/docs/reference/PROCESS_SELECTION.md)
- [Troubleshooting](https://github.com/a5c-ai/babysitter/blob/main/docs/reference/TROUBLESHOOTING.md)
