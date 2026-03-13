---
name: security-scanner
description: Run security scans including SAST, dependency scanning, and secret detection
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Security Scanner Skill

## Overview

Runs comprehensive security scans including SAST scanning with Semgrep/CodeQL, dependency vulnerability scanning with Snyk/OWASP, secret detection, and container image scanning.

## Capabilities

- SAST scanning (Semgrep, CodeQL)
- Dependency vulnerability scanning (Snyk, OWASP Dependency-Check)
- Secret detection (git-secrets, truffleHog, gitleaks)
- Container image scanning (Trivy, Grype)
- License compliance checking
- SBOM generation
- CVE database lookup

## Target Processes

- security-architecture-review
- iac-review

## Input Schema

```json
{
  "type": "object",
  "required": ["targets"],
  "properties": {
    "targets": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Paths to scan"
    },
    "scanTypes": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["sast", "dependencies", "secrets", "containers", "licenses"]
      },
      "default": ["sast", "dependencies", "secrets"]
    },
    "tools": {
      "type": "object",
      "properties": {
        "sast": {
          "type": "string",
          "enum": ["semgrep", "codeql"],
          "default": "semgrep"
        },
        "dependencies": {
          "type": "string",
          "enum": ["snyk", "owasp", "npm-audit"],
          "default": "snyk"
        },
        "secrets": {
          "type": "string",
          "enum": ["gitleaks", "trufflehog"],
          "default": "gitleaks"
        }
      }
    },
    "options": {
      "type": "object",
      "properties": {
        "severityThreshold": {
          "type": "string",
          "enum": ["critical", "high", "medium", "low"],
          "default": "medium"
        },
        "failOnVulnerability": {
          "type": "boolean",
          "default": true
        }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "vulnerabilities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "severity": { "type": "string" },
          "type": { "type": "string" },
          "file": { "type": "string" },
          "line": { "type": "number" },
          "description": { "type": "string" },
          "cve": { "type": "string" },
          "fix": { "type": "string" }
        }
      }
    },
    "secrets": {
      "type": "array"
    },
    "dependencyVulnerabilities": {
      "type": "array"
    },
    "summary": {
      "type": "object",
      "properties": {
        "critical": { "type": "number" },
        "high": { "type": "number" },
        "medium": { "type": "number" },
        "low": { "type": "number" }
      }
    },
    "passed": {
      "type": "boolean"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'security-scanner',
    context: {
      targets: ['src/**/*.ts', 'package.json'],
      scanTypes: ['sast', 'dependencies', 'secrets'],
      tools: {
        sast: 'semgrep',
        dependencies: 'snyk'
      },
      options: {
        severityThreshold: 'high',
        failOnVulnerability: true
      }
    }
  }
}
```
