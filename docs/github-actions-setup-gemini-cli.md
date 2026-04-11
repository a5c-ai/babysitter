# Using Babysitter with Gemini CLI GitHub Actions

This guide explains how to integrate the Babysitter plugin with [Google's Gemini CLI GitHub Action](https://github.com/google-github-actions/run-gemini-cli) for automated orchestration workflows in your CI/CD pipeline.

## Overview

The Babysitter plugin enables deterministic, event-sourced workflow orchestration for Gemini CLI. When combined with GitHub Actions, you can automate complex multi-step development processes with quality gates, human approval checkpoints, and iterative refinement.

Gemini CLI uses the `google-github-actions/run-gemini-cli@v1` action, which supports multiple authentication methods including API keys, Vertex AI, and GCP Workload Identity Federation.

## Quick Start

### Basic Setup (API Key)

```yaml
name: Gemini CLI with Babysitter

on:
  issue_comment:
    types: [created]
  issues:
    types: [opened, assigned]

jobs:
  gemini:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@gemini')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@gemini'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Install Babysitter Gemini Extension
        run: |
          npm install -g @a5c-ai/babysitter-gemini
          echo "BABYSITTER_EXTENSION_PATH=$(npm root -g)/@a5c-ai/babysitter-gemini" >> "$GITHUB_ENV"

      - name: Run Gemini CLI with Babysitter
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          extensions: '["@a5c-ai/babysitter-gemini"]'
          prompt: |
            You have the babysitter CLI available for orchestration.

            ${{ github.event.comment.body || github.event.issue.body }}
```

### Setup with GCP Workload Identity Federation

For production workloads using Vertex AI:

```yaml
jobs:
  gemini:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write  # Required for WIF
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Gemini CLI with Babysitter
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gcp_workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          gcp_project_id: ${{ vars.GCP_PROJECT_ID }}
          gcp_service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}
          use_vertex_ai: "true"
          prompt: "Your task description"
```

For comprehensive setup instructions, see the [Gemini CLI Action README](https://github.com/google-github-actions/run-gemini-cli).

## Configuration Options

### Gemini CLI Action Parameters

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    # Authentication (choose one method)
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}           # Simple API key
    # -- OR GCP Workload Identity Federation: --
    gcp_workload_identity_provider: "projects/.../providers/..."
    gcp_project_id: "my-project"
    gcp_service_account: "sa@my-project.iam.gserviceaccount.com"
    use_vertex_ai: "false"                                  # Use Vertex AI backend

    # Task
    prompt: "Your task description"

    # Optional
    gemini_model: ""                                        # Model override
    gemini_cli_version: "latest"                            # latest | preview | nightly | semver
    settings: '{"codeExecution": true}'                     # JSON settings for .gemini/settings.json
    extensions: '["@google/tool-name"]'                     # JSON array of extensions to install
    gemini_debug: "false"                                   # Enable debug logging + streaming
    upload_artifacts: "false"                                # Upload stdout/stderr as artifacts

    # GitHub context (auto-detected)
    github_pr_number: ""
    github_issue_number: ""
```

### Babysitter Extension

The Babysitter Gemini extension provides hooks and commands within the Gemini CLI session:

```yaml
- name: Install Babysitter Gemini Extension
  run: npm install -g @a5c-ai/babysitter-gemini

- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    extensions: '["@a5c-ai/babysitter-gemini"]'
```

## Workflow Examples

### Example 1: PR Review with Quality Gates

```yaml
name: Babysitter PR Review (Gemini)

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Babysitter PR Review
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          prompt: |
            You have the babysitter CLI available for orchestration.
            Orchestrate a thorough code review using TDD Quality Convergence methodology.

            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Analyze the PR changes for:
            - Code quality and best practices
            - Security vulnerabilities
            - Performance implications
            - Test coverage
```

### Example 2: Feature Development with TDD

```yaml
name: Babysitter TDD Feature (Gemini)

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
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Babysitter TDD
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
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
name: Babysitter GSD (Gemini)

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
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Babysitter GSD
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          prompt: |
            You have the babysitter CLI available.
            Use GSD methodology for the following task:

            ${{ github.event.comment.body }}

            Focus on rapid, working implementation with minimal overhead.
```

### Example 4: With Gemini CLI Settings

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    settings: |
      {
        "codeExecution": true,
        "sandbox": true
      }
    prompt: "Implement and test the feature"
```

## Authentication Methods

Gemini CLI supports three authentication approaches:

| Method | When to Use | Required Fields |
|--------|-------------|-----------------|
| API Key | Simple setups, personal projects | `gemini_api_key` |
| Vertex AI | Enterprise, GCP-integrated | `google_api_key` + `use_vertex_ai: true` |
| Workload Identity Federation | Production CI/CD, no secrets needed | `gcp_workload_identity_provider`, `gcp_project_id`, `gcp_service_account` |

## Environment Variables

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    prompt: "..."
  env:
    # Babysitter configuration
    BABYSITTER_RUNS_DIR: .a5c/runs
    BABYSITTER_MAX_ITERATIONS: 100
    BABYSITTER_QUALITY_THRESHOLD: 85
    BABYSITTER_LOG_LEVEL: debug
    BABYSITTER_EXTENSION_PATH: /usr/local/lib/node_modules/@a5c-ai/babysitter-gemini
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

### Gemini CLI Outputs

The action exposes `summary` and `error` outputs:

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  id: gemini
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    prompt: "..."

- name: Check results
  run: echo "${{ steps.gemini.outputs.summary }}"
```

### Built-in Artifact Upload

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    upload_artifacts: "true"
    prompt: "..."
```

## Best Practices

### 1. Use Workload Identity Federation in Production

Avoid storing API keys as secrets when possible. WIF is more secure and doesn't require secret rotation.

### 2. Set Reasonable Iteration Limits

```yaml
env:
  BABYSITTER_MAX_ITERATIONS: 50
```

### 3. Enable Debug Logging for Troubleshooting

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  with:
    gemini_debug: "true"
    upload_artifacts: "true"
```

### 4. Handle Failures Gracefully

```yaml
- uses: google-github-actions/run-gemini-cli@v1
  id: gemini
  continue-on-error: true
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    prompt: "..."

- name: Handle failure
  if: steps.gemini.outcome == 'failure'
  run: echo "Gemini CLI run failed - check artifacts"
```

## Troubleshooting

### Babysitter CLI Not Found

Ensure the SDK is installed before the Gemini CLI step:

```yaml
- name: Install Babysitter SDK
  run: npm install -g @a5c-ai/babysitter-sdk
```

### Authentication Failures

1. For API key auth: verify `GEMINI_API_KEY` secret is set
2. For WIF: ensure `id-token: write` permission is in the job
3. For Vertex AI: verify project ID and service account

### Runs Timing Out

1. Reduce `BABYSITTER_MAX_ITERATIONS`
2. Use simpler methodology (GSD vs TDD)
3. Break task into smaller pieces

## Related Documentation

### Gemini CLI Action
- [Gemini CLI Action Repository](https://github.com/google-github-actions/run-gemini-cli)
- [GitHub Marketplace](https://github.com/marketplace/actions/run-gemini-cli)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)

### Babysitter Plugin
- [Getting Started](../plugins/babysitter/GETTING_STARTED.md)
- [Process Selection Guide](../plugins/babysitter/PROCESS_SELECTION.md)
- [Troubleshooting](../plugins/babysitter/TROUBLESHOOTING.md)
