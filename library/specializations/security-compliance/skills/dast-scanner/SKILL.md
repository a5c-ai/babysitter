---
name: dast-scanner
description: Dynamic Application Security Testing execution and management. Configure and execute OWASP ZAP and Nuclei scans, run authenticated scanning, manage scan policies and scope, correlate findings with SAST results, and generate comprehensive vulnerability reports.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: security-testing
  backlog-id: SK-SEC-003
---

# dast-scanner

You are **dast-scanner** - a specialized skill for Dynamic Application Security Testing (DAST) execution and management. This skill provides comprehensive capabilities for runtime vulnerability detection in web applications and APIs.

## Overview

This skill enables AI-powered DAST including:
- OWASP ZAP automated and manual scanning
- Nuclei template-based vulnerability scanning
- Authenticated scanning with session management
- API security testing (REST, GraphQL, gRPC)
- Scan policy configuration and scope management
- SAST/DAST result correlation
- Comprehensive vulnerability reporting

## Prerequisites

- Target application running and accessible
- OWASP ZAP and/or Nuclei installed
- Network access to target
- Optional: Authentication credentials
- Optional: API specifications (OpenAPI, GraphQL schema)

## Capabilities

### 1. OWASP ZAP Scanning

Comprehensive web application security testing:

```bash
# Start ZAP daemon
docker run -u zap -p 8080:8080 -i ghcr.io/zaproxy/zaproxy:stable zap.sh -daemon \
  -host 0.0.0.0 -port 8080 -config api.disablekey=true

# Quick baseline scan
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://target.example.com \
  -J report.json

# Full active scan
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target.example.com \
  -J full-report.json

# API scan with OpenAPI
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t openapi.yaml \
  -f openapi \
  -J api-report.json

# Custom scan with ZAP CLI
zap-cli quick-scan https://target.example.com
zap-cli active-scan https://target.example.com
zap-cli report -o report.html -f html
```

#### ZAP Scan Policies

```xml
<!-- High-intensity scan policy -->
<scanPolicy>
  <name>high-intensity</name>
  <description>Comprehensive security scan</description>
  <attackStrength>INSANE</attackStrength>
  <alertThreshold>LOW</alertThreshold>
  <scanners>
    <scanner id="40012" enabled="true" attackStrength="HIGH"/> <!-- XSS -->
    <scanner id="40018" enabled="true" attackStrength="INSANE"/> <!-- SQLi -->
    <scanner id="90019" enabled="true" attackStrength="HIGH"/> <!-- SSI -->
    <scanner id="90020" enabled="true" attackStrength="INSANE"/> <!-- RCE -->
  </scanners>
</scanPolicy>
```

### 2. Nuclei Template Scanning

Fast template-based vulnerability detection:

```bash
# Update templates
nuclei -update-templates

# Basic scan
nuclei -target https://target.example.com -json -output nuclei-results.json

# Scan with specific templates
nuclei -target https://target.example.com \
  -templates cves/ \
  -templates vulnerabilities/ \
  -json -output nuclei-results.json

# Scan with severity filter
nuclei -target https://target.example.com \
  -severity critical,high \
  -json -output nuclei-critical.json

# Scan multiple targets
nuclei -list targets.txt \
  -severity critical,high,medium \
  -json -output nuclei-results.json

# Scan with tags
nuclei -target https://target.example.com \
  -tags owasp,cve,xss,sqli \
  -json -output nuclei-owasp.json

# Scan with rate limiting
nuclei -target https://target.example.com \
  -rate-limit 50 \
  -concurrency 10 \
  -json -output nuclei-results.json

# Headless scanning for JS apps
nuclei -target https://target.example.com \
  -headless \
  -json -output nuclei-headless.json
```

#### Nuclei Template Categories

| Category | Description | Templates |
|----------|-------------|-----------|
| `cves/` | Known CVEs | 5000+ |
| `vulnerabilities/` | Generic vulnerabilities | 500+ |
| `exposures/` | Sensitive data exposure | 300+ |
| `misconfigurations/` | Security misconfigs | 400+ |
| `technologies/` | Technology detection | 200+ |
| `fuzzing/` | Fuzzing templates | 100+ |

#### Custom Nuclei Template

