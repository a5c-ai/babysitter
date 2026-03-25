---
name: dependency-scanner
description: Software Composition Analysis (SCA) and dependency vulnerability scanning. Scan npm, pip, maven, gradle dependencies. Check CVE databases, generate SBOM (CycloneDX, SPDX), identify license compliance issues, and track EPSS scores for prioritization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: security-testing
  backlog-id: SK-SEC-004
---

# dependency-scanner

You are **dependency-scanner** - a specialized skill for Software Composition Analysis (SCA) and dependency vulnerability scanning. This skill provides comprehensive capabilities for identifying security vulnerabilities and license compliance issues in third-party dependencies.

## Overview

This skill enables AI-powered SCA including:
- Multi-ecosystem dependency scanning (npm, pip, maven, gradle, go, rust)
- CVE database queries (NVD, OSV, GitHub Advisory)
- SBOM generation (CycloneDX, SPDX)
- License compliance checking
- EPSS score integration for exploit prioritization
- Automated dependency update PR generation

## Prerequisites

- Package manifest files (package.json, requirements.txt, pom.xml, etc.)
- CLI tools: trivy, npm, pip, snyk (optional), grype (optional)
- Network access for CVE database queries

## Capabilities

### 1. Trivy Dependency Scanning

Universal vulnerability scanner for multiple ecosystems:

```bash
# Scan filesystem for vulnerabilities
trivy fs --scanners vuln --format json -o trivy-results.json .

# Scan specific manifest
trivy fs --scanners vuln package-lock.json

# Scan with severity filter
trivy fs --severity HIGH,CRITICAL --format json .

# Generate SBOM
trivy fs --format cyclonedx -o sbom.json .
trivy fs --format spdx-json -o sbom-spdx.json .

# Scan container image
trivy image --format json myapp:latest

# Include license information
trivy fs --scanners vuln,license --format json .

# Scan with ignore file
trivy fs --ignorefile .trivyignore --format json .
```

#### Trivy Supported Ecosystems

| Ecosystem | Files Scanned |
|-----------|---------------|
| npm | package-lock.json, yarn.lock, pnpm-lock.yaml |
| pip | requirements.txt, Pipfile.lock, poetry.lock |
| Go | go.sum, go.mod |
| Ruby | Gemfile.lock |
| Rust | Cargo.lock |
| .NET | packages.lock.json, *.deps.json |
| Maven | pom.xml |
| Gradle | gradle.lockfile |
| Composer | composer.lock |

### 2. npm Audit

Native npm vulnerability scanning:

```bash
# Basic audit
npm audit --json > npm-audit.json

# Audit with severity filter
npm audit --audit-level=high --json

# Production dependencies only
npm audit --production --json

# Auto-fix vulnerabilities
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force

# Dry-run fix
npm audit fix --dry-run --json
```

#### npm Audit Output Schema

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {
    "lodash": {
      "name": "lodash",
      "severity": "high",
      "isDirect": false,
      "via": ["prototype-pollution"],
      "effects": ["other-package"],
      "range": "<4.17.21",
      "nodes": ["node_modules/lodash"],
      "fixAvailable": {
        "name": "lodash",
        "version": "4.17.21",
        "isSemVerMajor": false
      }
    }
  },
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 2,
      "moderate": 5,
      "high": 3,
      "critical": 1,
      "total": 11
    }
  }
}
```

### 3. pip-audit for Python

```bash
# Install pip-audit
pip install pip-audit

# Basic scan
pip-audit --format json > pip-audit.json

# Scan requirements file
pip-audit -r requirements.txt --format json

# Scan with strict mode (fail on any vulnerability)
pip-audit --strict

# Output in CycloneDX format
pip-audit --format cyclonedx-json > python-sbom.json

# Fix vulnerabilities
pip-audit --fix

# Use OSV database
pip-audit --vulnerability-service osv
```

### 4. OWASP Dependency-Check

Comprehensive vulnerability scanner:

```bash
# Run dependency check
dependency-check --project "MyApp" \
  --scan . \
  --format JSON \
  --out ./dependency-check-report.json

# Scan specific paths
dependency-check --project "MyApp" \
  --scan ./src \
  --scan ./lib \
  --format JSON

# Update CVE database
dependency-check --updateonly

# Fail on CVSS score
dependency-check --project "MyApp" \
  --scan . \
  --failOnCVSS 7 \
  --format JSON
```

### 5. Grype Container/Filesystem Scanning

```bash
# Scan directory
grype dir:. --output json > grype-results.json

# Scan container image
grype myapp:latest --output json

# Scan SBOM
grype sbom:./sbom.json --output json

# Filter by severity
grype dir:. --only-fixed --fail-on high

# Output formats
grype dir:. --output cyclonedx  # CycloneDX SBOM with vulns
grype dir:. --output sarif      # SARIF for GitHub
```

### 6. SBOM Generation

#### CycloneDX Format

```bash
# Generate with Trivy
trivy fs --format cyclonedx -o sbom-cyclonedx.json .

# Generate with Syft
syft . -o cyclonedx-json > sbom-cyclonedx.json

# For npm projects
npx @cyclonedx/cyclonedx-npm --output-file npm-sbom.json
```

#### SPDX Format

```bash
# Generate with Trivy
trivy fs --format spdx-json -o sbom-spdx.json .

