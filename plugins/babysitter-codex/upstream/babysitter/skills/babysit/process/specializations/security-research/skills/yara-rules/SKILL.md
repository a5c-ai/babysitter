---
name: YARA Rules Skill
description: YARA rule creation, testing, and deployment
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# YARA Rules Skill

## Overview

This skill provides capabilities for YARA rule creation, testing, and deployment for malware detection and threat hunting.

## Capabilities

- Generate YARA rules from samples
- Validate YARA rule syntax
- Test rules against sample sets
- Optimize rules for performance
- Create rule metadata and documentation
- Support YARA modules (PE, ELF, etc.)
- Integrate with VirusTotal YARA
- Generate Sigma rules for correlation

## Target Processes

- malware-analysis.js
- threat-intelligence-research.js
- security-tool-development.js

## Dependencies

- YARA CLI
- yara-python library
- VirusTotal API (optional)
- Sample malware corpus (for testing)

## Usage Context

This skill is essential for:
- Malware detection rule development
- Threat hunting operations
- IOC-based detection
- Malware family classification
- Automated sample triage

## Integration Notes

- Rules can be tested against known good/bad samples
- Performance metrics help optimize detection speed
- Supports rule versioning and documentation
- Can export to multiple detection platforms
- Integrates with YARA-L for Chronicle
