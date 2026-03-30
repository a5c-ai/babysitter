---
name: equipment-sizing-calculator
description: Process equipment sizing skill using established engineering correlations and standards
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
  category: Process Simulation
  skill-id: CE-SK-005
---

# Equipment Sizing Calculator Skill

## Purpose

The Equipment Sizing Calculator Skill performs process equipment sizing using established engineering correlations, industry standards, and manufacturer guidelines.

## Capabilities

- Vessel sizing (residence time, L/D ratios)
- Heat exchanger rating and design (TEMA methods)
- Pump sizing and NPSH calculations
- Compressor selection and performance
- Column sizing (flooding, weeping checks)
- Pressure drop calculations
- Agitator sizing
- Piping sizing

## Usage Guidelines

### When to Use
- Sizing process equipment
- Rating existing equipment
- Developing equipment specifications
- Evaluating design alternatives

### Prerequisites
- Process conditions defined
- Flow rates established
- Physical properties available
- Design codes identified

### Best Practices
- Apply appropriate design margins
- Follow applicable standards
- Consider operability requirements
- Document all assumptions

## Process Integration

This skill integrates with:
- Equipment Sizing and Specification
- Distillation Column Design
- Membrane Separation System Design

## Configuration

```yaml
equipment-sizing-calculator:
  equipment-types:
    - vessels
    - heat-exchangers
    - pumps
    - compressors
    - columns
  design-codes:
    - ASME
    - TEMA
    - API
```

## Output Artifacts

- Equipment datasheets
- Sizing calculations
- Specification sheets
- Design drawings
