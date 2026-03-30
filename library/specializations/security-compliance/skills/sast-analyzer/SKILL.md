---
name: sast-analyzer
description: Static Application Security Testing orchestration and analysis. Execute Semgrep, Bandit, ESLint security plugins, CodeQL, and other SAST tools. Parse, prioritize, and deduplicate findings across multiple tools with remediation guidance.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: security-testing
  backlog-id: SK-SEC-002
---

# sast-analyzer

You are **sast-analyzer** - a specialized skill for Static Application Security Testing (SAST) orchestration and analysis. This skill provides comprehensive capabilities for detecting security vulnerabilities in source code through static analysis.

## Overview

This skill enables AI-powered SAST including:
- Semgrep security rule execution and custom rule creation
- Bandit Python security analysis
- ESLint security plugin scanning for JavaScript/TypeScript
- CodeQL advanced semantic analysis
- Multi-tool result aggregation and deduplication
- OWASP and CWE mapping for findings
- Prioritized remediation guidance

## Prerequisites

- Source code repository to scan
- CLI tools installed: semgrep, bandit, eslint, codeql (as needed)
- Node.js/npm for ESLint plugins
- Python for Bandit

## Capabilities

### 1. Semgrep Security Scanning

Execute Semgrep with comprehensive security rulesets:

```bash
# Run with auto config (detects languages)
semgrep scan --config auto --json > semgrep-results.json

# Run OWASP Top 10 rules
semgrep scan --config "p/owasp-top-ten" --json

# Run language-specific security rules
semgrep scan --config "p/python" --config "p/security-audit" .

# Run with custom rules
semgrep scan --config ./custom-rules/ --json

# CI-friendly output with SARIF
semgrep scan --config auto --sarif -o results.sarif

# Scan specific paths
semgrep scan --config auto --include="src/**" --exclude="**/test/**"
```

#### Semgrep Rule Packs

| Pack | Description | Use Case |
|------|-------------|----------|
| `p/owasp-top-ten` | OWASP Top 10 vulnerabilities | General web security |
| `p/security-audit` | Comprehensive security audit | Deep security review |
| `p/ci` | Fast, high-confidence rules | CI/CD pipelines |
| `p/secrets` | Hardcoded secrets detection | Pre-commit checks |
| `p/python` | Python-specific security | Python projects |
| `p/javascript` | JavaScript security | JS/TS projects |
| `p/java` | Java security rules | Java projects |
| `p/go` | Go security rules | Go projects |

### 2. Bandit Python Security Analysis

```bash
# Basic scan with JSON output
bandit -r ./src -f json -o bandit-results.json

# Scan with specific severity levels
bandit -r ./src -ll -ii -f json  # medium and above

# Exclude test directories
bandit -r ./src --exclude ./tests,./venv -f json

# Run specific tests only
bandit -r ./src -t B101,B102,B103 -f json

# Generate SARIF output
bandit -r ./src -f sarif -o bandit.sarif

# Show only high severity
bandit -r ./src -lll -f json
```

#### Bandit Test Categories

| Test ID | Name | Severity |
|---------|------|----------|
| B101 | assert_used | Low |
| B102 | exec_used | Medium |
| B103 | set_bad_file_permissions | Medium |
| B104 | hardcoded_bind_all_interfaces | Medium |
| B105-B107 | hardcoded_passwords | Low |
| B108 | hardcoded_tmp_directory | Medium |
| B110 | try_except_pass | Low |
| B201 | flask_debug_true | High |
| B301-B303 | pickle/marshal | Medium |
| B501-B508 | SSL/TLS issues | High |
| B601-B602 | shell_injection | High |
| B608 | sql_injection | Medium |

### 3. ESLint Security Scanning

```bash
# Install security plugins
npm install --save-dev eslint-plugin-security eslint-plugin-no-secrets

# Run ESLint with security rules
eslint --config .eslintrc.security.js --format json -o eslint-results.json src/

# Run with SARIF formatter
npx eslint --config .eslintrc.security.js --format @microsoft/eslint-formatter-sarif -o eslint.sarif src/
```

#### ESLint Security Configuration

```javascript
// .eslintrc.security.js
module.exports = {
  plugins: ['security', 'no-secrets'],
  extends: ['plugin:security/recommended'],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'warn',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-unsafe-regex': 'error',
    'no-secrets/no-secrets': ['error', { tolerance: 4.5 }]
  }
};
```

### 4. CodeQL Analysis

```bash
# Create CodeQL database
codeql database create codeql-db --language=javascript --source-root=.

# Run security queries
codeql database analyze codeql-db \
  codeql/javascript-queries:codeql-suites/javascript-security-extended.qls \
  --format=sarif-latest \
  --output=codeql-results.sarif

# Run for multiple languages
codeql database create codeql-db --language=javascript,python

# Run specific security queries
codeql database analyze codeql-db \
  codeql/javascript-queries:Security/CWE-079/XssThroughDom.ql \
  --format=json
```

#### CodeQL Security Query Suites

| Suite | Coverage |
|-------|----------|
| `javascript-security-extended.qls` | Extended JS security |
| `python-security-extended.qls` | Extended Python security |
| `java-security-extended.qls` | Extended Java security |
| `csharp-security-extended.qls` | Extended C# security |
| `go-security-extended.qls` | Extended Go security |

