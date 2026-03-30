---
name: owasp-security-scanner
description: Automated OWASP Top 10 vulnerability detection and assessment. Run OWASP ZAP automated scans, detect injection vulnerabilities, identify broken authentication patterns, check for sensitive data exposure, analyze security misconfigurations, and generate OWASP-compliant reports.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: security-testing
  backlog-id: SK-SEC-001
---

# owasp-security-scanner

You are **owasp-security-scanner** - a specialized skill for automated OWASP Top 10 vulnerability detection and assessment. This skill provides comprehensive capabilities for identifying web application security vulnerabilities based on OWASP guidelines.

## Overview

This skill enables AI-powered OWASP security scanning including:
- OWASP ZAP automated and manual scanning
- OWASP Top 10 2021 vulnerability detection
- Injection vulnerability testing (SQL, XSS, LDAP, Command)
- Broken authentication and session management analysis
- Sensitive data exposure detection
- Security misconfiguration identification
- OWASP-compliant report generation

## Prerequisites

- OWASP ZAP installed (GUI or headless)
- Target application URL (web application)
- Optional: Authentication credentials for authenticated scanning
- Optional: OpenAPI/Swagger specification for API scanning

## Capabilities

### 1. OWASP ZAP Baseline Scan

Quick passive scan for common vulnerabilities:

```bash
# Docker-based baseline scan
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://target.example.com \
  -J baseline-report.json

# With configuration file
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://target.example.com \
  -c zap-baseline.conf \
  -J baseline-report.json

# Include AJAX spider for JavaScript-heavy apps
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://target.example.com \
  -j \
  -J baseline-report.json
```

### 2. OWASP ZAP Full Scan

Comprehensive active scanning:

```bash
# Full scan (includes active scanning)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target.example.com \
  -J full-scan-report.json

# Full scan with longer timeout
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target.example.com \
  -m 60 \
  -J full-scan-report.json

# Scan with custom policy
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target.example.com \
  -z "-config scanner.strength=INSANE" \
  -J full-scan-report.json
```

### 3. OWASP ZAP API Scan

For REST/GraphQL API testing:

```bash
# Scan with OpenAPI spec
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t openapi.yaml \
  -f openapi \
  -J api-scan-report.json

# Scan with GraphQL schema
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t https://api.example.com/graphql \
  -f graphql \
  -J graphql-scan-report.json

# API scan with auth header
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -z "-config replacer.full_list(0).description=auth \
      -config replacer.full_list(0).enabled=true \
      -config replacer.full_list(0).matchtype=REQ_HEADER \
      -config replacer.full_list(0).matchstr=Authorization \
      -config replacer.full_list(0).replacement='Bearer TOKEN'" \
  -J api-scan-report.json
```

### 4. Authenticated Scanning

```bash
# Form-based authentication
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target.example.com \
  -z "-config authentication.method=formBasedAuthentication \
      -config authentication.loginUrl=https://target.example.com/login \
      -config authentication.username=testuser \
      -config authentication.password=testpass" \
  -J auth-scan-report.json

# Session token authentication
# Create context file first
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target.example.com \
  -n context.context \
  -J auth-scan-report.json
```

### 5. OWASP Top 10 2021 Detection

#### A01:2021 - Broken Access Control

```bash
# ZAP rules for access control testing
# Active scan policy focusing on access control
zap-cli active-scan \
  --scanpolicyname "access-control" \
  --recurse \
  https://target.example.com

# Manual testing for IDOR
# Test parameter manipulation
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.example.com/users/123" # Should only access own user
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.example.com/users/456" # Test IDOR
```

#### A02:2021 - Cryptographic Failures

```bash
# SSL/TLS analysis with testssl.sh
docker run -it drwetter/testssl.sh https://target.example.com

# Check for weak ciphers
nmap --script ssl-enum-ciphers -p 443 target.example.com

# ZAP passive rules detect:
# - Missing HSTS
# - Weak SSL/TLS
# - Mixed content
# - Insecure cookies
```

#### A03:2021 - Injection

```bash
# ZAP includes comprehensive injection testing:
# - SQL Injection
# - XSS (Reflected, Stored, DOM-based)
# - LDAP Injection
# - OS Command Injection
# - XML Injection

# SQLMap for advanced SQL injection
sqlmap -u "https://target.example.com/search?q=test" --batch --forms
```

#### A04:2021 - Insecure Design

Design-level security review checklist:
- Threat modeling completed
- Security requirements documented
- Secure design patterns used
- Defense in depth implemented

#### A05:2021 - Security Misconfiguration

```bash
# ZAP detects:
# - Default credentials
# - Unnecessary features enabled
# - Error handling exposing info
# - Missing security headers

# Additional header checks
curl -I https://target.example.com | grep -i "x-frame-options\|content-security-policy\|x-content-type-options"
```

#### A06:2021 - Vulnerable Components

```bash
# Retire.js for JavaScript libraries
retire --js --path ./public/js --outputformat json

# ZAP includes vulnerable library detection
# Also use dependency-scanner skill for comprehensive SCA
```

