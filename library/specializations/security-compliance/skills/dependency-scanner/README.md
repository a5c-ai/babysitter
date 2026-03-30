# Dependency Scanner Skill

## Overview

The `dependency-scanner` skill provides Software Composition Analysis (SCA) and dependency vulnerability scanning. It enables AI-powered detection of security vulnerabilities and license compliance issues in third-party dependencies across multiple package ecosystems.

## Quick Start

### Prerequisites

1. **Trivy** - Universal vulnerability scanner
   ```bash
   brew install trivy
   # or
   curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
   ```

2. **Syft** - SBOM generator (optional)
   ```bash
   brew install syft
   ```

3. **Grype** - Vulnerability scanner (optional)
   ```bash
   brew install grype
   ```

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For MCP integration:

```bash
# Install Trivy MCP
npm install -g trivy-mcp
```

## Usage

### Basic Operations

```bash
# Scan dependencies for vulnerabilities
/skill dependency-scanner scan --path . --output ./vuln-report.json

# Generate SBOM
/skill dependency-scanner sbom --format cyclonedx --output ./sbom.json

# Check license compliance
/skill dependency-scanner licenses --path . --policy ./license-policy.yaml

# Scan and prioritize by EPSS
/skill dependency-scanner scan --path . --prioritize epss
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(dependencyScanTask, {
  operation: 'scan',
  path: '.',
  ecosystems: ['npm', 'pip'],
  config: {
    severity: ['critical', 'high'],
    includeDevDependencies: false,
    generateSbom: true,
    sbomFormat: 'cyclonedx'
  },
  prioritization: {
    useEpss: true,
    threshold: 0.3
  },
  output: {
    format: 'json',
    includeRemediation: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Ecosystem** | npm, pip, maven, gradle, go, rust, ruby |
| **Vulnerability Detection** | CVE/NVD, OSV, GitHub Advisory |
| **SBOM Generation** | CycloneDX, SPDX formats |
| **License Compliance** | Policy enforcement |
| **EPSS Integration** | Exploit probability scoring |
| **Auto-Remediation** | Update PR generation |

## Supported Ecosystems

| Ecosystem | Manifest Files | Scanner |
|-----------|----------------|---------|
| npm | package-lock.json, yarn.lock | Trivy, npm audit |
| pip | requirements.txt, Pipfile.lock | Trivy, pip-audit |
| Maven | pom.xml | Trivy, OWASP DC |
| Gradle | gradle.lockfile | Trivy |
| Go | go.sum, go.mod | Trivy |
| Rust | Cargo.lock | Trivy |
| Ruby | Gemfile.lock | Trivy |
| .NET | packages.lock.json | Trivy |

## Examples

### Example 1: CI/CD Vulnerability Scan

```bash
# Scan with severity gate
/skill dependency-scanner scan \
  --path . \
  --severity critical,high \
  --fail-on critical \
  --output ./ci-vuln-report.json
```

Results include:
- Vulnerability count by severity
- Direct vs transitive dependency breakdown
- Fix availability information
- CI exit code based on threshold

### Example 2: SBOM for Compliance

```bash
# Generate comprehensive SBOM
/skill dependency-scanner sbom \
  --path . \
  --format cyclonedx \
  --include-licenses \
  --include-vulns \
  --output ./compliance-sbom.json
```

Generates:
- Complete dependency tree
- License information per component
- Known vulnerabilities mapped to components
- Package URLs (purl) for identification

### Example 3: License Policy Enforcement

```bash
# Check license compliance against policy
/skill dependency-scanner licenses \
  --path . \
  --policy strict \
  --deny GPL,AGPL \
  --output ./license-report.json
```

Checks:
- Identifies all licenses in use
- Flags policy violations
- Provides dependency paths to violations
- Suggests alternatives where available

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TRIVY_CACHE_DIR` | Trivy database cache | `~/.cache/trivy` |
| `EPSS_API_URL` | EPSS API endpoint | `api.first.org` |
| `SCA_TIMEOUT` | Scan timeout seconds | `300` |
| `PRIVATE_REGISTRY_URL` | Private npm/pip registry | - |

### Skill Configuration

