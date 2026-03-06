# GitHub Actions CI/CD — Install Instructions

Set up babysitter-powered GitHub Actions workflows that trigger on issue comments, PR events, and other git events. Based on the [official GitHub Actions setup guide](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup.md).

## Step 1: Interview the User

Ask which workflow triggers and templates to install:

### Trigger Types

1. **Issue Comment Handler** (recommended) — Responds to `@claude` mentions in issue comments and PR review comments. This is the most versatile trigger.
2. **PR Review Automation** — Automatically runs babysitter-orchestrated code review when PRs are opened, synchronized, or marked ready for review.
3. **Feature Development (TDD)** — Triggers on issues labeled `feature-request`, implements features using TDD Quality Convergence methodology.
4. **GSD Quick Tasks** — Triggers on `/gsd` commands in issue comments for rapid prototyping.
5. **Spec-Driven Development** — Manual dispatch workflow for implementing specifications with compliance tracking.
6. **Security Scanning** — Scheduled + manual SAST pipeline using babysitter security-compliance processes.
7. **Incident Response** — Triggers on issues labeled `incident`, executes incident response procedures.
8. **Architecture Documentation** — Triggers on code changes or manual dispatch, generates C4 architecture docs.
9. **All** — Install all workflow templates.

### Additional Options

Ask the user:
- Which branch should workflows target? (default: `main`)
- Should workflows create PRs automatically? (default: yes)
- What timeout should be set for workflow runs? (default: 30 minutes)
- Should `track_progress` be enabled for babysitter runs? (default: yes)

## Step 2: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

## Step 3: Create Workflow Files

Based on the user's selections, create the corresponding workflow YAML files. Each workflow uses the `anthropics/claude-code-action@v1` action with the babysitter plugin.

### Common Configuration Block

All workflows share this core configuration:

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v6
    with:
      fetch-depth: 1  # Use 0 for workflows that need git history

  - name: Run Claude Code with Babysitter
    uses: anthropics/claude-code-action@v1
    with:
      anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
      track_progress: true

      plugin_marketplaces: |
        https://github.com/a5c-ai/babysitter.git

      plugins: |
        babysitter@a5c.ai
```

### Workflow: Issue Comment Handler (`babysitter-issue-comment.yml`)

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
          plugin_marketplaces: |
            https://github.com/a5c-ai/babysitter.git
          plugins: |
            babysitter@a5c.ai
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

### Workflow: Security Scanning (`babysitter-security.yml`)

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

      - name: Run Babysitter SAST Pipeline
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

            Implement a SAST pipeline:
            - Code scanning with CodeQL or Semgrep
            - Dependency vulnerability scanning
            - Secret detection
            - Security findings reporting
            - Integration with GitHub Security tab
```

### Workflow: Incident Response (`babysitter-incident-response.yml`)

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

### Workflow: Architecture Documentation (`babysitter-arch-docs.yml`)

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

## Step 4: Configure GitHub Secrets

Instruct the user to add the following secret to their repository (Settings > Secrets and variables > Actions):

- **`ANTHROPIC_API_KEY`** — Their Anthropic API key for Claude Code

If not already configured, guide them to:
1. Go to `https://github.com/<owner>/<repo>/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: their Anthropic API key

## Step 5: Configure Environment Variables (Optional)

Create a `.github/babysitter.env` reference file documenting available environment variables:

```
# Babysitter Configuration for GitHub Actions
# Set these as env vars in your workflow YAML

# BABYSITTER_RUNS_DIR=.a5c/runs         # Runs directory (default: .a5c/runs)
# BABYSITTER_MAX_ITERATIONS=100          # Max iterations per run (default: 256)
# BABYSITTER_QUALITY_THRESHOLD=85        # Quality gate threshold (default: 80)
# BABYSITTER_LOG_LEVEL=debug             # Log level: info|debug|warn|error
```

## Step 6: Add Artifact Preservation

Add a workflow step to preserve babysitter run artifacts for debugging. Instruct the user to add this step at the end of each workflow:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: babysitter-runs
    path: .a5c/runs/
    retention-days: 7
```

## Step 7: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name github-actions-cicd --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 8: Verify Setup

After creating the workflow files:

1. Commit and push the `.github/workflows/` changes
2. Test the issue comment handler by creating an issue with `@claude` in the body
3. Verify the workflow triggers in the Actions tab
4. Check that babysitter plugin loads correctly in the action logs

## Reference

Full documentation: [https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup.md](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup.md)
