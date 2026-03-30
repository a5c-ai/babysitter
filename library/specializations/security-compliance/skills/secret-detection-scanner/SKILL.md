---
name: secret-detection-scanner
description: Detect secrets, credentials, and sensitive data in code and configurations. Scan git history for secrets, detect API keys, tokens, passwords, check environment files, monitor CI/CD logs for exposure, generate remediation steps, and track secret rotation status.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: security-testing
  backlog-id: SK-SEC-007
---

# secret-detection-scanner

You are **secret-detection-scanner** - a specialized skill for detecting secrets, credentials, and sensitive data in code, configurations, and git history. This skill provides comprehensive capabilities for preventing secret exposure and managing credential security.

## Overview

This skill enables AI-powered secret detection including:
- Gitleaks secret scanning in code and git history
- TruffleHog deep commit scanning
- detect-secrets baseline management
- API key, token, and password detection
- Pre-commit hook integration
- CI/CD pipeline secret monitoring
- Remediation guidance and rotation tracking

## Prerequisites

- Git repository to scan
- CLI tools: gitleaks, trufflehog, detect-secrets (as needed)
- Git for history scanning
- Pre-commit framework (optional)

## Capabilities

### 1. Gitleaks Secret Scanning

Fast and comprehensive secret detection:

```bash
# Scan current directory
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Scan with verbose output
gitleaks detect --source . -v --report-format json --report-path gitleaks-report.json

# Scan git history
gitleaks detect --source . --log-opts="--all" --report-format json

# Scan specific commits
gitleaks detect --source . --log-opts="HEAD~10..HEAD" --report-format json

# Scan with custom config
gitleaks detect --source . --config .gitleaks.toml --report-format json

# Scan staged files only (pre-commit)
gitleaks protect --source . --staged --report-format json

# Scan specific branch
gitleaks detect --source . --log-opts="origin/main..HEAD" --report-format json

# Generate SARIF output for GitHub
gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif
```

#### Gitleaks Configuration

```toml
# .gitleaks.toml
[extend]
useDefault = true

[allowlist]
description = "Global allowlist"
paths = [
    '''\.gitleaks\.toml$''',
    '''(.*?)(test|spec|mock)(.*)''',
    '''vendor/''',
    '''node_modules/''',
]

# Custom rule for internal API keys
[[rules]]
id = "internal-api-key"
description = "Internal API Key"
regex = '''INTERNAL_API_KEY\s*=\s*['"]([a-zA-Z0-9]{32})['"]'''
tags = ["internal", "api-key"]
keywords = ["INTERNAL_API_KEY"]

# Allowlist specific findings
[[rules.allowlist]]
regexes = ['''test-api-key-12345''']
```

### 2. TruffleHog Deep Scanning

Comprehensive entropy and pattern-based detection:

```bash
# Scan filesystem
trufflehog filesystem . --json > trufflehog-results.json

# Scan git repository
trufflehog git file://. --json > trufflehog-git.json

# Scan remote git repository
trufflehog git https://github.com/org/repo.git --json

# Scan specific branch
trufflehog git file://. --branch main --json

# Scan with only verified results
trufflehog git file://. --only-verified --json

# Scan GitHub organization
trufflehog github --org myorg --json

# Scan S3 bucket
trufflehog s3 --bucket mybucket --json

# Include archived repos
trufflehog github --org myorg --include-archived --json
```

#### TruffleHog Detectors

| Category | Secrets Detected |
|----------|------------------|
| Cloud Providers | AWS, GCP, Azure credentials |
| Version Control | GitHub, GitLab tokens |
| Communication | Slack, Discord, Twilio |
| Payment | Stripe, PayPal, Square |
| Database | MongoDB, PostgreSQL, Redis |
| AI/ML | OpenAI, Anthropic, HuggingFace |
| General | Private keys, JWT, OAuth |

### 3. detect-secrets Baseline Management

Baseline-driven secret detection with audit trail:

```bash
# Create baseline
detect-secrets scan > .secrets.baseline

# Scan with existing baseline
detect-secrets scan --baseline .secrets.baseline

# Audit baseline (interactive)
detect-secrets audit .secrets.baseline

# Update baseline
detect-secrets scan --baseline .secrets.baseline --update

# Scan specific files
detect-secrets scan src/ tests/ --baseline .secrets.baseline

# Use specific plugins
detect-secrets scan --list-all-plugins
detect-secrets scan --no-keyword-scan --no-base64-string-scan
```

#### Baseline File Schema

```json
{
  "version": "1.4.0",
  "plugins_used": [
    {"name": "AWSKeyDetector"},
    {"name": "ArtifactoryDetector"},
    {"name": "Base64HighEntropyString", "limit": 4.5},
    {"name": "BasicAuthDetector"},
    {"name": "PrivateKeyDetector"}
  ],
  "filters_used": [
    {"path": "detect_secrets.filters.allowlist.is_line_allowlisted"},
    {"path": "detect_secrets.filters.common.is_ignored_due_to_verification_policies"}
  ],
  "results": {
    "config/settings.py": [
      {
        "type": "Secret Keyword",
        "filename": "config/settings.py",
        "hashed_secret": "abc123...",
        "is_verified": false,
        "line_number": 42
      }
    ]
  }
}
```

### 4. Pre-commit Integration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  - repo: https://github.com/trufflesecurity/trufflehog
    rev: v3.63.0
    hooks:
      - id: trufflehog
