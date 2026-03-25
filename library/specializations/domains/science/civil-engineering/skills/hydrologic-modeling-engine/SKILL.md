---
name: hydrologic-modeling-engine
description: Hydrologic modeling skill for rainfall-runoff analysis, flood frequency, and watershed analysis
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
  category: Water Resources
  skill-id: CIV-SK-022
---

# Hydrologic Modeling Engine Skill

## Purpose

The Hydrologic Modeling Engine Skill performs hydrologic analysis including rainfall-runoff modeling, flood frequency analysis, and watershed characterization using established methods.

## Capabilities

- Rational method calculations
- SCS/NRCS curve number method
- Unit hydrograph generation
- Reservoir routing
- Time of concentration calculation
- IDF curve analysis
- Flood frequency analysis
- Watershed delineation

## Usage Guidelines

### When to Use
- Estimating design flows
- Analyzing watersheds
- Designing stormwater facilities
- Evaluating flood risk

### Prerequisites
- Watershed characteristics known
- Rainfall data available
- Land use identified
- Soil types classified

### Best Practices
- Select appropriate method
- Validate with observed data
- Consider climate effects
- Document assumptions

## Process Integration

This skill integrates with:
- Stormwater Management Design
- Flood Analysis and Mitigation
- Hydraulic Structure Design

## Configuration

```yaml
hydrologic-modeling-engine:
  methods:
    - rational
    - scs-curve-number
    - unit-hydrograph
    - reservoir-routing
  outputs:
    - peak-flow
    - hydrograph
    - report
```

## Output Artifacts

- Peak flow calculations
- Hydrographs
- Watershed reports
- Routing analyses
