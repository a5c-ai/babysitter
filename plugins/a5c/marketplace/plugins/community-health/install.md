# community-health — Install Instructions

Install the full GitHub community health file set: `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SUPPORT.md`, `SECURITY.md`, `FUNDING.yml`, and a complete `.github/ISSUE_TEMPLATE/` directory. Fills every field in GitHub's Community Profile and helps newcomers contribute confidently.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check which community files already exist (`CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SUPPORT.md`, `SECURITY.md`, `FUNDING.yml`, `LICENSE`, `README.md`)
2. Inspect `.github/ISSUE_TEMPLATE/` for existing templates
3. Check `gh api repos/:owner/:repo/community/profile` score (GitHub's community health %)
4. Detect org-level defaults: `.github` org repo with shared health files (inherits if missing)
5. Detect project type: OSS library, internal tool, app, documentation site
6. Summarize findings to the user

### Stage 2: Files to Install

Ask which files to install (multi-select):

1. **CODE_OF_CONDUCT.md** — Contributor Covenant v2.1 (default)
2. **CONTRIBUTING.md** — How to contribute
3. **SUPPORT.md** — Where to ask questions
4. **SECURITY.md** — Vulnerability reporting policy
5. **FUNDING.yml** — Sponsor links (skip for internal/private repos)
6. **Issue templates** — bug, feature, question, security-link
7. **All** (default)

### Stage 3: Code of Conduct

Ask:
- Base: Contributor Covenant v2.1 (default) / Citizen Code of Conduct / custom
- Contact email for violations (required)
- Include enforcement ladder explanation? (default: yes — it's in v2.1 by default)

### Stage 4: Contribution Guide

Ask:
- Link to existing `DEVELOPING.md`? (if present)
- Include sections: setup, build, test, PR process, coding style, commit style
- Default PR review turnaround commitment? (`72h` default)
- DCO/CLA required? (default: no)

### Stage 5: Security Policy

Ask:
- Security contact email (required)
- Supported versions matrix (e.g. last 2 minor releases)
- Use GitHub Security Advisories? (default: yes)
- Bug bounty? (default: none)
- Disclosure timeline: 90 days (default) / 30 / 180

### Stage 6: Funding

Ask:
- Platforms: `github`, `open_collective`, `patreon`, `ko_fi`, `tidelift`, `custom` (URLs)
- Skip this file for internal/private repos

## Step 2: Install CODE_OF_CONDUCT.md

Create `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1):

```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity and
orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of positive behavior:
- Demonstrating empathy and kindness
- Being respectful of differing opinions
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing when we make mistakes
- Focusing on what is best for the community

Examples of unacceptable behavior:
- Harassment in any form
- Trolling, insulting, derogatory comments, personal/political attacks
- Publishing others' private information without permission
- Sexualized language or imagery, or unwelcome sexual attention

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards,
and will take appropriate and fair corrective action in response to any behavior
deemed inappropriate, threatening, offensive, or harmful.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
**<REPLACE_WITH_EMAIL>**.

All complaints will be reviewed and investigated promptly and fairly.

## Enforcement Guidelines

Community leaders will follow these Community Impact Guidelines:

### 1. Correction
**Community Impact**: Inappropriate language or unprofessional behavior.
**Consequence**: A private, written warning.

### 2. Warning
**Community Impact**: A violation through a single incident or series.
**Consequence**: A warning with consequences for continued behavior.

### 3. Temporary Ban
**Community Impact**: Serious violation of community standards.
**Consequence**: A temporary ban from any sort of interaction.

### 4. Permanent Ban
**Community Impact**: Demonstrating a pattern of violation.
**Consequence**: A permanent ban from any sort of public interaction.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
https://www.contributor-covenant.org/version/2/1/code_of_conduct.html

[homepage]: https://www.contributor-covenant.org
```

## Step 3: Install CONTRIBUTING.md

Create `CONTRIBUTING.md`:

```markdown
# Contributing

Thanks for your interest in contributing! This document describes the process
and standards we follow.

## Code of Conduct

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting Issues

- **Bugs**: use the [Bug Report template](../../issues/new?template=bug_report.yml)
- **Features**: use the [Feature Request template](../../issues/new?template=feature_request.yml)
- **Security**: do NOT open a public issue — see [SECURITY.md](SECURITY.md)

## Development Setup

```bash
git clone <repo>
cd <repo>
# Install dependencies
npm install        # or: pip install -e '.[dev]', go mod download
# Run tests
npm test           # or equivalent
```

## Making Changes

1. Fork and create a branch: `git checkout -b feat/my-change`
2. Write tests alongside your change
3. Keep commits small and use [Conventional Commits](https://www.conventionalcommits.org/)
4. Run linters and tests locally before pushing
5. Open a PR against `main` using the PR template

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## Review Process

- Maintainers aim to respond within 72 hours
- PRs require at least 1 approving review
- CI must pass before merge
- Squash-merge is the default

## Style Guide

- Follow the linters (`npm run lint`, `ruff`, `gofmt`, etc.)
- Prefer small, focused PRs
- Document user-visible changes in PR description; release notes auto-generate

## License

By contributing, you agree that your contributions will be licensed under the
project's [LICENSE](LICENSE).
```

## Step 4: Install SUPPORT.md

Create `SUPPORT.md`:

```markdown
# Getting Help

Thanks for using this project! Here's where to turn for help.

## Questions & Discussions

- **GitHub Discussions**: [discussions](../../discussions) — for questions, ideas, show-and-tell
- **Documentation**: [README](README.md) and [docs/](docs/)

## Bugs & Feature Requests

- File an issue using the appropriate [template](../../issues/new/choose)
- Please search existing issues before opening a new one

## Security Issues

Do not file security issues publicly. See [SECURITY.md](SECURITY.md).

## Commercial Support

<!-- If you offer paid support: -->
<!-- Commercial support is available via ... -->
<!-- If not, remove this section. -->

## What to Expect

- **Bug triage**: within 72 hours on business days
- **Feature discussion**: best-effort; please upvote existing requests if relevant
- **Security**: within 48 hours, see disclosure timeline in SECURITY.md
```

## Step 5: Install SECURITY.md

Create `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | yes |
| previous minor | yes |
| older   | no |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use GitHub's [private vulnerability reporting](../../security/advisories/new).

Alternatively, email **<REPLACE_WITH_SECURITY_EMAIL>** with:
- A description of the issue
- Steps to reproduce
- Impact assessment
- Suggested remediation (if any)

## Disclosure Timeline

- **Acknowledgement**: within 48 hours
- **Initial assessment**: within 5 business days
- **Fix target**: within 30 days for high/critical, 90 days for medium/low
- **Public disclosure**: coordinated via GitHub Security Advisory

We credit reporters in the advisory unless anonymity is requested.

## Out of Scope

- Vulnerabilities requiring social engineering of maintainers
- Denial of service via resource exhaustion with untrusted input
- Issues in dependencies — report upstream and notify us

## Safe Harbor

We support safe-harbor research that:
- Respects privacy of users
- Avoids degradation of service
- Reports in good faith via the channels above
```

## Step 6: Install FUNDING.yml (Optional)

Create `.github/FUNDING.yml`:

```yaml
# These are supported funding platforms
github: [your-org]
open_collective: your-collective
patreon: # ''
ko_fi: # ''
tidelift: # npm/your-package
custom: ['https://your-site.example/donate']
```

Skip this file for private/internal repos.

## Step 7: Install Issue Templates

Create `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Discussions
    url: https://github.com/<org>/<repo>/discussions
    about: Ask questions and discuss ideas
  - name: Security Vulnerabilities
    url: https://github.com/<org>/<repo>/security/advisories/new
    about: Report security issues privately
```

Create `.github/ISSUE_TEMPLATE/bug_report.yml`, `feature_request.yml`, and `question.yml` following the `pr-templates` plugin schema (see that plugin's install.md for full YAML). If `pr-templates` is already installed, skip this step.

## Step 8: Link Files from README

Add to the bottom of `README.md`:

```markdown
## Community

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Support](SUPPORT.md)
- [Security Policy](SECURITY.md)
```

## Step 9: Fill Placeholders

```bash
# Replace email placeholders before committing
sed -i.bak "s/<REPLACE_WITH_EMAIL>/conduct@example.org/g" CODE_OF_CONDUCT.md
sed -i.bak "s/<REPLACE_WITH_SECURITY_EMAIL>/security@example.org/g" SECURITY.md
rm -f CODE_OF_CONDUCT.md.bak SECURITY.md.bak
```

## Step 10: Verify Community Profile

```bash
gh api repos/:owner/:repo/community/profile --jq '.health_percentage, .files'
```

Target: `health_percentage: 100`.

## Step 11: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name community-health --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 12: Verify Setup

1. All six files exist at repo root (FUNDING.yml in `.github/`)
2. GitHub community health score is 100%
3. Issue templates appear when opening a new issue
4. Security advisory link works
5. README links to all community files
6. No placeholder strings left (`REPLACE_WITH_EMAIL`)

## Reference

- GitHub Community Profile: https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions
- Contributor Covenant: https://www.contributor-covenant.org/
- Private vulnerability reporting: https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability
- FUNDING.yml syntax: https://docs.github.com/en/repositories/managing-your-repositories-settings-and-security/customizing-your-repository/displaying-a-sponsor-button-in-your-repository