```

Install and run:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually on all files
pre-commit run --all-files
```

### 5. CI/CD Integration

#### GitHub Actions

```yaml
name: Secret Scan
on: [push, pull_request]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

  trufflehog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified
```

#### GitLab CI

```yaml
secret-scan:
  image: zricethezav/gitleaks:latest
  script:
    - gitleaks detect --source . --report-format json --report-path gitleaks-report.json
  artifacts:
    reports:
      secret_detection: gitleaks-report.json
```

### 6. Secret Categories and Patterns

| Category | Examples | Risk Level |
|----------|----------|------------|
| Cloud Credentials | AWS_SECRET_ACCESS_KEY, GCP service account | Critical |
| API Keys | OpenAI, Stripe, SendGrid | High |
| Database | Connection strings, passwords | Critical |
| Private Keys | RSA, SSH, PGP | Critical |
| OAuth/JWT | Bearer tokens, refresh tokens | High |
| Internal | Internal API keys, service tokens | Medium |
| Generic | High-entropy strings | Low-Medium |

### 7. Remediation Workflow

When a secret is detected:

```bash
# 1. Identify affected commits
gitleaks detect --source . --log-opts="--all" -v

# 2. Revoke the secret immediately
# (Provider-specific - AWS console, GitHub settings, etc.)

# 3. Remove from git history (if needed)
# Option A: BFG Repo Cleaner
bfg --delete-files secrets.txt
bfg --replace-text passwords.txt

# Option B: git filter-repo
git filter-repo --path secrets.txt --invert-paths

# 4. Force push (with team coordination)
git push origin --force --all

# 5. Generate new credentials
# (Provider-specific)

# 6. Update deployment
# Update environment variables, secrets managers, etc.

# 7. Add to allowlist if false positive
# Update .gitleaks.toml or .secrets.baseline
```

### 8. Secret Rotation Tracking

```json
{
  "secrets_inventory": [
    {
      "id": "aws-prod-key",
      "type": "AWS_ACCESS_KEY",
      "environment": "production",
      "created_at": "2025-07-01T00:00:00Z",
      "last_rotated": "2025-12-01T00:00:00Z",
      "rotation_policy_days": 90,
      "next_rotation": "2026-03-01T00:00:00Z",
      "status": "valid",
      "storage": "AWS Secrets Manager"
    }
  ],
  "rotation_schedule": {
    "critical": 30,
    "high": 60,
    "medium": 90,
    "low": 180
  }
}
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| sast-mcp | TruffleHog, Gitleaks integration | [GitHub](https://github.com/Sengtocxoen/sast-mcp) |
| SecOpsAgentKit secrets-gitleaks | Gitleaks credential detection | [GitHub](https://github.com/AgentSecOps/SecOpsAgentKit) |
| Offensive-MCP-AI | DevSecOps secret detection | [GitHub](https://github.com/cybersecurityup/offensive-mcp-ai) |

## Best Practices

### Prevention

1. **Pre-commit hooks** - Block secrets before commit
2. **Environment variables** - Never hardcode secrets
3. **Secret managers** - Use Vault, AWS Secrets Manager, etc.
4. **.gitignore** - Exclude sensitive files
5. **Education** - Train developers on secure practices

### Detection

1. **Scan regularly** - Daily/weekly full scans
2. **CI/CD integration** - Scan on every PR
3. **Git history** - Don't forget historical commits
4. **Multiple tools** - Different tools catch different patterns
5. **Baseline management** - Track known false positives

### Response

1. **Immediate revocation** - Rotate exposed secrets
2. **Audit impact** - Check for unauthorized access
3. **Clean history** - Remove from git if needed
4. **Document** - Track incidents for compliance

## Process Integration

This skill integrates with the following processes:
- `secret-management.js` - Overall secret lifecycle
- `devsecops-pipeline.js` - DevSecOps automation
- `sast-pipeline.js` - SAST integration
- `incident-response.js` - Security incident handling

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "secret-scan",
  "status": "completed",
  "scan_type": "full-history",
  "tools_used": ["gitleaks", "trufflehog"],
  "scan_duration_seconds": 45,
  "summary": {
    "total_findings": 12,
    "by_severity": {
      "critical": 2,
      "high": 5,
      "medium": 3,
      "low": 2
    },
    "by_type": {
      "AWS_ACCESS_KEY": 1,
      "GITHUB_TOKEN": 2,
      "GENERIC_API_KEY": 5,
      "PRIVATE_KEY": 1,
      "HIGH_ENTROPY": 3
    },
    "verified": 3,
    "unverified": 9
  },
  "critical_findings": [
    {
      "type": "AWS_ACCESS_KEY",
      "file": "config/aws.py",
      "line": 15,
      "commit": "abc123",
      "author": "dev@example.com",
      "date": "2025-06-15",
      "verified": true,
      "redacted_value": "AKIA***************",
      "remediation": "Rotate AWS access key immediately via IAM console"
    }
  ],
  "artifacts": ["gitleaks-report.json", "trufflehog-results.json"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `No git repository` | Not in git repo | Initialize or specify path |
| `Baseline mismatch` | Outdated baseline | Update baseline file |
| `Too many findings` | No exclusions | Configure allowlists |
| `Verification failed` | Network/API issues | Check connectivity |

## Constraints

- Never log or display actual secret values
- Always redact findings in reports
- Coordinate with teams before history rewrites
- Document all remediation actions
- Track rotation schedules for compliance
