---
name: Static Analysis Tools Skill
description: Integration with security-focused static analysis tools
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Static Analysis Tools Skill

## Overview

This skill provides integration with security-focused static analysis tools for comprehensive code security analysis.

## Capabilities

- Execute Semgrep rules and custom patterns
- Run CodeQL queries for vulnerability detection
- Execute Bandit (Python), Brakeman (Ruby), etc.
- Parse and interpret static analysis results
- Generate custom detection rules
- Aggregate findings across tools
- Map findings to CWE/CVE identifiers
- Support SAST pipeline integration

## Target Processes

- static-code-analysis.js
- variant-analysis.js
- web-app-vuln-research.js
- api-security-research.js

## Dependencies

- Semgrep CLI
- CodeQL CLI and databases
- Language-specific analyzers:
  - Bandit (Python)
  - Brakeman (Ruby)
  - gosec (Go)
  - SpotBugs (Java)
- Python for result aggregation

## Usage Context

This skill is essential for:
- Security code review automation
- Vulnerability pattern detection
- Custom security rule development
- CI/CD security gate integration
- Variant analysis across codebases

## Integration Notes

- Supports multiple output formats (SARIF, JSON, custom)
- Can run incrementally on changed files
- Integrates with IDE and CI/CD workflows
- Custom rules can be version controlled
- Results can be deduplicated and triaged
