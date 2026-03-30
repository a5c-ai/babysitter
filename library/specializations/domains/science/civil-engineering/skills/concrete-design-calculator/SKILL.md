---
name: concrete-design-calculator
description: Reinforced concrete design skill for flexure, shear, and serviceability calculations per ACI 318
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
  category: Structural Design
  skill-id: CIV-SK-006
---

# Concrete Design Calculator Skill

## Purpose

The Concrete Design Calculator Skill performs reinforced concrete design calculations for beams, slabs, and columns per ACI 318 including flexure, shear, torsion, and serviceability checks.

## Capabilities

- Flexural design (beams, slabs, columns)
- Shear and torsion design
- Development length calculations
- Crack width calculations
- Deflection calculations (immediate and long-term)
- ACI 318 code compliance checking
- Interaction diagrams for columns
- Slenderness effects analysis

## Usage Guidelines

### When to Use
- Designing reinforced concrete members
- Checking serviceability requirements
- Evaluating existing concrete structures
- Determining reinforcement requirements

### Prerequisites
- Member geometry defined
- Loads and moments established
- Material properties specified
- Exposure conditions identified

### Best Practices
- Check both strength and serviceability
- Consider construction tolerances
- Verify bar spacing and cover
- Document all design assumptions

## Process Integration

This skill integrates with:
- Reinforced Concrete Design
- Foundation Design
- Bridge Design LRFD

## Configuration

```yaml
concrete-design-calculator:
  design-types:
    - flexure
    - shear
    - torsion
    - columns
    - development
  serviceability:
    - deflection
    - crack-width
  design-codes:
    - ACI-318-19
    - ACI-318-14
```

## Output Artifacts

- Design calculations
- Reinforcement schedules
- Interaction diagrams
- Deflection reports
