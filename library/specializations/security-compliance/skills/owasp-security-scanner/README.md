# OWASP Security Scanner Skill

## Overview

The `owasp-security-scanner` skill provides automated OWASP Top 10 vulnerability detection and assessment. It enables AI-powered web application security testing using OWASP ZAP with comprehensive vulnerability detection, analysis, and OWASP-compliant reporting.

## Quick Start

### Prerequisites

1. **OWASP ZAP** - Web application scanner
   ```bash
   # Docker (recommended)
   docker pull ghcr.io/zaproxy/zaproxy:stable

   # Or install locally
   brew install --cask zap  # macOS
   ```

2. **Target Application** - Web application to scan
3. **Authorization** - Written permission to scan

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For MCP integration:

```bash
# Install ZAP-MCP
npm install -g zap-mcp
```

## Usage

### Basic Operations

```bash
# Quick baseline scan
/skill owasp-security-scanner baseline --target https://example.com

# Full security scan
/skill owasp-security-scanner full-scan --target https://example.com

# API scan with OpenAPI spec
/skill owasp-security-scanner api-scan --spec ./openapi.yaml

# Generate OWASP compliance report
/skill owasp-security-scanner report --format html --output ./security-report.html
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(owaspScanTask, {
  operation: 'full-scan',
  target: 'https://staging.example.com',
  config: {
    authentication: {
      type: 'form',
      loginUrl: 'https://staging.example.com/login',
      credentials: {
        username: process.env.TEST_USER,
        password: process.env.TEST_PASS
      }
    },
    scanPolicy: 'owasp-top-10',
    ajaxSpider: true,
    excludeUrls: ['/logout', '/admin/delete']
  },
  output: {
    formats: ['json', 'html'],
    includeEvidence: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Baseline Scan** | Quick passive vulnerability check |
| **Full Scan** | Comprehensive active testing |
| **API Scan** | REST/GraphQL API testing |
| **Authenticated Scan** | Testing behind login |
| **OWASP Top 10** | Complete coverage |
| **Report Generation** | JSON, HTML, SARIF outputs |

## OWASP Top 10 2021 Coverage

| ID | Category | Detection Method |
|----|----------|------------------|
| A01 | Broken Access Control | Active scan, manual tests |
| A02 | Cryptographic Failures | SSL/TLS analysis, passive |
| A03 | Injection | Active scan (SQL, XSS, etc.) |
| A04 | Insecure Design | Manual review checklist |
| A05 | Security Misconfiguration | Passive + active scan |
| A06 | Vulnerable Components | Component analysis |
| A07 | Auth Failures | Authentication testing |
| A08 | Integrity Failures | CI/CD review, active scan |
| A09 | Logging Failures | Manual review |
| A10 | SSRF | Active scan probes |

## Examples

### Example 1: CI/CD Integration

```bash
# Scan staging environment in CI
/skill owasp-security-scanner ci-scan \
  --target https://staging.example.com \
  --fail-on high \
  --rules .zap-rules.tsv \
  --output ./zap-report.json
```

CI/CD Features:
- Exit codes for pipeline gates
- Baseline comparison (new issues only)
- SARIF for GitHub Security tab
- Configurable failure thresholds

### Example 2: Authenticated Application Scan

```bash
# Scan authenticated application
/skill owasp-security-scanner full-scan \
  --target https://app.example.com \
  --auth-type form \
  --login-url https://app.example.com/login \
  --username testuser \
  --password testpass \
  --logged-in-indicator "Welcome, Test"
```

Includes:
- Session management testing
- Authorization bypass attempts
- IDOR detection
- Privilege escalation checks

### Example 3: API Security Assessment

```bash
# Comprehensive API scan
/skill owasp-security-scanner api-scan \
  --spec https://api.example.com/openapi.json \
  --auth-header "Authorization: Bearer $TOKEN" \
  --output ./api-security-report.json
```

Tests:
- Authentication/authorization
- Input validation
- Rate limiting
- Data exposure
- Injection attacks

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ZAP_API_KEY` | ZAP API key | Random |
| `ZAP_PORT` | ZAP proxy port | `8080` |
| `SCAN_TIMEOUT` | Maximum scan time | `3600` |
| `TARGET_URL` | Default target | - |

### Skill Configuration

