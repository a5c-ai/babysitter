# Using Babysitter with Claude Code GitHub Actions

This guide explains how to integrate the Babysitter plugin with [Claude Code GitHub Actions](https://github.com/anthropics/claude-code-action) for automated orchestration workflows in your CI/CD pipeline.

## Overview

The Babysitter plugin enables deterministic, event-sourced workflow orchestration for Claude Code. When combined with GitHub Actions, you can automate complex multi-step development processes with quality gates, human approval checkpoints, and iterative refinement.

## Quick Start

### Basic Setup

Add the Babysitter plugin to your GitHub Actions workflow:

```yaml
name: Claude Code with Babysitter

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@claude'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 1

      - name: Run Claude Code with Babysitter
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          # Add the Babysitter plugin marketplace
          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          # Install the Babysitter plugin
          plugins: |
            babysitter@a5c.ai
```

For comprehensive setup instructions, see the [Claude Code Action Setup Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md).

## Configuration Options

### Plugin Marketplace

The Babysitter plugin is available from the a5c.ai marketplace:

```yaml
plugin_marketplaces: |
  https://github.com/a5c-ai/babysitter.git
```

### Plugin Installation

Install the plugin using its marketplace identifier:

```yaml
plugins: |
  babysitter@a5c.ai
```

## Workflow Examples

See the [official Claude Code Action examples](https://github.com/anthropics/claude-code-action/tree/main/examples) for additional workflow patterns.

### Example 1: PR Review with Quality Gates

Use Babysitter to orchestrate comprehensive PR reviews with progress tracking:

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
        uses: actions/checkout@v6
        with:
          fetch-depth: 1

      - name: Run Babysitter PR Review
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call orchestrate a thorough code review using TDD Quality Convergence methodology.

            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Analyze the PR changes for:
            - Code quality and best practices
            - Security vulnerabilities
            - Performance implications
            - Test coverage

            Generate a structured review report with:
            - Summary of changes
            - Issues found (critical, warning, info)
            - Recommendations
```

### Example 2: Feature Development with TDD

Automate test-driven development when issues are labeled:

```yaml
name: Babysitter TDD Feature

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
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run Babysitter TDD
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call implement the feature described in this issue using TDD Quality Convergence methodology.

            REPO: ${{ github.repository }}
            ISSUE NUMBER: ${{ github.event.issue.number }}

            The process should:
            1. Write failing tests first
            2. Implement minimal code to pass tests
            3. Refactor for quality
            4. Iterate until 80% quality threshold is met

            Create a PR when complete.
```

### Example 3: Spec-Driven Development

For projects with governance requirements using manual dispatch:

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
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run Babysitter Spec-Kit
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call implement the specification at ${{ inputs.spec_file }} using Spec-Kit methodology.

            Follow the spec-driven approach:
            1. Parse and validate the specification
            2. Generate implementation plan
            3. Implement with continuous spec validation
            4. Generate compliance report
```

### Example 4: GSD Quick Tasks

For rapid prototyping triggered by issue comments:

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
        uses: actions/checkout@v6
        with:
          fetch-depth: 1

      - name: Run Babysitter GSD
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          allowed_non_write_users: "*"
          github_token: ${{ secrets.GITHUB_TOKEN }}

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call use GSD methodology for the following task:

            ${{ github.event.comment.body }}

            Focus on rapid, working implementation with minimal overhead.
```

## Process Library Examples

Babysitter includes a comprehensive process library with specialized processes for different domains. Use the `specializations/<domain>/<process>` syntax to invoke specific processes.

### Available Specializations

| Specialization | Description | Example Processes |
|----------------|-------------|-------------------|
| `devops-sre-platform` | DevOps, SRE, Platform Engineering | cicd-pipeline-setup, kubernetes-setup, incident-response |
| `qa-testing-automation` | Testing and Quality Assurance | automation-framework, e2e-test-suite, performance-testing |
| `security-compliance` | Security and Compliance | sast-pipeline, penetration-testing, gdpr-compliance |
| `data-science-ml` | Data Science and Machine Learning | ml-project-scoping, model-training-pipeline, feature-engineering |
| `data-engineering-analytics` | Data Engineering | etl-pipeline, data-warehouse, streaming-analytics |
| `technical-documentation` | Documentation | adr-docs, runbook-docs, arch-docs-c4 |
| `ux-ui-design` | UX/UI Design | design-system, accessibility-audit, usability-testing |
| `software-architecture` | Architecture | microservices-design, api-design, system-design |

### Example 5: CI/CD Pipeline Setup

Orchestrate a complete CI/CD pipeline implementation:

```yaml
name: Babysitter CI/CD Setup

on:
  workflow_dispatch:
    inputs:
      target_environment:
        description: 'Target environment (dev, staging, prod)'
        required: true
        type: choice
        options:
          - dev
          - staging
          - prod

jobs:
  setup-cicd:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run Babysitter CI/CD Pipeline Setup
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call use specializations/devops-sre-platform/cicd-pipeline-setup process.

            REPO: ${{ github.repository }}
            TARGET ENVIRONMENT: ${{ inputs.target_environment }}

            Set up a complete CI/CD pipeline with:
            - Build and test stages
            - Security scanning (SAST, dependency scanning)
            - Artifact management
            - Deployment to ${{ inputs.target_environment }}
            - Rollback capabilities
```

### Example 6: Test Automation Framework

Orchestrate a comprehensive test automation framework setup:

```yaml
name: Babysitter Test Automation

on:
  issues:
    types: [labeled]

jobs:
  setup-automation:
    if: github.event.label.name == 'setup-testing'
    runs-on: ubuntu-latest
    timeout-minutes: 60
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run Babysitter Test Automation Setup
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call use specializations/qa-testing-automation/automation-framework process.

            REPO: ${{ github.repository }}
            ISSUE NUMBER: ${{ github.event.issue.number }}

            Set up a test automation framework with:
            - Page Object Model architecture
            - Unit, integration, and E2E test structure
            - CI/CD pipeline integration
            - Test reporting and metrics
            - Cross-browser testing support

            Create a PR with the framework implementation.
```

### Example 7: Security Compliance (SAST Pipeline)

Automate security scanning pipeline setup:

```yaml
name: Babysitter Security Setup

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  security-setup:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write
      pull-requests: write
      security-events: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run Babysitter SAST Pipeline Setup
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call use specializations/security-compliance/sast-pipeline process.

            REPO: ${{ github.repository }}

            Implement a SAST (Static Application Security Testing) pipeline:
            - Code scanning with CodeQL or Semgrep
            - Dependency vulnerability scanning
            - Secret detection
            - Security findings reporting
            - Integration with GitHub Security tab
```

### Example 8: ML Model Training Pipeline

Orchestrate ML model training workflows:

```yaml
name: Babysitter ML Training

on:
  workflow_dispatch:
    inputs:
      model_type:
        description: 'Model type'
        required: true
        type: string
      dataset_path:
        description: 'Path to training dataset'
        required: true
        type: string

jobs:
  ml-training:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run Babysitter ML Training Pipeline
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call use specializations/data-science-ml/model-training-pipeline process.

            REPO: ${{ github.repository }}
            MODEL TYPE: ${{ inputs.model_type }}
            DATASET: ${{ inputs.dataset_path }}

            Implement a model training pipeline:
            - Data validation and preprocessing
            - Feature engineering
            - Model training with hyperparameter tuning
            - Model evaluation and metrics
            - Artifact storage and versioning
            - Experiment tracking
```

### Example 9: Incident Response Automation

Automate incident response procedures:

```yaml
name: Babysitter Incident Response

on:
  issues:
    types: [opened, labeled]

jobs:
  incident-response:
    if: contains(github.event.issue.labels.*.name, 'incident')
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 1

      - name: Run Babysitter Incident Response
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call use specializations/devops-sre-platform/incident-response process.

            REPO: ${{ github.repository }}
            INCIDENT ISSUE: ${{ github.event.issue.number }}
            INCIDENT TITLE: ${{ github.event.issue.title }}

            Execute incident response procedure:
            - Analyze the incident description
            - Identify affected systems and severity
            - Generate investigation runbook
            - Create communication templates
            - Document timeline and action items
```

### Example 10: Architecture Documentation

Generate architecture documentation using C4 model:

```yaml
name: Babysitter Architecture Docs

on:
  workflow_dispatch:
  push:
    paths:
      - 'src/**'
      - 'packages/**'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run Babysitter Architecture Documentation
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: true

          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git

          plugins: |
            babysitter@a5c.ai

          prompt: |
            /babysitter:call use specializations/technical-documentation/arch-docs-c4 process.

            REPO: ${{ github.repository }}

            Generate architecture documentation:
            - C4 model diagrams (Context, Container, Component)
            - System overview and dependencies
            - Data flow documentation
            - API documentation
            - Update docs/ directory with generated content

            Create a PR with the documentation updates.
```

## Environment Variables

Configure Babysitter behavior through environment variables:

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

    plugin_marketplaces: |
      https://github.com/a5c-ai/babysitter.git

    plugins: |
      babysitter@a5c.ai

  env:
    # Configure runs directory
    BABYSITTER_RUNS_DIR: .a5c/runs

    # Set maximum iterations (default: 256)
    BABYSITTER_MAX_ITERATIONS: 100

    # Set quality threshold (default: 80)
    BABYSITTER_QUALITY_THRESHOLD: 85

    # Enable verbose logging
    BABYSITTER_LOG_LEVEL: debug
```

## Artifacts and Outputs

### Preserving Run State

Save Babysitter run artifacts for debugging:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: .a5c/runs/
    retention-days: 7
```

### Run Outputs

Access run results in subsequent steps:

```yaml
- uses: anthropics/claude-code-action@v1
  id: babysitter
  with:
    # ... configuration ...

- name: Check results
  run: |
    echo "Run completed"
    ls -la .a5c/runs/
```

## Best Practices

### 1. Pin Plugin Versions

For reproducible builds, consider pinning to specific versions:

```yaml
plugins: |
  babysitter@a5c.ai@4.0.128
```

### 2. Set Reasonable Iteration Limits

Prevent runaway workflows:

```yaml
env:
  BABYSITTER_MAX_ITERATIONS: 50
```

### 3. Use Appropriate Methodologies

| Use Case | Methodology |
|----------|-------------|
| Quick prototypes | GSD |
| Quality-focused | TDD Quality Convergence |
| Compliance required | Spec-Kit |
| Team coordination | Scrum/Agile |

### 4. Handle Failures Gracefully

```yaml
- uses: anthropics/claude-code-action@v1
  id: babysitter
  continue-on-error: true
  with:
    # ... configuration ...

- name: Handle failure
  if: steps.babysitter.outcome == 'failure'
  run: |
    echo "Babysitter run failed - check artifacts"
```

## Troubleshooting

### Plugin Not Loading

1. Verify marketplace URL is accessible
2. Check plugin name spelling
3. Review action logs for installation errors

### Runs Timing Out

1. Reduce `BABYSITTER_MAX_ITERATIONS`
2. Use simpler methodology (GSD vs TDD)
3. Break task into smaller pieces

### Permission Errors

Ensure workflow has required permissions:

```yaml
permissions:
  contents: write      # For commits
  pull-requests: write # For PR comments
  issues: write        # For issue comments
```

## Related Documentation

### Claude Code Action
- [Setup Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md) - Complete setup instructions
- [Workflow Examples](https://github.com/anthropics/claude-code-action/tree/main/examples) - Official workflow examples
- [Claude Code Action Repository](https://github.com/anthropics/claude-code-action)

### Babysitter Plugin
- [Getting Started](../plugins/babysitter/GETTING_STARTED.md)
- [Process Selection Guide](../plugins/babysitter/PROCESS_SELECTION.md)
- [Troubleshooting](../plugins/babysitter/TROUBLESHOOTING.md)