```yaml
# .babysitter/skills/dependency-scanner.yaml
dependency-scanner:
  defaultScanner: trivy
  ecosystems:
    npm:
      scanner: trivy
      includeDevDeps: false
      lockfileRequired: true
    pip:
      scanner: trivy
      lockfileRequired: false
  severity:
    failOn:
      - critical
    reportOn:
      - critical
      - high
      - medium
  sbom:
    format: cyclonedx
    version: "1.5"
    includeLicenses: true
    includeVulns: true
  licenses:
    deny:
      - GPL-3.0
      - AGPL-3.0
    warn:
      - LGPL-3.0
      - MPL-2.0
    allow:
      - MIT
      - Apache-2.0
      - BSD-*
  epss:
    enabled: true
    threshold: 0.1
    priorityBoost: true
```

## Process Integration

### Processes Using This Skill

1. **sca-management.js** - SCA lifecycle management
2. **devsecops-pipeline.js** - DevSecOps automation
3. **vulnerability-management.js** - Vulnerability lifecycle
4. **compliance-sbom.js** - SBOM compliance reporting

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const dependencyScanTask = defineTask({
  name: 'dependency-scan',
  description: 'Scan dependencies for vulnerabilities and license issues',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Dependency scan for ${inputs.projectName}`,
      skill: {
        name: 'dependency-scanner',
        context: {
          operation: 'full-scan',
          path: inputs.projectPath,
          config: {
            severity: inputs.severityFilter || ['critical', 'high'],
            includeDevDeps: inputs.includeDevDeps || false,
            generateSbom: true,
            sbomFormat: 'cyclonedx'
          },
          licensing: {
            checkCompliance: true,
            policy: inputs.licensePolicy || 'permissive'
          },
          prioritization: {
            useEpss: true,
            includeCvss: true
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

### Trivy MCP

Official Aqua Security MCP plugin for Trivy vulnerability scanning.

**Key Features:**
- Filesystem and container scanning
- Multi-format output (JSON, SARIF, CycloneDX)
- Severity filtering
- Database auto-updates

**Installation:**
```bash
npm install -g trivy-mcp
```

**GitHub:** https://github.com/aquasecurity/trivy-mcp

### SecOpsAgentKit sca-trivy

Comprehensive SCA integration with CVSS/EPSS scoring.

**Installation:**
See [SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit)

## Prioritization Framework

### EPSS + CVSS Matrix

| CVSS | EPSS >= 0.5 | EPSS 0.1-0.5 | EPSS < 0.1 |
|------|-------------|--------------|------------|
| Critical (9+) | P1 (24h) | P1 (48h) | P2 (7d) |
| High (7-8.9) | P1 (48h) | P2 (7d) | P2 (14d) |
| Medium (4-6.9) | P2 (7d) | P3 (30d) | P3 (60d) |
| Low (< 4) | P3 (30d) | P4 (90d) | P4 (Backlog) |

### Factors for Prioritization

1. **Exploitability** - EPSS score, known exploits
2. **Impact** - CVSS score, business criticality
3. **Reachability** - Is the vulnerable code path reachable?
4. **Fix Availability** - Is a patched version available?
5. **Dependency Type** - Direct vs transitive

## SBOM Standards

### CycloneDX vs SPDX

| Feature | CycloneDX | SPDX |
|---------|-----------|------|
| Primary Focus | Security/Vulnerability | Licensing |
| Vulnerability Mapping | Native | Extension |
| Tool Support | Excellent | Good |
| Government Mandates | Both accepted | NTIA preferred |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Missing lockfile | Generate: `npm install`, `pip freeze` |
| Outdated database | Run `trivy db update` |
| Private packages | Configure registry credentials |
| Slow scans | Enable database caching |

### Debug Mode

```bash
# Enable verbose logging
TRIVY_DEBUG=true /skill dependency-scanner scan \
  --path . \
  --verbose
```

## Related Skills

- **sast-analyzer** - Static code analysis
- **container-security-scanner** - Container image scanning
- **secret-detection-scanner** - Secret detection
- **iac-security-scanner** - Infrastructure security

## References

- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)
- [CycloneDX Specification](https://cyclonedx.org/specification/)
- [SPDX Specification](https://spdx.dev/specifications/)
- [FIRST EPSS](https://www.first.org/epss/)
- [NVD CVE Database](https://nvd.nist.gov/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SEC-004
**Category:** Security Testing
**Status:** Active
