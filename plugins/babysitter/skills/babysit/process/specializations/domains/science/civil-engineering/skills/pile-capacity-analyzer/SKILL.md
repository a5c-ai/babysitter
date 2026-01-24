---
name: pile-capacity-analyzer
description: Deep foundation capacity analysis skill for driven piles and drilled shafts
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
  category: Geotechnical Analysis
  skill-id: CIV-SK-011
---

# Pile Capacity Analyzer Skill

## Purpose

The Pile Capacity Analyzer Skill determines axial and lateral capacity of deep foundations including driven piles and drilled shafts using FHWA and other established methods.

## Capabilities

- Driven pile capacity (alpha, beta methods)
- Drilled shaft capacity (FHWA methods)
- Pile group efficiency
- Lateral pile analysis (p-y curves)
- Pile driving analysis (wave equation)
- LRFD resistance factors
- Uplift capacity
- Settlement of pile groups

## Usage Guidelines

### When to Use
- Designing deep foundations
- Analyzing pile group behavior
- Evaluating lateral capacity
- Predicting pile driving

### Prerequisites
- Soil borings available
- Pile type and size selected
- Load requirements defined
- Installation method determined

### Best Practices
- Use appropriate method for soil type
- Consider setup and relaxation
- Apply LRFD resistance factors
- Plan for verification testing

## Process Integration

This skill integrates with:
- Foundation Design
- Bridge Design LRFD

## Configuration

```yaml
pile-capacity-analyzer:
  pile-types:
    - driven-steel
    - driven-concrete
    - drilled-shaft
    - micropile
  capacity-methods:
    - alpha
    - beta
    - nordlund
    - FHWA-drilled
  lateral-methods:
    - p-y-curves
    - Broms
```

## Output Artifacts

- Capacity calculations
- Load-settlement curves
- p-y analysis results
- Group efficiency factors
