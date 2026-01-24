---
name: pavement-design-calculator
description: Pavement design skill for flexible and rigid pavements using AASHTO and MEPDG methods
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
  category: Transportation Design
  skill-id: CIV-SK-020
---

# Pavement Design Calculator Skill

## Purpose

The Pavement Design Calculator Skill designs flexible and rigid pavements using AASHTO 93, MEPDG, and other established methods including overlay design and life-cycle cost analysis.

## Capabilities

- Flexible pavement design (AASHTO 93, MEPDG)
- Rigid pavement design
- Overlay design
- Traffic loading analysis (ESALs)
- Material characterization
- Life-cycle cost analysis
- Structural number calculation
- Thickness determination

## Usage Guidelines

### When to Use
- Designing new pavements
- Evaluating rehabilitation options
- Analyzing pavement life
- Comparing alternatives

### Prerequisites
- Traffic data available
- Subgrade characterization complete
- Material properties known
- Design period established

### Best Practices
- Use appropriate design method
- Verify traffic projections
- Consider drainage effects
- Evaluate life-cycle costs

## Process Integration

This skill integrates with:
- Pavement Design
- Highway Geometric Design

## Configuration

```yaml
pavement-design-calculator:
  design-methods:
    - AASHTO-93
    - MEPDG
    - PCA
  pavement-types:
    - flexible
    - rigid
    - composite
  analysis:
    - new-construction
    - overlay
    - rehabilitation
```

## Output Artifacts

- Pavement thickness designs
- Life-cycle cost analyses
- Material specifications
- Design summaries
