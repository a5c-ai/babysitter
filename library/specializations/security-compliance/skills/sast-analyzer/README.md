# SAST Analyzer Skill

## Overview

The `sast-analyzer` skill provides Static Application Security Testing (SAST) orchestration and analysis. It enables AI-powered security scanning across multiple tools including Semgrep, Bandit, ESLint security plugins, and CodeQL, with intelligent result aggregation and prioritized remediation guidance.

## Quick Start

### Prerequisites

1. **Semgrep** - Primary SAST tool
   ```bash
   pip install semgrep
   # or
   brew install semgrep
   ```

2. **Bandit** - Python security scanner
   ```bash
   pip install bandit
   ```

3. **ESLint** - JavaScript/TypeScript scanner
   ```bash
   npm install -g eslint eslint-plugin-security
   ```

4. **CodeQL** (optional) - Advanced semantic analysis
   ```bash
   # Download from GitHub
   gh release download -R github/codeql-cli-binaries
   ```

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For MCP integration:

```bash
# Install sast-mcp for comprehensive tool integration
npm install -g sast-mcp
```

## Usage

### Basic Operations

```bash
# Run comprehensive SAST scan
/skill sast-analyzer scan --path ./src --output ./security-report.json

# Run specific tool
/skill sast-analyzer scan --tool semgrep --config p/owasp-top-ten --path ./src

# Scan with multiple tools
/skill sast-analyzer scan --tools semgrep,bandit,eslint --path ./src

# Create custom Semgrep rule
/skill sast-analyzer create-rule --type injection --language python
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(sastTask, {
  operation: 'scan',
  path: './src',
  tools: ['semgrep', 'bandit'],
  config: {
    semgrep: {
      rulePacks: ['p/owasp-top-ten', 'p/security-audit'],
      exclude: ['**/test/**', '**/vendor/**']
    },
    bandit: {
      severity: 'medium',
      confidence: 'high'
    }
  },
  output: {
    format: 'sarif',
    deduplicate: true,
    includeRemediation: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Tool Scanning** | Semgrep, Bandit, ESLint, CodeQL |
| **Result Aggregation** | Combine and deduplicate findings |
| **OWASP/CWE Mapping** | Map findings to standards |
| **Custom Rules** | Create and manage custom rules |
| **CI/CD Integration** | GitHub Actions, GitLab CI, Jenkins |
| **Remediation Guidance** | Prioritized fix recommendations |

## Supported Languages

| Language | Tools | Rule Coverage |
|----------|-------|---------------|
| Python | Semgrep, Bandit | Comprehensive |
| JavaScript/TypeScript | Semgrep, ESLint, CodeQL | Comprehensive |
| Java | Semgrep, CodeQL | Comprehensive |
| Go | Semgrep, CodeQL | Good |
| C/C++ | Semgrep, CodeQL | Good |
| Ruby | Semgrep | Good |
| PHP | Semgrep | Good |
| Kotlin | Semgrep | Moderate |
| Swift | Semgrep | Moderate |

## Examples

### Example 1: OWASP Top 10 Scan

```bash
# Scan for OWASP Top 10 vulnerabilities
/skill sast-analyzer scan \
  --path ./src \
  --ruleset owasp-top-ten \
  --output ./owasp-report.json \
  --format sarif
```

Results include:
- Injection flaws (SQL, XSS, Command)
- Broken authentication patterns
- Sensitive data exposure
- Security misconfigurations
- Vulnerable dependencies references

### Example 2: CI Pipeline Integration

```bash
# Generate CI-optimized scan
/skill sast-analyzer ci-scan \
  --path ./src \
  --baseline ./baseline.json \
  --fail-on critical,high \
  --output ./ci-results.sarif
```

Features:
- Incremental scanning (changed files only)
- Baseline comparison (new issues only)
- Exit codes for CI gates
- SARIF for GitHub Security tab

### Example 3: Custom Rule Development

```bash
# Create custom Semgrep rule
/skill sast-analyzer create-rule \
  --name custom-api-key-check \
  --language python \
  --pattern 'api_key = "$VALUE"' \
  --severity high \
  --message "Hardcoded API key detected"
