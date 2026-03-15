---
name: bim-clash-detection
description: BIM clash detection skill for identifying and managing coordination conflicts between disciplines
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: civil-engineering
  domain: science
  category: BIM Coordination
  skill-id: CIV-SK-014
---

# BIM Clash Detection Skill

## Purpose

The BIM Clash Detection Skill identifies and manages coordination conflicts between building disciplines including hard clashes, soft clashes, and workflow clashes.

## Capabilities

- Hard clash detection (physical interference)
- Soft clash detection (clearance violations)
- Workflow clash detection (sequencing)
- Clash grouping and prioritization
- Resolution tracking
- Report generation with visualization
- BCF format export
- Multi-model coordination

## Usage Guidelines

### When to Use
- Coordinating multi-discipline models
- Identifying design conflicts
- Managing clash resolution
- Documenting coordination issues

### Prerequisites
- BIM models available
- Coordination matrix defined
- Tolerance settings established
- Resolution workflow defined

### Best Practices
- Run regular detection cycles
- Prioritize clashes by impact
- Track resolution status
- Document resolutions

## Process Integration

This skill integrates with:
- BIM Coordination
- Shop Drawing Review

## Configuration

```yaml
bim-clash-detection:
  clash-types:
    - hard
    - soft
    - clearance
  tolerances:
    hard: 0
    soft: 50  # mm
    clearance: 100  # mm
  output-formats:
    - html
    - bcf
    - json
```

## Output Artifacts

- Clash reports
- BCF issue files
- Resolution logs
- Coordination matrices