```yaml
# custom-templates/api-key-exposure.yaml
id: api-key-exposure

info:
  name: API Key Exposure Check
  author: security-team
  severity: high
  description: Checks for exposed API keys in responses
  tags: api,exposure,secrets

http:
  - method: GET
    path:
      - "{{BaseURL}}/api/config"
      - "{{BaseURL}}/config.json"
      - "{{BaseURL}}/.env"

    matchers-condition: or
    matchers:
      - type: regex
        regex:
          - "api[_-]?key['\"]?\\s*[:=]\\s*['\"]?[a-zA-Z0-9]{20,}"
          - "secret[_-]?key['\"]?\\s*[:=]\\s*['\"]?[a-zA-Z0-9]{20,}"
        condition: or

    extractors:
      - type: regex
        regex:
          - "api[_-]?key['\"]?\\s*[:=]\\s*['\"]?([a-zA-Z0-9]{20,})"
        group: 1
```

### 3. Authenticated Scanning

#### ZAP Authentication

```bash
# Form-based authentication context
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t https://target.example.com \
  -n context.context \
  -U authenticated-user \
  -J auth-report.json

# OAuth/Bearer token authentication
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t openapi.yaml \
  -f openapi \
  -z "-config replacer.full_list(0).description=auth \
      -config replacer.full_list(0).enabled=true \
      -config replacer.full_list(0).matchtype=REQ_HEADER \
      -config replacer.full_list(0).matchstr=Authorization \
      -config replacer.full_list(0).replacement='Bearer $TOKEN'" \
  -J api-auth-report.json
```

#### ZAP Context File

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <context>
    <name>MyAppContext</name>
    <desc></desc>
    <inscope>true</inscope>
    <incregexes>https://target.example.com.*</incregexes>
    <excregexes>.*logout.*</excregexes>
    <tech>
      <include>Db.PostgreSQL</include>
      <include>Language.JavaScript</include>
      <include>OS.Linux</include>
    </tech>
    <authentication>
      <type>FormBasedAuthentication</type>
      <loggedin>\Qlogout\E</loggedin>
      <loggedout>\Qlogin\E</loggedout>
      <form>
        <loginurl>https://target.example.com/login</loginurl>
        <loginbody>username={%username%}&amp;password={%password%}</loginbody>
      </form>
    </authentication>
    <users>
      <user>
        <name>testuser</name>
        <credentials>username=testuser&amp;password=testpass</credentials>
      </user>
    </users>
  </context>
</configuration>
```

#### Nuclei with Authentication

```bash
# Cookie-based authentication
nuclei -target https://target.example.com \
  -header "Cookie: session=abc123" \
  -json -output nuclei-auth.json

# Bearer token authentication
nuclei -target https://target.example.com \
  -header "Authorization: Bearer $TOKEN" \
  -json -output nuclei-auth.json

# Custom headers file
nuclei -target https://target.example.com \
  -header-file headers.txt \
  -json -output nuclei-auth.json
```

### 4. API Security Testing

#### REST API Testing

```bash
# ZAP API scan with OpenAPI
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -J api-report.json

# Nuclei API scanning
nuclei -target https://api.example.com \
  -tags api \
  -json -output api-nuclei.json
```

#### GraphQL Testing

```bash
# ZAP GraphQL scan
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t https://api.example.com/graphql \
  -f graphql \
  -J graphql-report.json

# Nuclei GraphQL templates
nuclei -target https://api.example.com/graphql \
  -tags graphql \
  -json -output graphql-nuclei.json
```

### 5. SAST/DAST Correlation

Correlate static and dynamic findings:

```json
{
  "correlation_report": {
    "sast_findings": 45,
    "dast_findings": 28,
    "correlated": 12,
    "sast_only": 33,
    "dast_only": 16,
    "correlations": [
      {
        "vulnerability_type": "SQL Injection",
        "sast_finding": {
          "file": "src/api/users.py",
          "line": 42,
          "rule": "python.lang.security.audit.dangerous-sql"
        },
        "dast_finding": {
          "url": "https://api.example.com/users",
          "parameter": "id",
          "evidence": "SQL syntax error"
        },
        "confidence": "high",
        "recommendation": "Priority fix - confirmed vulnerable endpoint"
      }
    ]
  }
}
```

### 6. Scan Scope Management

```yaml
# scan-scope.yaml
scope:
  includes:
    - "https://target.example.com/*"
    - "https://api.target.example.com/*"
  excludes:
    - "*/logout"
    - "*/signout"
    - "*delete*"
    - "*payment*"
    - "*/static/*"
    - "*/assets/*"

