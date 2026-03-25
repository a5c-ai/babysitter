# Secret Detection Scanner Skill

## Overview

The `secret-detection-scanner` skill provides comprehensive detection of secrets, credentials, and sensitive data in code and configurations. It enables AI-powered scanning using Gitleaks, TruffleHog, and detect-secrets with pre-commit integration, CI/CD automation, and remediation guidance.

## Quick Start

### Prerequisites

1. **Gitleaks** - Fast secret scanner
   ```bash
   brew install gitleaks
   # or
   docker pull zricethezav/gitleaks:latest
   ```

2. **TruffleHog** - Deep secret scanner
   ```bash
   brew install trufflehog
   # or
   pip install trufflehog
   ```

3. **detect-secrets** - Baseline management
   ```bash
   pip install detect-secrets
   ```

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

## Usage

### Basic Operations

```bash
# Quick scan current directory
/skill secret-detection-scanner scan --path .

# Scan git history
/skill secret-detection-scanner scan --path . --include-history

# Pre-commit check
/skill secret-detection-scanner pre-commit --staged

# Update baseline
/skill secret-detection-scanner baseline --update

# Generate remediation plan
/skill secret-detection-scanner remediate --finding-id abc123
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(secretScanTask, {
  operation: 'full-scan',
  path: '.',
  config: {
    tools: ['gitleaks', 'trufflehog'],
    scanHistory: true,
    historyDepth: 'all',
    verifySecrets: true,
    allowlist: '.gitleaks.toml'
  },
  output: {
    format: 'json',
    redactValues: true,
    includeRemediation: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Tool Scanning** | Gitleaks, TruffleHog, detect-secrets |
| **History Scanning** | Full git history analysis |
| **Verification** | Check if secrets are still active |
| **Pre-commit Hooks** | Block commits with secrets |
| **CI/CD Integration** | GitHub Actions, GitLab CI |
| **Baseline Management** | Track known findings |
| **Remediation** | Rotation guidance |

## Secret Types Detected

| Category | Examples | Tools |
|----------|----------|-------|
| Cloud | AWS, GCP, Azure keys | All |
| API Keys | OpenAI, Stripe, SendGrid | All |
| Database | Connection strings, passwords | All |
| Private Keys | RSA, SSH, PGP | All |
| OAuth/JWT | Bearer tokens | All |
| High Entropy | Random strings | TruffleHog |

## Examples

### Example 1: CI/CD Integration

```bash
# Scan for PR/commit
/skill secret-detection-scanner ci-scan \
  --path . \
  --fail-on critical,high \
  --output ./secret-scan.sarif \
  --format sarif
```

Features:
- Exit codes for CI gates
- SARIF output for GitHub Security tab
- Only new findings (vs baseline)
- Verification of active secrets

### Example 2: Pre-commit Setup

```bash
# Initialize pre-commit protection
/skill secret-detection-scanner setup-precommit \
  --tools gitleaks,detect-secrets \
  --baseline .secrets.baseline
```

Creates:
- `.pre-commit-config.yaml` configuration
- `.gitleaks.toml` custom rules
- `.secrets.baseline` initial baseline
- Documentation for team

### Example 3: History Remediation

```bash
# Find and remediate secrets in git history
/skill secret-detection-scanner remediate-history \
  --path . \
  --commit-range "origin/main..HEAD" \
  --dry-run
```

Provides:
- Affected commits and files
- Commands to rewrite history
- Rotation instructions
- Team notification template

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITLEAKS_CONFIG` | Gitleaks config path | `.gitleaks.toml` |
| `SECRET_BASELINE` | detect-secrets baseline | `.secrets.baseline` |
| `VERIFY_SECRETS` | Enable verification | `true` |
| `GITHUB_TOKEN` | For TruffleHog GitHub scan | - |

### Skill Configuration