```yaml
# .babysitter/skills/owasp-security-scanner.yaml
owasp-security-scanner:
  zap:
    dockerImage: ghcr.io/zaproxy/zaproxy:stable
    apiKey: ${ZAP_API_KEY}
    port: 8080
  defaultScanType: baseline
  scanPolicy:
    strength: MEDIUM
    threshold: MEDIUM
  authentication:
    storeCredentials: false
  excludeUrls:
    - "*/logout"
    - "*/signout"
    - "*delete*"
    - "*payment*"
  rateLimit:
    requestsPerSecond: 10
    delayInMs: 100
  reports:
    formats:
      - json
      - html
    includePassedChecks: false
    owaspMapping: true
  ci:
    failOn:
      - high
      - critical
    warnOn:
      - medium
```

### ZAP Rules File

```tsv
# .zap-rules.tsv
# Format: rule_id    action    parameter
10021    WARN    # X-Content-Type-Options Header Missing
10038    WARN    # Content Security Policy Header Missing
40012    FAIL    # Cross Site Scripting (Reflected)
40014    FAIL    # Cross Site Scripting (Persistent)
40018    FAIL    # SQL Injection
90019    FAIL    # Server Side Include
90020    FAIL    # Remote OS Command Injection
```

## Process Integration

### Processes Using This Skill

1. **dast-scanning.js** - Dynamic security testing
2. **penetration-testing.js** - Penetration testing workflow
3. **security-assessment.js** - Security assessment
4. **devsecops-pipeline.js** - DevSecOps automation

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const owaspScanTask = defineTask({
  name: 'owasp-scan',
  description: 'Run OWASP security scan against target application',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `OWASP scan for ${inputs.targetUrl}`,
      skill: {
        name: 'owasp-security-scanner',
        context: {
          operation: inputs.scanType || 'baseline',
          target: inputs.targetUrl,
          config: {
            scanPolicy: 'owasp-top-10',
            ajaxSpider: inputs.isSpaBased || false,
            authentication: inputs.authConfig,
            excludeUrls: inputs.excludeUrls || []
          },
          output: {
            formats: ['json', 'html'],
            owaspMapping: true,
            includeRemediation: true
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

### ZAP-MCP

AI-powered integration between OWASP ZAP and Claude.

**Key Features:**
- Automated scan management
- Result parsing and analysis
- Vulnerability assessment
- Remediation guidance

**Installation:**
```bash
npm install -g zap-mcp
```

**GitHub:** https://github.com/ajtazer/ZAP-MCP

### pentestMCP

Comprehensive penetration testing MCP server with 20+ tools.

**Includes:**
- OWASP ZAP integration
- Nuclei vulnerability scanner
- SQLMap
- Nmap

**GitHub:** https://github.com/ramkansal/pentestMCP

## Scan Types Comparison

| Type | Duration | Coverage | Use Case |
|------|----------|----------|----------|
| Baseline | 5-15 min | Passive | CI/CD, quick check |
| Full | 30-120 min | Complete | Pre-release, audits |
| API | 15-45 min | API focused | API security |
| Ajax | 20-60 min | JS apps | SPAs, React/Vue/Angular |

## Security Headers Checklist

| Header | Purpose | Recommended Value |
|--------|---------|-------------------|
| Content-Security-Policy | XSS prevention | Strict policy |
| X-Content-Type-Options | MIME sniffing | nosniff |
| X-Frame-Options | Clickjacking | DENY or SAMEORIGIN |
| Strict-Transport-Security | HTTPS enforcement | max-age=31536000 |
| X-XSS-Protection | Legacy XSS filter | 1; mode=block |
| Referrer-Policy | Referrer control | strict-origin |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Scan times out | Reduce scope, increase timeout |
| Missing vulnerabilities | Enable AJAX spider, check auth |
| False positives | Tune scan policy, add exclusions |
| Target unreachable | Check network, proxy settings |

### Debug Mode

```bash
# Enable verbose ZAP logging
/skill owasp-security-scanner baseline \
  --target https://example.com \
  --verbose \
  --debug
```

## Remediation Priorities

| Risk Level | SLA | Action |
|------------|-----|--------|
| Critical | 24 hours | Immediate fix required |
| High | 7 days | Priority fix |
| Medium | 30 days | Scheduled fix |
| Low | 90 days | Backlog |
| Informational | N/A | Best practice improvement |

## Related Skills

- **dast-scanner** - Advanced DAST with Nuclei
- **sast-analyzer** - Static code analysis
- **penetration-testing** - Manual pen testing
- **vulnerability-triage-agent** - Triage findings

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [ZAP Docker Images](https://www.zaproxy.org/docs/docker/)
- [ZAP GitHub Actions](https://github.com/zaproxy/action-baseline)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SEC-001
**Category:** Security Testing
**Status:** Active