```

Generates:
- Semgrep YAML rule file
- Test cases for validation
- Documentation

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SEMGREP_RULES` | Default Semgrep rule packs | `auto` |
| `SAST_TIMEOUT` | Scan timeout in seconds | `300` |
| `SAST_MAX_FILES` | Maximum files to scan | `10000` |
| `SARIF_OUTPUT` | Enable SARIF output | `true` |

### Skill Configuration

```yaml
# .babysitter/skills/sast-analyzer.yaml
sast-analyzer:
  defaultTools:
    - semgrep
    - bandit
  semgrep:
    defaultConfig:
      - p/owasp-top-ten
      - p/security-audit
    exclude:
      - "**/test/**"
      - "**/vendor/**"
      - "**/node_modules/**"
  bandit:
    severityThreshold: medium
    confidenceThreshold: high
  eslint:
    plugins:
      - security
      - no-secrets
  output:
    format: sarif
    deduplicate: true
    includeRemediation: true
  ci:
    failOn:
      - critical
      - high
    baseline: .sast-baseline.json
```

## Process Integration

### Processes Using This Skill

1. **sast-pipeline.js** - SAST integration in CI/CD
2. **secure-sdlc.js** - Security throughout development
3. **devsecops-pipeline.js** - DevSecOps automation
4. **security-code-review.js** - Security-focused code review

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const sastScanTask = defineTask({
  name: 'sast-scan',
  description: 'Run comprehensive SAST analysis',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `SAST scan for ${inputs.projectName}`,
      skill: {
        name: 'sast-analyzer',
        context: {
          operation: 'scan',
          path: inputs.sourcePath,
          tools: inputs.tools || ['semgrep', 'bandit'],
          config: {
            semgrep: {
              rulePacks: inputs.rulePacks || ['p/owasp-top-ten'],
              exclude: inputs.exclude || ['**/test/**']
            }
          },
          output: {
            format: 'sarif',
            deduplicate: true,
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

### sast-mcp

Comprehensive MCP server integrating 23+ security tools with Claude Code.

**Key Features:**
- Multi-language SAST scanning
- Automatic language detection
- SARIF and JSON output
- Tool orchestration
- CI/CD integration

**Tools Included:**
- Semgrep, Bandit, ESLint Security
- Gosec, Brakeman, Bearer
- OWASP Dependency-Check
- And more...

**Installation:**
```bash
npm install -g sast-mcp
```

**GitHub:** https://github.com/Sengtocxoen/sast-mcp

### Semgrep MCP

Official Semgrep MCP server for rule execution.

**Installation:**
```bash
pip install semgrep-mcp
```

**GitHub:** https://github.com/semgrep/mcp

## Severity Classification

| Severity | Description | SLA |
|----------|-------------|-----|
| Critical | Easily exploitable, high impact | 24 hours |
| High | Exploitable, significant impact | 7 days |
| Medium | Limited exploitability | 30 days |
| Low | Minimal risk | 90 days |

## Remediation Guidance

### Injection Flaws

```python
# Vulnerable
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# Fixed
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

### Hardcoded Secrets

```python
# Vulnerable
API_KEY = "sk-1234567890abcdef"

# Fixed
API_KEY = os.environ.get("API_KEY")
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Scan timeout | Increase timeout or scan incrementally |
| High false positives | Tune rules, add suppressions |
| Missing findings | Add more rule packs |
| Memory issues | Exclude large/generated files |

### Debug Mode

```bash
# Enable verbose logging
SAST_DEBUG=true /skill sast-analyzer scan \
  --path ./src \
  --verbose
```

## Related Skills

- **dependency-scanner** - Software Composition Analysis
- **secret-detection-scanner** - Secret detection
- **dast-scanner** - Dynamic security testing
- **owasp-security-scanner** - OWASP vulnerability detection

## References

- [Semgrep Documentation](https://semgrep.dev/docs/)
- [Bandit Documentation](https://bandit.readthedocs.io/)
- [ESLint Security Plugin](https://github.com/eslint-community/eslint-plugin-security)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [OWASP SAST Tools](https://owasp.org/www-community/Source_Code_Analysis_Tools)
- [SARIF Specification](https://sarifweb.azurewebsites.net/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SEC-002
**Category:** Security Testing
**Status:** Active