```yaml
# .babysitter/skills/secret-detection-scanner.yaml
secret-detection-scanner:
  defaultTools:
    - gitleaks
    - trufflehog
  gitleaks:
    configPath: .gitleaks.toml
    scanHistory: true
  trufflehog:
    verifySecrets: true
    concurrency: 5
  detectSecrets:
    baselinePath: .secrets.baseline
    plugins:
      - AWSKeyDetector
      - PrivateKeyDetector
      - BasicAuthDetector
  preCommit:
    enabled: true
    failOnAny: true
  allowlist:
    files:
      - "**/test/**"
      - "**/mock/**"
      - "**/*.md"
    patterns:
      - "EXAMPLE_API_KEY"
      - "test-.*-key"
  ci:
    failOn:
      - critical
      - high
    reportFormats:
      - json
      - sarif
  remediation:
    autoRotateIntegrations:
      - aws
      - github
```

### Gitleaks Custom Rules

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
commits = [
    "abc123def456"  # Known safe commit
]
regexes = [
    '''example-api-key''',
    '''test-\w+-key'''
]

[[rules]]
id = "custom-internal-key"
description = "Internal Service Key"
regex = '''INTERNAL_SVC_KEY\s*=\s*['"]([A-Za-z0-9+/]{40,})['"]'''
tags = ["internal", "service-key"]
keywords = ["INTERNAL_SVC_KEY"]
```

## Process Integration

### Processes Using This Skill

1. **secret-management.js** - Secret lifecycle management
2. **devsecops-pipeline.js** - DevSecOps automation
3. **sast-pipeline.js** - Static analysis pipeline
4. **incident-response.js** - Security incidents

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const secretScanTask = defineTask({
  name: 'secret-scan',
  description: 'Scan for secrets in code and history',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Secret scan for ${inputs.repoName}`,
      skill: {
        name: 'secret-detection-scanner',
        context: {
          operation: inputs.scanType || 'full-scan',
          path: inputs.repoPath,
          config: {
            tools: inputs.tools || ['gitleaks', 'trufflehog'],
            scanHistory: inputs.includeHistory !== false,
            verifySecrets: inputs.verify || true,
            allowlist: inputs.allowlistPath || '.gitleaks.toml'
          },
          output: {
            format: 'json',
            redactValues: true,
            includeRemediation: true,
            groupByType: true
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### sast-mcp

Includes TruffleHog and Gitleaks integration.

**Key Features:**
- Multi-tool secret scanning
- Unified output format
- CI/CD integration

**GitHub:** https://github.com/Sengtocxoen/sast-mcp

### SecOpsAgentKit secrets-gitleaks

Specialized Gitleaks integration with credential detection.

**Key Features:**
- Comprehensive pattern matching
- Custom rule support
- Baseline management

**GitHub:** https://github.com/AgentSecOps/SecOpsAgentKit

## Remediation Guide

### Immediate Actions

1. **Revoke/Rotate** - Change the exposed credential
2. **Audit** - Check for unauthorized access
3. **Remove** - Clean from git history if needed
4. **Update** - Deploy new credentials
5. **Document** - Record incident

### Provider-Specific Rotation

| Provider | Rotation Method |
|----------|-----------------|
| AWS | IAM Console > Security Credentials |
| GitHub | Settings > Developer Settings > Tokens |
| Stripe | Dashboard > Developers > API Keys |
| GCP | IAM > Service Accounts |
| Azure | Portal > App Registrations |

### History Cleanup

```bash
# Using BFG Repo Cleaner
bfg --replace-text passwords.txt repo.git
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (coordinate with team!)
git push origin --force --all
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Too many false positives | Tune allowlist rules |
| Slow scans | Limit history depth |
| Missing detections | Use multiple tools |
| Baseline outdated | Run baseline update |

### Debug Mode

```bash
# Enable verbose output
GITLEAKS_ENABLE_DEBUG=true /skill secret-detection-scanner scan \
  --path . \
  --verbose
```

## Security Considerations

- Never display actual secret values
- Redact in all logs and reports
- Coordinate team for history rewrites
- Track all rotations for compliance
- Document incidents properly

## Related Skills

- **sast-analyzer** - Static code analysis
- **secrets-management** - Secret storage
- **vulnerability-triage-agent** - Finding triage
- **incident-triage-agent** - Incident response

## References

- [Gitleaks Documentation](https://gitleaks.io/)
- [TruffleHog Documentation](https://trufflesecurity.com/trufflehog)
- [detect-secrets](https://github.com/Yelp/detect-secrets)
- [Pre-commit Framework](https://pre-commit.com/)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SEC-007
**Category:** Security Testing
**Status:** Active
