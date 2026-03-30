---
name: load-combination-generator
description: Load combination generation skill per ASCE 7 and AASHTO for ASD and LRFD design methods
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
  skill-id: CIV-SK-003
---

# Load Combination Generator Skill

## Purpose

The Load Combination Generator Skill creates load combinations for structural design per ASCE 7, AASHTO LRFD, and other applicable codes for both ASD and LRFD design methods.

## Capabilities

- Generate ASCE 7 load combinations (ASD and LRFD)
- Generate AASHTO LRFD load combinations
- Support for special load combinations (seismic, wind)
- Custom load factor specification
- Load case matrix generation
- Strength and serviceability combinations
- Fatigue load combinations
- Multiple load path considerations

## Usage Guidelines

### When to Use
- Developing structural design loads
- Creating analysis load cases
- Checking code compliance
- Evaluating critical load patterns

### Prerequisites
- Load types identified
- Risk category determined
- Design method selected
- Applicable codes identified

### Best Practices
- Include all applicable load types
- Consider load direction effects
- Document any special combinations
- Verify combination applicability

## Process Integration

This skill integrates with:
- Structural Load Analysis
- Reinforced Concrete Design
- Structural Steel Design
- Bridge Design LRFD

## Configuration

```yaml
load-combination-generator:
  design-codes:
    - ASCE7-22
    - ASCE7-16
    - AASHTO-LRFD
    - IBC-2024
  design-methods:
    - LRFD
    - ASD
  load-types:
    - dead
    - live
    - wind
    - seismic
    - snow
    - rain
```

## Output Artifacts

- Load combination tables
- Load case matrices
- Combination summaries
- Code compliance checklists
