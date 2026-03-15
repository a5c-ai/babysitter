---
name: wind-load-calculator
description: Wind load calculation skill per ASCE 7 for MWFRS and components and cladding
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
  category: Structural Analysis
  skill-id: CIV-SK-007
---

# Wind Load Calculator Skill

## Purpose

The Wind Load Calculator Skill determines wind loads on structures per ASCE 7 for main wind force resisting systems (MWFRS) and components and cladding (C&C).

## Capabilities

- Basic wind speed determination
- Exposure category classification
- Wind pressure calculation (MWFRS and C&C)
- Building envelope pressures
- Open building wind loads
- Tornado shelter design wind loads
- Internal pressure determination
- Directional and envelope procedures

## Usage Guidelines

### When to Use
- Calculating design wind loads
- Evaluating cladding pressures
- Designing MWFRS members
- Assessing open structure loads

### Prerequisites
- Building geometry defined
- Site location established
- Risk category determined
- Enclosure classification identified

### Best Practices
- Verify exposure category
- Consider topographic effects
- Check internal pressure requirements
- Document wind speed sources

## Process Integration

This skill integrates with:
- Structural Load Analysis
- Bridge Design LRFD

## Configuration

```yaml
wind-load-calculator:
  procedures:
    - directional
    - envelope
    - simplified
  load-types:
    - MWFRS
    - C-and-C
  design-codes:
    - ASCE7-22
    - ASCE7-16
```

## Output Artifacts

- Wind pressure diagrams
- Load summaries
- Pressure zone maps
- Calculation reports