# Generate with Syft
syft . -o spdx-json > sbom-spdx.json

# For Python projects
pip install spdx-tools
python -m spdx.creationinfo
```

#### SBOM Schema (CycloneDX)

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "metadata": {
    "timestamp": "2026-01-24T10:00:00Z",
    "tools": [{"name": "trivy", "version": "0.50.0"}],
    "component": {
      "name": "myapp",
      "version": "1.0.0",
      "type": "application"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "lodash",
      "version": "4.17.21",
      "purl": "pkg:npm/lodash@4.17.21",
      "licenses": [{"license": {"id": "MIT"}}]
    }
  ],
  "vulnerabilities": [
    {
      "id": "CVE-2021-23337",
      "source": {"name": "NVD"},
      "ratings": [{"severity": "high", "score": 7.2}],
      "affects": [{"ref": "pkg:npm/lodash@4.17.20"}]
    }
  ]
}
```

### 7. License Compliance

```bash
# Check licenses with Trivy
trivy fs --scanners license --format json .

# License finder
license_finder

# FOSSA CLI (requires account)
fossa analyze

# npm license checker
npx license-checker --json > licenses.json

# pip-licenses for Python
pip install pip-licenses
pip-licenses --format=json > python-licenses.json
```

#### License Risk Categories

| Risk Level | Licenses | Policy |
|------------|----------|--------|
| Low | MIT, BSD, Apache 2.0 | Generally permissive |
| Medium | LGPL, MPL | Conditional requirements |
| High | GPL, AGPL | Strong copyleft |
| Critical | SSPL, Proprietary | Restrictions may apply |

### 8. EPSS Score Integration

Exploit Prediction Scoring System for prioritization:

```python
# Python example for EPSS integration
import requests

def get_epss_score(cve_id):
    """Get EPSS score for a CVE"""
    url = f"https://api.first.org/data/v1/epss?cve={cve_id}"
    response = requests.get(url)
    data = response.json()
    if data['data']:
        return {
            'cve': cve_id,
            'epss': float(data['data'][0]['epss']),
            'percentile': float(data['data'][0]['percentile'])
        }
    return None
```

#### Prioritization Matrix

| CVSS Score | EPSS Score | Priority |
|------------|------------|----------|
| >= 9.0 | >= 0.5 | Critical (24h) |
| >= 7.0 | >= 0.3 | High (7 days) |
| >= 4.0 | >= 0.1 | Medium (30 days) |
| < 4.0 | < 0.1 | Low (90 days) |

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| SecOpsAgentKit sca-trivy | Trivy SCA integration | [GitHub](https://github.com/AgentSecOps/SecOpsAgentKit) |
| sast-mcp | Multi-tool SCA support | [GitHub](https://github.com/Sengtocxoen/sast-mcp) |
| Trivy MCP | Official Aqua Security MCP | [GitHub](https://github.com/aquasecurity/trivy-mcp) |

## Best Practices

### Scanning Strategy

1. **CI/CD Integration** - Scan on every commit/PR
2. **Baseline Management** - Track known vulnerabilities
3. **Update Cadence** - Regular dependency updates
4. **SBOM Generation** - Maintain inventory for compliance

### Prioritization Guidelines

1. **Direct vs Transitive** - Prioritize direct dependencies
2. **EPSS + CVSS** - Combine scores for real-world risk
3. **Exploitability** - Check for known exploits in the wild
4. **Business Context** - Consider affected functionality

### Dependency Update Strategy

```yaml
# Dependabot configuration example
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      security:
        applies-to: security-updates
        patterns:
          - "*"
```

## Process Integration

This skill integrates with the following processes:
- `sca-management.js` - SCA pipeline integration
- `devsecops-pipeline.js` - DevSecOps automation
- `vulnerability-management.js` - Vulnerability lifecycle
- `compliance-sbom.js` - SBOM compliance reporting

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "dependency-scan",
  "status": "completed",
  "ecosystem": "npm",
  "manifest": "package-lock.json",
  "scan_duration_seconds": 12,
  "summary": {
    "total_dependencies": 245,
    "direct_dependencies": 32,
    "vulnerabilities": {
      "critical": 2,
      "high": 5,
      "medium": 12,
      "low": 8
    },
    "licenses": {
      "permissive": 230,
      "copyleft": 10,
      "unknown": 5
    }
  },
  "top_vulnerabilities": [
    {
      "cve": "CVE-2024-12345",
      "package": "example-lib",
      "version": "1.2.3",
      "severity": "critical",
      "cvss": 9.8,
      "epss": 0.72,
      "fix_version": "1.2.4",
      "direct": false,
      "path": "myapp > dep-a > example-lib"
    }
  ],
  "sbom_generated": true,
  "artifacts": ["trivy-results.json", "sbom-cyclonedx.json", "licenses.json"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `No lockfile found` | Missing dependency lock | Generate lockfile first |
| `Database update failed` | Network issues | Check connectivity, retry |
| `Unknown package` | Private/internal package | Configure private registry |
| `Rate limited` | Too many API calls | Implement caching |

## Constraints

- Maintain dependency lock files for accurate scanning
- Configure private registries for internal packages
- Cache vulnerability databases for offline scanning
- Track SBOM for compliance and audit purposes
- Monitor for new CVEs affecting existing dependencies
