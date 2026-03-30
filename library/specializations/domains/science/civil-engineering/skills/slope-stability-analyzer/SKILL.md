---
name: slope-stability-analyzer
description: Slope stability analysis skill using limit equilibrium methods for static and seismic conditions
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
  skill-id: CIV-SK-009
---

# Slope Stability Analyzer Skill

## Purpose

The Slope Stability Analyzer Skill performs slope stability analysis using limit equilibrium methods for circular and non-circular failure surfaces under static and seismic loading conditions.

## Capabilities

- Limit equilibrium analysis (Bishop, Spencer, Morgenstern-Price)
- Circular and non-circular failure surfaces
- Factor of safety calculation
- Seismic slope stability (pseudo-static)
- Probabilistic slope stability
- Sensitivity analysis
- Back-analysis for failed slopes
- Reinforced slope analysis

## Usage Guidelines

### When to Use
- Analyzing natural slopes
- Designing cut and fill slopes
- Evaluating landslide potential
- Designing slope reinforcement

### Prerequisites
- Slope geometry defined
- Soil stratigraphy established
- Shear strength parameters available
- Groundwater conditions known

### Best Practices
- Search for critical failure surface
- Use appropriate analysis method
- Consider pore pressure effects
- Verify with multiple methods

## Process Integration

This skill integrates with:
- Slope Stability Analysis
- Retaining Wall Design

## Configuration

```yaml
slope-stability-analyzer:
  methods:
    - bishop-simplified
    - spencer
    - morgenstern-price
    - janbu
  failure-surfaces:
    - circular
    - non-circular
    - block
  conditions:
    - static
    - pseudo-static
    - dynamic
```

## Output Artifacts

- Factor of safety results
- Critical slip surfaces
- Sensitivity analyses
- Stability charts
