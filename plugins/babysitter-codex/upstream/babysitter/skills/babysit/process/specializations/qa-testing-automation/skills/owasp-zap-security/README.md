# OWASP ZAP Security Skill

## Overview

The `owasp-zap-security` skill provides deep integration with OWASP ZAP for automated security scanning, vulnerability detection, and API security testing. It enables AI-powered security testing workflows including spider scans, active scans, and CI/CD integration.

## Quick Start

### Prerequisites

1. **OWASP ZAP** - Install from [zaproxy.org](https://www.zaproxy.org/download/) or use Docker
2. **ZAP API Access** - Enable API for automation
3. **Target Application** - Application under test accessible from ZAP

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

To run ZAP via Docker:

```bash
# Run ZAP in daemon mode
docker run -d --name zap -p 8080:8080 zaproxy/zap-stable zap.sh -daemon -host 0.0.0.0 -port 8080

# Verify ZAP is running
curl http://localhost:8080/JSON/core/view/version/
```

To add MCP server integration:

```bash
# Option 1: Python-based ZAP MCP
pip install zap-mcp

# Option 2: Spring Boot ZAP MCP
# See: https://github.com/dtkmn/mcp-zap-server
```

## Usage

### Basic Operations

```bash
# Run a baseline security scan
/skill owasp-zap-security baseline-scan --target https://target.example.com

# Run spider + active scan
/skill owasp-zap-security full-scan --target https://target.example.com

# Scan API with OpenAPI spec
/skill owasp-zap-security api-scan --spec https://api.example.com/openapi.json

# Generate security report
/skill owasp-zap-security report --format html --output security-report.html
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(owaspZapTask, {
  operation: 'active-scan',
  target: 'https://staging.example.com',
  scanPolicy: 'Medium',
  reportFormat: 'html'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Spider Scanning** | Crawl applications to discover attack surface |
| **Active Scanning** | Execute comprehensive vulnerability scans |
| **API Security** | Test APIs using OpenAPI/Swagger specs |
| **Baseline Scans** | Quick CI/CD-friendly security checks |
| **Authentication** | Configure authenticated scans |
| **Report Generation** | HTML, JSON, XML security reports |
| **Alert Analysis** | Interpret and prioritize vulnerabilities |

## Examples

### Example 1: CI/CD Baseline Scan

```bash
# Quick baseline scan for pipeline
docker run -t zaproxy/zap-stable zap-baseline.py \
  -t https://staging.example.com \
  -g gen.conf \
  -r baseline-report.html \
  --exit-code 1  # Fail on high alerts

# Check exit code
if [ $? -ne 0 ]; then
  echo "Security issues detected!"
  exit 1
fi
```

### Example 2: API Security Scan

```bash
# Scan API using OpenAPI specification
/skill owasp-zap-security api-scan \
  --spec https://api.example.com/openapi.json \
  --format openapi \
  --report api-security-report.html
```

### Example 3: Authenticated Scan

```bash
# Configure and run authenticated scan
/skill owasp-zap-security auth-scan \
  --target https://app.example.com \
  --login-url https://app.example.com/login \
  --username testuser \
  --password testpass \
  --scan-policy Heavy
```

### Example 4: Full Security Assessment

```bash
# Comprehensive security scan workflow
/skill owasp-zap-security full-assessment \
  --target https://target.example.com \
  --include-ajax-spider \
  --active-scan-policy Heavy \
  --report-format all \
  --output-dir ./security-reports
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ZAP_API_URL` | ZAP API endpoint | `http://localhost:8080` |
| `ZAP_API_KEY` | API key for authentication | None |
| `ZAP_TIMEOUT` | Scan timeout in minutes | `60` |

### Skill Configuration

```yaml
# .babysitter/skills/owasp-zap-security.yaml
owasp-zap-security:
  zapApiUrl: http://localhost:8080
  defaultScanPolicy: Medium
  reportFormat: html
  failOnHighAlerts: true
  alertThresholds:
    high: 0
    medium: 5
    low: -1  # No limit
```

## Process Integration

### Processes Using This Skill

1. **security-testing.js** - All phases of security testing
2. **api-testing.js** - API security validation
3. **quality-gates.js** - Security gate enforcement
4. **continuous-testing.js** - CI/CD security integration

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const securityScanTask = defineTask({
  name: 'security-scan',
  description: 'Run OWASP ZAP security scan',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Security Scan: ${inputs.target}`,
      skill: {
        name: 'owasp-zap-security',
        context: {
          operation: 'full-scan',
          target: inputs.target,
          scanPolicy: inputs.scanPolicy || 'Medium',
          reportFormat: 'html',
          failOnHighAlerts: true
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

### dtkmn/mcp-zap-server

Spring Boot application exposing OWASP ZAP as MCP server.

**Features:**
- Spider and active scanning
- OpenAPI import
- Alert management
- Report generation

**GitHub:** https://github.com/dtkmn/mcp-zap-server

### ajtazer/ZAP-MCP

Python-based OWASP ZAP MCP integration.

**Features:**
- Python-native ZAP integration
- Async scan support
- Alert filtering

**GitHub:** https://github.com/ajtazer/ZAP-MCP

## Alert Interpretation

| Severity | Action | Timeline |
|----------|--------|----------|
| **High** | Block deployment, immediate remediation | Before release |
| **Medium** | Schedule fix, risk assessment | Within sprint |
| **Low** | Add to backlog, monitor | As time permits |
| **Info** | Document, consider improvement | Optional |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Connection refused` | Verify ZAP is running and API is enabled |
| `Authentication failed` | Check ZAP API key configuration |
| `Scan timeout` | Increase timeout or reduce scan scope |
| `No alerts found` | Verify target URL and scan scope |
| `Too many alerts` | Adjust scan policy or filter false positives |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
ZAP_DEBUG=true /skill owasp-zap-security scan --target https://target.example.com
```

## Related Skills

- **api-testing** - General API testing
- **playwright-e2e** - E2E testing with security checks
- **docker-test-environments** - Isolated test environments

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ZAP API Reference](https://www.zaproxy.org/docs/api/)
- [ZAP Docker Documentation](https://www.zaproxy.org/docs/docker/)
- [dtkmn/mcp-zap-server](https://github.com/dtkmn/mcp-zap-server)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-017
**Category:** Security Testing
**Status:** Active
