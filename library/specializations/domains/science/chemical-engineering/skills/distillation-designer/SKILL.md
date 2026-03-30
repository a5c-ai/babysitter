---
name: distillation-designer
description: Distillation column design skill for tray/packing selection, hydraulic analysis, and column optimization
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
  category: Separation Processes
  skill-id: CE-SK-010
---

# Distillation Designer Skill

## Purpose

The Distillation Designer Skill performs distillation column design including tray and packing selection, hydraulic calculations, and column optimization for vapor-liquid separations.

## Capabilities

- McCabe-Thiele and Ponchon-Savarit methods
- Shortcut design calculations (Fenske, Underwood, Gilliland)
- Tray hydraulics (flooding, weeping, entrainment)
- Packing selection and sizing (HETP, pressure drop)
- Feed location optimization
- Reflux ratio optimization
- Side draw design
- Azeotropic and extractive distillation

## Usage Guidelines

### When to Use
- Designing new distillation columns
- Rating existing columns
- Optimizing column performance
- Evaluating tray vs. packing

### Prerequisites
- VLE data available
- Feed composition defined
- Product specifications set
- Thermodynamic model validated

### Best Practices
- Validate VLE predictions
- Consider turndown requirements
- Allow for design margins
- Evaluate energy integration

## Process Integration

This skill integrates with:
- Distillation Column Design and Optimization
- Separation Sequence Synthesis
- Heat Integration Analysis

## Configuration

```yaml
distillation-designer:
  internals:
    - sieve-trays
    - valve-trays
    - structured-packing
    - random-packing
  design-methods:
    - rigorous
    - shortcut
```

## Output Artifacts

- Column specifications
- Tray/packing datasheets
- Hydraulic analysis
- Operating envelopes
- Optimization recommendations
