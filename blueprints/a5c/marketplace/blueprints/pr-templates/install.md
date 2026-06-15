# pr-templates — Install Instructions

Install issue and PR templates, semantic-PR-title linting, and a PR-size labeler. Ensures every contribution arrives with consistent structure, a well-formed title, and automatic size categorization.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing templates at `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`
2. Check for existing semantic-PR config: `.github/workflows/*semantic*`
3. Check for labels in use: `gh label list --json name`
4. Detect conventional-commits usage (from `release-automation` plugin or commit history)
5. Summarize findings to the user

### Stage 2: Template Set

Ask which templates to install (multi-select):

1. **PR template** — single default template
2. **Multiple PR templates** — feature / bugfix / docs / chore (switch via query param)
3. **Issue forms** — YAML forms for bug report, feature request, question, security
4. **Discussion templates** — for GitHub Discussions (optional)
5. **All**

### Stage 3: PR Title Policy

Ask:
- Enforce conventional commits style in PR titles? (default: yes — if `release-automation` plugin is present)
- Allowed types: `feat,fix,docs,style,refactor,perf,test,build,ci,chore,revert`
- Require scope? (default: optional)
- Subject case: `lower-case` (default), `sentence-case`, any

### Stage 4: Size Labeling

Ask:
- Install PR-size labeler? (default: yes)
- Thresholds (lines changed):
  - `size/XS`: 0–9
  - `size/S`: 10–49
  - `size/M`: 50–199
  - `size/L`: 200–499
  - `size/XL`: 500+
- Exclude generated files (lock files, snapshots) from counts? (default: yes)

## Step 2: Install PR Template

Create `.github/pull_request_template.md`:

```markdown
## Summary

<!-- What does this PR do, and why? 1–3 bullets. -->

- 

## Related Issues

<!-- Closes #123, Relates to #456 -->

Closes #

## Changes

<!-- Bulleted list of notable changes -->

- 

## Test Plan

<!-- How did you verify this works? -->

- [ ] Unit tests added/updated
- [ ] Manual verification done (describe steps)
- [ ] Documentation updated (if user-facing)

## Screenshots / Recordings

<!-- UI changes? Attach before/after. Delete if not applicable. -->

## Risk & Rollback

<!-- What could break? How do we roll back? -->

- Risk:
- Rollback:

## Checklist

- [ ] PR title follows conventional-commits format (`feat:`, `fix:`, etc.)
- [ ] Breaking changes documented in PR description with `BREAKING CHANGE:` footer
- [ ] No secrets, tokens, or PII committed
```

## Step 3: Multi-Template Setup (Optional)

Create `.github/PULL_REQUEST_TEMPLATE/` directory with variants:

```
.github/PULL_REQUEST_TEMPLATE/
├── feature.md
├── bugfix.md
├── docs.md
└── chore.md
```

Users select via URL:

```
https://github.com/<org>/<repo>/compare/main...branch?template=feature.md
```

Example `.github/PULL_REQUEST_TEMPLATE/bugfix.md`:

```markdown
## Bug Description

## Root Cause

## Fix

## Regression Test

- [ ] Added a failing test before the fix
- [ ] Test now passes

## Affected Versions

Discovered in:
Fixed in:
```

## Step 4: Install Issue Forms

Create `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Security vulnerabilities
    url: https://github.com/<org>/<repo>/security/advisories/new
    about: Please report security issues privately
  - name: Questions and discussions
    url: https://github.com/<org>/<repo>/discussions
    about: Ask questions in Discussions, not Issues
```

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug Report
description: Report a reproducible bug
labels: [bug, needs-triage]
body:
  - type: markdown
    attributes:
      value: Thanks for filing a bug! Please search existing issues first.
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      placeholder: Describe the bug
    validations: { required: true }
  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction steps
      value: |
        1.
        2.
        3.
    validations: { required: true }
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations: { required: true }
  - type: input
    id: version
    attributes:
      label: Version
      placeholder: e.g. 1.2.3
    validations: { required: true }
  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options: [minor, moderate, serious, critical]
    validations: { required: true }
  - type: textarea
    id: logs
    attributes:
      label: Logs / stack traces
      render: shell
```

Create `.github/ISSUE_TEMPLATE/feature_request.yml`:

```yaml
name: Feature Request
description: Propose a new feature or enhancement
labels: [enhancement, needs-triage]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What user problem does this solve?
    validations: { required: true }
  - type: textarea
    id: solution
    attributes:
      label: Proposed solution
    validations: { required: true }
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
  - type: checkboxes
    id: contribute
    attributes:
      label: Willing to contribute?
      options:
        - label: I'm willing to open a PR
```

## Step 5: Install Semantic-PR Title Lint

Create `.github/workflows/pr-title.yml`:

```yaml
name: PR Title
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
permissions:
  pull-requests: read
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
          requireScope: false
          subjectPattern: '^(?![A-Z]).+$'
          subjectPatternError: |
            The subject "{subject}" should start with a lower-case letter.
          wip: true
```

## Step 6: Install PR-Size Labeler

Create `.github/workflows/pr-size.yml`:

```yaml
name: PR Size
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  pull-requests: write
  contents: read
jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_label: 'size/XS'
          xs_max_size: '9'
          s_label: 'size/S'
          s_max_size: '49'
          m_label: 'size/M'
          m_max_size: '199'
          l_label: 'size/L'
          l_max_size: '499'
          xl_label: 'size/XL'
          fail_if_xl: 'false'
          message_if_xl: |
            This PR exceeds 500 lines. Consider splitting it.
          files_to_ignore: |
            package-lock.json
            pnpm-lock.yaml
            yarn.lock
            go.sum
            poetry.lock
            __snapshots__/
            *.snap
```

## Step 7: Seed Labels

```bash
gh label create "size/XS" --color "00ff00" --description "0-9 lines"
gh label create "size/S" --color "80ff00" --description "10-49 lines"
gh label create "size/M" --color "ffff00" --description "50-199 lines"
gh label create "size/L" --color "ff8000" --description "200-499 lines"
gh label create "size/XL" --color "ff0000" --description "500+ lines"
gh label create "needs-triage" --color "ededed" --description "Awaiting triage"
```

Or commit a script `scripts/seed-labels.sh` for reproducibility.

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name pr-templates --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. Opening a new PR shows the default template
2. URL with `?template=bugfix.md` loads the bugfix variant
3. PR title `bad title` fails the semantic-PR workflow; `feat: add thing` passes
4. A 400-line diff receives `size/L` automatically
5. `.github/ISSUE_TEMPLATE/config.yml` hides blank issues and shows contact links
6. Issue forms validate required fields

## Reference

- GitHub issue forms: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests
- amannn/action-semantic-pull-request: https://github.com/amannn/action-semantic-pull-request
- codelytv/pr-size-labeler: https://github.com/CodelyTV/pr-size-labeler
- Conventional Commits: https://www.conventionalcommits.org/