### 5. Multi-Tool Aggregation

Combine and deduplicate results from multiple SAST tools:

```bash
# Run all tools and aggregate
semgrep scan --config auto --sarif -o semgrep.sarif
bandit -r ./src -f sarif -o bandit.sarif
eslint --format @microsoft/eslint-formatter-sarif -o eslint.sarif src/

# Parse and aggregate SARIF files
node aggregate-sarif.js semgrep.sarif bandit.sarif eslint.sarif > combined.json
```

#### Result Normalization Schema

```json
{
  "findings": [
    {
      "id": "finding-001",
      "tool": "semgrep",
      "rule_id": "python.lang.security.audit.dangerous-system-call",
      "severity": "high",
      "confidence": "high",
      "cwe": ["CWE-78"],
      "owasp": ["A03:2021"],
      "file": "src/utils/exec.py",
      "line": 42,
      "column": 5,
      "snippet": "os.system(user_input)",
      "message": "Dangerous system call with user-controlled input",
      "remediation": "Use subprocess.run with shell=False and explicit arguments",
      "references": [
        "https://cwe.mitre.org/data/definitions/78.html"
      ],
      "duplicates": ["bandit-B602"],
      "status": "open"
    }
  ],
  "summary": {
    "total": 45,
    "critical": 2,
    "high": 8,
    "medium": 15,
    "low": 20,
    "deduplicated": 12
  }
}
```

### 6. Custom Semgrep Rule Creation

```yaml
# custom-rules/sql-injection.yaml
rules:
  - id: custom-sql-injection
    languages: [python]
    severity: ERROR
    message: >
      Possible SQL injection vulnerability. User input '$INPUT'
      is concatenated into SQL query.
    patterns:
      - pattern-either:
        - pattern: |
            $QUERY = "..." + $INPUT + "..."
            $CURSOR.execute($QUERY)
        - pattern: |
            $CURSOR.execute("..." + $INPUT + "...")
        - pattern: |
            $CURSOR.execute(f"...{$INPUT}...")
    metadata:
      cwe: "CWE-89"
      owasp: "A03:2021 - Injection"
      confidence: HIGH
      impact: HIGH
      category: security
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| sast-mcp | 23+ security tools integration | [GitHub](https://github.com/Sengtocxoen/sast-mcp) |
| Semgrep MCP | Official Semgrep integration | [GitHub](https://github.com/semgrep/mcp) |
| SecOpsAgentKit | Multi-tool SAST orchestration | [GitHub](https://github.com/AgentSecOps/SecOpsAgentKit) |

### sast-mcp Features

- Multi-language support (Python, JavaScript, Go, Java, etc.)
- Integration with 23+ security tools
- SARIF and JSON output formats
- Automatic language detection
- CI/CD pipeline integration

## Best Practices

### Scanning Strategy

1. **Incremental scanning** - Scan only changed files in CI
2. **Full scans periodically** - Weekly comprehensive scans
3. **Pre-commit hooks** - Catch issues before commit
4. **Multiple tools** - Different tools catch different issues

### Triage and Prioritization

1. **Severity + Exploitability** - High severity + easily exploitable = critical
2. **Business context** - Consider asset criticality
3. **False positive rate** - Track and tune rules
4. **Fix difficulty** - Quick wins vs. architectural changes

### CI/CD Integration

```yaml
# GitHub Actions example
name: SAST Scan
on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Semgrep Scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/owasp-top-ten

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: semgrep.sarif
```

## Process Integration

This skill integrates with the following processes:
- `sast-pipeline.js` - CI/CD SAST integration
- `secure-sdlc.js` - Security in development lifecycle
- `devsecops-pipeline.js` - DevSecOps automation
- `security-code-review.js` - Security-focused code review

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "sast-scan",
  "status": "completed",
  "tools_executed": ["semgrep", "bandit", "eslint"],
  "scan_duration_seconds": 45,
  "summary": {
    "total_findings": 32,
    "by_severity": {
      "critical": 1,
      "high": 5,
      "medium": 12,
      "low": 14
    },
    "by_tool": {
      "semgrep": 18,
      "bandit": 8,
      "eslint": 6
    },
    "deduplicated_count": 5
  },
  "top_issues": [
    {
      "rule": "sql-injection",
      "count": 3,
      "severity": "critical",
      "files": ["src/db/queries.py", "src/api/users.py"]
    }
  ],
  "artifacts": ["semgrep.sarif", "bandit.json", "eslint.json", "combined-report.json"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Rule not found` | Invalid rule pack name | Verify rule pack exists |
| `Parse error` | Syntax error in source | Check file encoding/syntax |
| `Timeout` | Large codebase | Increase timeout or scan incrementally |
| `Memory exceeded` | Too many files | Exclude generated/vendor files |

## Constraints

- Respect rate limits on cloud-based scanning services
- Exclude generated code, vendor directories, and test fixtures
- Handle large codebases with incremental scanning
- Document all custom rules and their rationale
- Track false positive rates and tune rules accordingly
