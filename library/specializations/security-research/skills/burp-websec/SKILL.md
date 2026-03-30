---
name: Burp Suite/Web Security Skill
description: Web application security testing with Burp Suite integration
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# Burp Suite/Web Security Skill

## Overview

This skill provides web application security testing capabilities with Burp Suite and OWASP ZAP integration.

## Capabilities

- Configure Burp Suite proxy and scanner
- Execute Burp extensions and macros
- Parse and analyze HTTP traffic
- Generate and send crafted requests
- Extract and analyze responses
- Support authentication handling
- Create and run active scan policies
- Generate web vulnerability reports

## Target Processes

- web-app-vuln-research.js
- api-security-research.js
- bug-bounty-workflow.js
- red-team-operations.js

## Dependencies

- Burp Suite (Professional for full features)
- OWASP ZAP (alternative)
- Burp REST API
- Python requests library
- mitmproxy (optional)

## Usage Context

This skill is essential for:
- Web application penetration testing
- API security assessment
- Bug bounty hunting
- Authentication testing
- Session management analysis

## Integration Notes

- Supports headless operation via REST API
- Can replay and modify captured requests
- Integrates with CI/CD for automated scanning
- Custom scan policies for targeted testing
- Report generation in multiple formats
