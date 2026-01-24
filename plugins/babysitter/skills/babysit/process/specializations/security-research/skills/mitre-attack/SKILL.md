---
name: MITRE ATT&CK Skill
description: MITRE ATT&CK framework mapping and analysis
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# MITRE ATT&CK Skill

## Overview

This skill provides MITRE ATT&CK framework mapping, analysis, and adversary emulation capabilities.

## Capabilities

- Map TTPs to ATT&CK techniques
- Generate ATT&CK Navigator layers
- Query ATT&CK STIX data
- Create attack patterns and campaigns
- Analyze technique coverage
- Generate detection mappings
- Support ATT&CK ICS and Mobile
- Create adversary emulation plans

## Target Processes

- red-team-operations.js
- purple-team-exercise.js
- threat-intelligence-research.js
- malware-analysis.js

## Dependencies

- ATT&CK STIX data (via TAXII or local)
- ATT&CK Navigator
- mitreattack-python library
- Python 3.x

## Usage Context

This skill is essential for:
- Adversary emulation planning
- Detection gap analysis
- Threat intelligence correlation
- Red team operation planning
- Security posture assessment

## Integration Notes

- Supports all ATT&CK matrices (Enterprise, Mobile, ICS)
- Can generate Navigator layers for visualization
- Integrates with threat intelligence platforms
- Maps to detection rules and mitigations
- Supports campaign and group analysis
