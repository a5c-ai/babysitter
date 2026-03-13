---
name: hazop-facilitator
description: HAZOP study facilitation skill for systematic deviation analysis and safeguard identification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: chemical-engineering
  domain: science
  category: Process Safety
  skill-id: CE-SK-014
---

# HAZOP Facilitator Skill

## Purpose

The HAZOP Facilitator Skill supports Hazard and Operability studies by guiding systematic deviation analysis, consequence evaluation, and safeguard identification.

## Capabilities

- Node identification and definition
- Guide word application
- Deviation generation
- Cause identification
- Consequence analysis
- Safeguard evaluation
- Recommendation development
- Risk ranking
- Action tracking

## Usage Guidelines

### When to Use
- Conducting HAZOP studies
- Reviewing process modifications
- Revalidating existing HAZOPs
- Training HAZOP teams

### Prerequisites
- P&IDs available and current
- Process description complete
- Design basis documented
- Team assembled

### Best Practices
- Follow structured methodology
- Ensure team expertise coverage
- Document thoroughly
- Track all recommendations

## Process Integration

This skill integrates with:
- HAZOP Study Facilitation
- Safety Instrumented System Design
- Process Hazard Analysis

## Configuration

```yaml
hazop-facilitator:
  guide-words:
    - no
    - more
    - less
    - reverse
    - other
    - part-of
  risk-matrix:
    consequence-levels: 5
    likelihood-levels: 5
```

## Output Artifacts

- HAZOP worksheets
- Recommendation register
- Risk rankings
- Action tracking logs
- Meeting minutes
