# DAST Scanner Skill

## Overview

The `dast-scanner` skill provides Dynamic Application Security Testing (DAST) execution and management. It enables AI-powered runtime vulnerability detection using OWASP ZAP and Nuclei with authenticated scanning, API testing, and comprehensive reporting.

## Quick Start

### Prerequisites

1. **OWASP ZAP** - Web application scanner
   ```bash
   # Docker (recommended)
   docker pull ghcr.io/zaproxy/zaproxy:stable
   ```

2. **Nuclei** - Template-based scanner
   ```bash
   # Go install
   go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

   # Or Homebrew
   brew install nuclei
   ```

3. **Target Application** - Running and accessible

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

## Usage

### Basic Operations

```bash
# Quick scan with ZAP
/skill dast-scanner zap-scan --target https://example.com

# Nuclei vulnerability scan
/skill dast-scanner nuclei-scan --target https://example.com --severity critical,high

# Combined scan
/skill dast-scanner full-scan --target https://example.com --tools zap,nuclei

# API security scan
/skill dast-scanner api-scan --spec ./openapi.yaml --target https://api.example.com
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(dastScanTask, {
  operation: 'full-scan',
  target: 'https://staging.example.com',
  config: {
    tools: ['zap', 'nuclei'],
    zap: {
      scanType: 'full',
      policy: 'high-intensity',
      ajaxSpider: true
    },
    nuclei: {
      templates: ['cves', 'vulnerabilities'],
      severity: ['critical', 'high', 'medium'],
      rateLimit: 50
    },
    authentication: {
      type: 'bearer',
      token: process.env.API_TOKEN
    },
    scope: {
      excludeUrls: ['/logout', '/delete']
    }
  },
  output: {
    formats: ['json', 'html'],
    correlateWithSast: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **ZAP Scanning** | Baseline, full, API scans |
| **Nuclei Templates** | 5000+ vulnerability templates |
| **Authenticated Scan** | Form, cookie, bearer auth |
| **API Testing** | REST, GraphQL, gRPC |
| **SAST Correlation** | Combine static/dynamic results |
| **Custom Templates** | Create Nuclei templates |

## Scan Types

| Type | Tool | Duration | Coverage | Use Case |
|------|------|----------|----------|----------|
| Baseline | ZAP | 5-15 min | Passive | Quick check, CI |
| Full | ZAP | 30-120 min | Active | Pre-release |
| API | ZAP | 15-45 min | API focused | API security |
| Template | Nuclei | 10-30 min | Known vulns | CVE detection |
| Combined | Both | 45-180 min | Comprehensive | Full audit |

## Examples

### Example 1: CI/CD Nightly Scan

```bash
# Automated nightly DAST scan
/skill dast-scanner ci-scan \
  --target https://staging.example.com \
  --tools zap,nuclei \
  --severity critical,high \
  --fail-on critical \
  --output ./dast-report.sarif
```

Features:
- Parallel ZAP and Nuclei scanning
- Exit codes for CI gates
- SARIF output for GitHub Security
- Slack notification integration

### Example 2: Authenticated Application Scan

```bash
# Full authenticated scan
/skill dast-scanner full-scan \
  --target https://app.example.com \
  --auth-type bearer \
  --auth-token $API_TOKEN \
  --zap-context ./app-context.context \
  --output ./auth-scan-report.json
```

Tests:
- All authenticated endpoints
- Session management
- Authorization controls
- IDOR vulnerabilities

### Example 3: API Security Assessment

```bash
# Comprehensive API scan
/skill dast-scanner api-scan \
  --spec https://api.example.com/openapi.json \
  --auth-header "Authorization: Bearer $TOKEN" \
  --nuclei-tags api,owasp \
  --output ./api-security.json
```

Coverage:
- Input validation
- Authentication/authorization
- Rate limiting
- Data exposure
- Injection attacks

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ZAP_API_KEY` | ZAP API key | Random |
| `ZAP_PORT` | ZAP proxy port | `8080` |
| `NUCLEI_TEMPLATES` | Custom templates path | - |
| `DAST_RATE_LIMIT` | Requests per second | `20` |

### Skill Configuration