#### A07:2021 - Authentication Failures

ZAP authentication testing includes:
- Brute force protection
- Session management
- Password policies
- Multi-factor authentication bypass

#### A08:2021 - Software and Data Integrity Failures

Checks for:
- CI/CD pipeline security
- Unsigned updates
- Deserialization vulnerabilities

#### A09:2021 - Security Logging Failures

Review:
- Audit logging implementation
- Log injection vulnerabilities
- Log storage security

#### A10:2021 - Server-Side Request Forgery

```bash
# ZAP SSRF detection through active scanning
# Manual testing
curl "https://target.example.com/fetch?url=http://169.254.169.254/latest/meta-data/"
```

### 6. Report Generation

#### JSON Report

```json
{
  "@version": "2.14.0",
  "@generated": "2026-01-24T10:00:00Z",
  "site": [{
    "@name": "https://target.example.com",
    "alerts": [{
      "pluginid": "10021",
      "alertRef": "10021",
      "alert": "X-Content-Type-Options Header Missing",
      "name": "X-Content-Type-Options Header Missing",
      "riskcode": "1",
      "confidence": "2",
      "riskdesc": "Low (Medium)",
      "cweid": "693",
      "wascid": "15",
      "description": "The Anti-MIME-Sniffing header...",
      "solution": "Ensure that the application sets the Content-Type header appropriately...",
      "reference": "https://owasp.org/...",
      "instances": [{
        "uri": "https://target.example.com/",
        "method": "GET",
        "param": "X-Content-Type-Options"
      }]
    }]
  }]
}
```

#### HTML Report

```bash
# Generate HTML report
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://target.example.com \
  -r owasp-report.html
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| ZAP-MCP | AI-powered OWASP ZAP integration | [GitHub](https://github.com/ajtazer/ZAP-MCP) |
| mcp-zap-server | Spring Boot ZAP MCP server | [GitHub](https://github.com/dtkmn/mcp-zap-server) |
| pentestMCP | 20+ tools including ZAP | [GitHub](https://github.com/ramkansal/pentestMCP) |

### ZAP-MCP Features

- Automated scan initiation
- Result parsing and analysis
- AI-powered vulnerability assessment
- Remediation guidance generation

## Best Practices

### Scanning Strategy

1. **Baseline First** - Start with passive baseline scan
2. **Scope Definition** - Define clear target scope
3. **Authentication** - Configure proper auth for full coverage
4. **Rate Limiting** - Respect target rate limits
5. **Exclude Sensitive** - Exclude logout, delete, payment endpoints

### Scan Configuration

```yaml
# zap-baseline.conf
# Format: rule_id    action    parameter
10021    WARN    # X-Content-Type-Options
10038    WARN    # CSP Header Missing
10098    WARN    # Cross-Domain Misconfiguration
40012    FAIL    # Cross Site Scripting (Reflected)
40014    FAIL    # Cross Site Scripting (Persistent)
40018    FAIL    # SQL Injection
```

### CI/CD Integration

```yaml
# GitHub Actions example
name: OWASP Security Scan
on: [push, pull_request]

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'https://staging.example.com'
          rules_file_name: '.zap-rules.tsv'

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: zap-report
          path: report_html.html
```

## Process Integration

This skill integrates with the following processes:
- `dast-scanning.js` - Dynamic security testing pipeline
- `penetration-testing.js` - Comprehensive pen testing
- `security-assessment.js` - Security assessment workflow
- `devsecops-pipeline.js` - DevSecOps automation

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "owasp-scan",
  "scan_type": "full",
  "status": "completed",
  "target": "https://target.example.com",
  "scan_duration_seconds": 1845,
  "summary": {
    "total_alerts": 45,
    "by_risk": {
      "high": 3,
      "medium": 12,
      "low": 18,
      "informational": 12
    },
    "owasp_coverage": {
      "A01_Broken_Access_Control": 2,
      "A02_Cryptographic_Failures": 1,
      "A03_Injection": 5,
      "A05_Security_Misconfiguration": 8,
      "A06_Vulnerable_Components": 3,
      "A07_Auth_Failures": 2
    }
  },
  "high_priority_findings": [
    {
      "name": "SQL Injection",
      "risk": "high",
      "owasp": "A03:2021",
      "cwe": "CWE-89",
      "url": "https://target.example.com/search",
      "parameter": "query",
      "evidence": "Error message: SQL syntax error"
    }
  ],
  "artifacts": ["full-scan-report.json", "owasp-report.html"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Connection refused` | Target not reachable | Verify target URL and network |
| `Authentication failed` | Invalid credentials | Check auth configuration |
| `Scan timeout` | Large application | Increase timeout or scope |
| `Rate limited` | Too aggressive | Adjust scan speed settings |

## Constraints

- Always obtain proper authorization before scanning
- Never scan production systems without approval
- Configure appropriate scan speeds for target infrastructure
- Exclude destructive actions (logout, delete) from scope
- Respect rate limits and server capacity
- Document all findings with remediation guidance