rate_limiting:
  requests_per_second: 20
  delay_between_requests_ms: 50
  max_concurrent_connections: 10

authentication:
  type: bearer
  token_refresh_url: "https://auth.example.com/token"
  token_header: "Authorization"
  token_prefix: "Bearer "

scan_policy:
  attack_strength: medium
  alert_threshold: low
  scanners:
    enabled:
      - sql-injection
      - xss-reflected
      - xss-stored
      - command-injection
      - path-traversal
    disabled:
      - format-string
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| ZAP-MCP | AI-powered OWASP ZAP integration | [GitHub](https://github.com/ajtazer/ZAP-MCP) |
| pentestMCP | 20+ tools including ZAP, Nuclei | [GitHub](https://github.com/ramkansal/pentestMCP) |
| HexStrike AI | 150+ cybersecurity tools | [GitHub](https://github.com/0x4m4/hexstrike-ai) |
| SecOpsAgentKit dast-zap | ZAP integration | [GitHub](https://github.com/AgentSecOps/SecOpsAgentKit) |
| SecOpsAgentKit dast-nuclei | Nuclei integration | [GitHub](https://github.com/AgentSecOps/SecOpsAgentKit) |

## Best Practices

### Scanning Strategy

1. **Passive first** - Start with passive scanning
2. **Scope carefully** - Define clear boundaries
3. **Rate limit** - Respect target infrastructure
4. **Authenticate** - Test authenticated areas
5. **Schedule wisely** - Avoid peak hours

### CI/CD Integration

```yaml
# GitHub Actions
name: DAST Scan
on:
  schedule:
    - cron: '0 2 * * *'  # Nightly
  workflow_dispatch:

jobs:
  dast:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Scan
        uses: zaproxy/action-full-scan@v0.8.0
        with:
          target: ${{ secrets.STAGING_URL }}
          allow_issue_writing: false

      - name: Nuclei Scan
        uses: projectdiscovery/nuclei-action@main
        with:
          target: ${{ secrets.STAGING_URL }}
          flags: "-severity critical,high -json"
```

## Process Integration

This skill integrates with the following processes:
- `dast-scanning.js` - DAST pipeline integration
- `penetration-testing.js` - Pen testing workflow
- `devsecops-pipeline.js` - DevSecOps automation
- `vulnerability-management.js` - Vulnerability lifecycle

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "dast-scan",
  "status": "completed",
  "target": "https://target.example.com",
  "tools_used": ["zap", "nuclei"],
  "scan_duration_seconds": 2340,
  "summary": {
    "total_findings": 58,
    "by_severity": {
      "critical": 3,
      "high": 12,
      "medium": 25,
      "low": 18
    },
    "by_tool": {
      "zap": 42,
      "nuclei": 16
    },
    "by_category": {
      "injection": 8,
      "xss": 12,
      "misconfiguration": 15,
      "information_disclosure": 10,
      "authentication": 5,
      "other": 8
    }
  },
  "coverage": {
    "urls_scanned": 245,
    "endpoints_tested": 89,
    "parameters_tested": 312
  },
  "top_findings": [
    {
      "severity": "critical",
      "name": "SQL Injection",
      "url": "https://target.example.com/api/users",
      "parameter": "id",
      "tool": "zap",
      "cweid": "89",
      "wascid": "19"
    }
  ],
  "artifacts": ["zap-report.json", "nuclei-results.json", "combined-dast.html"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Connection timeout` | Target unreachable | Check network/firewall |
| `Authentication failed` | Invalid credentials | Verify auth config |
| `Rate limited` | Too aggressive | Reduce scan speed |
| `Scan interrupted` | Resource exhaustion | Increase resources |

## Constraints

- Always obtain proper authorization before scanning
- Never scan production without explicit approval
- Configure appropriate rate limits
- Exclude destructive actions from scope
- Monitor target health during scans
- Document all findings with evidence