```yaml
# .babysitter/skills/dast-scanner.yaml
dast-scanner:
  defaultTools:
    - zap
    - nuclei
  zap:
    dockerImage: ghcr.io/zaproxy/zaproxy:stable
    defaultScanType: full
    attackStrength: MEDIUM
    alertThreshold: LOW
    ajaxSpider: true
  nuclei:
    updateTemplates: true
    defaultSeverity:
      - critical
      - high
      - medium
    defaultTags:
      - cve
      - owasp
      - vulnerability
    rateLimit: 50
    concurrency: 10
  scope:
    defaultExcludes:
      - "*/logout"
      - "*/signout"
      - "*delete*"
      - "*payment*"
  rateLimit:
    requestsPerSecond: 20
    delayMs: 50
  ci:
    failOn:
      - critical
    warnOn:
      - high
    reportFormats:
      - json
      - sarif
      - html
```

## Process Integration

### Processes Using This Skill

1. **dast-scanning.js** - DAST pipeline
2. **penetration-testing.js** - Pen testing
3. **devsecops-pipeline.js** - DevSecOps
4. **vulnerability-management.js** - Vuln lifecycle

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const dastScanTask = defineTask({
  name: 'dast-scan',
  description: 'Run DAST scan against target application',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `DAST scan for ${inputs.targetUrl}`,
      skill: {
        name: 'dast-scanner',
        context: {
          operation: inputs.scanType || 'full-scan',
          target: inputs.targetUrl,
          config: {
            tools: inputs.tools || ['zap', 'nuclei'],
            zap: {
              scanType: inputs.zapScanType || 'full',
              ajaxSpider: inputs.isSpa || false
            },
            nuclei: {
              severity: inputs.severity || ['critical', 'high'],
              templates: inputs.nucleiTemplates || ['cves', 'vulnerabilities']
            },
            authentication: inputs.authConfig,
            scope: {
              excludeUrls: inputs.excludeUrls || []
            }
          },
          output: {
            formats: ['json', 'html'],
            includeEvidence: true
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

### pentestMCP

Comprehensive penetration testing MCP server with 20+ tools.

**Includes:**
- OWASP ZAP
- Nuclei
- SQLMap
- Nmap
- And more

**GitHub:** https://github.com/ramkansal/pentestMCP

### HexStrike AI

150+ cybersecurity tools for automated security testing.

**Key Features:**
- Multi-tool orchestration
- AI-powered analysis
- Comprehensive reporting

**GitHub:** https://github.com/0x4m4/hexstrike-ai

## Nuclei Template Categories

| Category | Count | Description |
|----------|-------|-------------|
| `cves/` | 5000+ | Known CVE exploits |
| `vulnerabilities/` | 500+ | Generic vulnerabilities |
| `exposures/` | 300+ | Information exposure |
| `misconfigurations/` | 400+ | Security misconfigs |
| `technologies/` | 200+ | Tech detection |
| `fuzzing/` | 100+ | Fuzzing templates |

## SAST/DAST Correlation

Correlate static and dynamic findings for higher confidence:

```bash
# Generate correlation report
/skill dast-scanner correlate \
  --sast-report ./sast-results.json \
  --dast-report ./dast-results.json \
  --output ./correlated-findings.json
```

Benefits:
- Confirm exploitability of SAST findings
- Prioritize verified vulnerabilities
- Reduce false positives
- Comprehensive coverage view

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Target unreachable | Check network, firewall |
| Auth fails | Verify credentials, tokens |
| Slow scans | Adjust rate limits, scope |
| High false positives | Tune templates, policies |

### Debug Mode

```bash
# Enable verbose logging
DAST_DEBUG=true /skill dast-scanner full-scan \
  --target https://example.com \
  --verbose
```

## Security Considerations

- Always obtain written authorization
- Never scan production without approval
- Configure appropriate rate limits
- Exclude destructive endpoints
- Monitor target health during scans

## Related Skills

- **owasp-security-scanner** - OWASP Top 10 focus
- **sast-analyzer** - Static analysis
- **vulnerability-triage-agent** - Finding triage
- **penetration-testing** - Manual testing

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Nuclei Documentation](https://nuclei.projectdiscovery.io/)
- [Nuclei Templates](https://github.com/projectdiscovery/nuclei-templates)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SEC-003
**Category:** Security Testing
**Status:** Active
