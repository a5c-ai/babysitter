---
name: CVE/CWE Database Skill
description: CVE and CWE database querying and management
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# CVE/CWE Database Skill

## Overview

This skill provides CVE and CWE database querying, CVSS scoring, and vulnerability management capabilities.

## Capabilities

- Query NVD for CVE details
- Search CWE database for weaknesses
- Calculate CVSS scores (v2, v3.1, v4)
- Generate CVE request templates
- Track CVE assignment status
- Map vulnerabilities to CWE
- Generate vulnerability advisories
- Support CPE matching

## Target Processes

- vulnerability-root-cause-analysis.js
- responsible-disclosure.js
- security-advisory-writing.js
- variant-analysis.js

## Dependencies

- NVD API access
- CWE database (local or API)
- cvss library (Python)
- Python 3.x

## Usage Context

This skill is essential for:
- Vulnerability classification
- CVSS score calculation
- CVE request preparation
- Advisory writing
- Vulnerability tracking

## Integration Notes

- Supports NVD API v2
- Can cache CVE data locally
- Integrates with vulnerability management systems
- Supports CPE-based vulnerability matching
- Can generate machine-readable advisories (CSAF)
