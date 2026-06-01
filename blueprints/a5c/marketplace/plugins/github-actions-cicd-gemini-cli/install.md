# GitHub Actions CI/CD (Gemini CLI) — Install Instructions

Set up babysitter-powered GitHub Actions workflows using [Google's Gemini CLI Action](https://github.com/google-github-actions/run-gemini-cli) that trigger on issue comments, PR events, and other git events. Based on the [official GitHub Actions setup guide for Gemini CLI](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-gemini-cli.md).

## Step 1: Interview the User

Ask which workflow triggers and templates to install:

### Trigger Types

1. **Issue Comment Handler** (recommended) — Responds to `@gemini` mentions in issue comments and PR review comments. This is the most versatile trigger.
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
- Which authentication method? (API key, Vertex AI, or GCP Workload Identity Federation)

## Step 2: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

## Step 3: Create Workflow Files

Based on the user's selections, create the corresponding workflow YAML files. Each workflow uses the `google-github-actions/run-gemini-cli@v1` action with the babysitter SDK installed as a build step.

### Common Configuration Block (API Key Auth)

All workflows share this core configuration:

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4
    with:
      fetch-depth: 1  # Use 0 for workflows that need git history

  - name: Install Babysitter SDK
    run: npm install -g @a5c-ai/babysitter-sdk

  - name: Run Gemini CLI with Babysitter
    uses: google-github-actions/run-gemini-cli@v1
    with:
      gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
```

### Common Configuration Block (GCP Workload Identity Federation)

For production workloads without stored secrets:

```yaml
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
```

**Note:** Unlike Claude Code, Gemini CLI does not have a native plugin marketplace. The babysitter CLI is installed via npm as a build step and is then available to Gemini during execution. Prompts should instruct Gemini that the `babysitter` CLI is available.

### Workflow: Issue Comment Handler (`babysitter-issue-comment.yml`)

```yaml
name: Gemini CLI with Babysitter

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]

jobs:
  gemini:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@gemini')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@gemini')) ||
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

      - name: Run Gemini CLI with Babysitter
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
```

### Workflow: PR Review (`babysitter-pr-review.yml`)

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

### Workflow: Feature Development TDD (`babysitter-feature-tdd.yml`)

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

### Workflow: GSD Quick Tasks (`babysitter-gsd.yml`)

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

### Workflow: Spec-Driven Development (`babysitter-spec-kit.yml`)

```yaml
name: Babysitter Spec-Kit (Gemini)

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
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Babysitter Spec-Kit
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          prompt: |
            You have the babysitter CLI available for orchestration.
            Implement the specification at ${{ inputs.spec_file }} using Spec-Kit methodology.

            Follow the spec-driven approach:
            1. Parse and validate the specification
            2. Generate implementation plan
            3. Implement with continuous spec validation
            4. Generate compliance report
```

### Workflow: Security Scanning (`babysitter-security.yml`)

```yaml
name: Babysitter Security Setup (Gemini)

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
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Babysitter SAST Pipeline
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          prompt: |
            You have the babysitter CLI available for orchestration.
            Use the security-compliance/sast-pipeline process.

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
name: Babysitter Incident Response (Gemini)

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
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Babysitter Incident Response
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          prompt: |
            You have the babysitter CLI available for orchestration.
            Use the devops-sre-platform/incident-response process.

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
name: Babysitter Architecture Docs (Gemini)

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
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Run Babysitter Architecture Documentation
        uses: google-github-actions/run-gemini-cli@v1
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          prompt: |
            You have the babysitter CLI available for orchestration.
            Use the technical-documentation/arch-docs-c4 process.

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

Instruct the user to add the appropriate secret to their repository (Settings > Secrets and variables > Actions):

### API Key Authentication
- **`GEMINI_API_KEY`** — Their Google Gemini API key

### GCP Workload Identity Federation (recommended for production)
No secrets needed. Instead, configure repository variables:
- **`GCP_WORKLOAD_IDENTITY_PROVIDER`** — Workload Identity Provider resource name
- **`GCP_PROJECT_ID`** — GCP project ID
- **`GCP_SERVICE_ACCOUNT`** — Service account email

Ensure the job has `id-token: write` permission for WIF.

If using API key auth, guide them to:
1. Go to `https://github.com/<owner>/<repo>/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `GEMINI_API_KEY`
4. Value: their Gemini API key

## Step 5: Configure Environment Variables (Optional)

Create a `.github/babysitter.env` reference file documenting available environment variables:

```
# Babysitter Configuration for GitHub Actions (Gemini CLI)
# Set these as env vars in your workflow YAML

# BABYSITTER_RUNS_DIR=.a5c/runs         # Runs directory (default: .a5c/runs)
# BABYSITTER_MAX_ITERATIONS=100          # Max iterations per run (default: 65000)
# BABYSITTER_QUALITY_THRESHOLD=85        # Quality gate threshold (default: 80)
# BABYSITTER_LOG_LEVEL=debug             # Log level: info|debug|warn|error
# BABYSITTER_EXTENSION_PATH=/usr/local/lib/node_modules/@a5c-ai/babysitter-gemini  # Gemini extension path
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
babysitter plugin:update-registry --plugin-name github-actions-cicd-gemini-cli --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 8: Verify Setup

After creating the workflow files:

1. Commit and push the `.github/workflows/` changes
2. Test the issue comment handler by creating an issue with `@gemini` in the body
3. Verify the workflow triggers in the Actions tab
4. Check that babysitter SDK is installed correctly in the action logs

## Reference

Full documentation: [https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-gemini-cli.md](https://github.com/a5c-ai/babysitter/blob/main/docs/github-actions-setup-gemini-cli.md)

