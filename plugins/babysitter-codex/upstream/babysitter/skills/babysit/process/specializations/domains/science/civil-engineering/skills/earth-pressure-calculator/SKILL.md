---
name: earth-pressure-calculator
description: Earth pressure calculation skill for retaining structures using classical and seismic methods
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
  skill-id: CIV-SK-012
---

# Earth Pressure Calculator Skill

## Purpose

The Earth Pressure Calculator Skill determines lateral earth pressures on retaining structures using Rankine, Coulomb, and seismic methods for design of retaining walls and basement walls.

## Capabilities

- Active earth pressure (Rankine, Coulomb)
- Passive earth pressure
- At-rest earth pressure
- Surcharge effects
- Layered soil conditions
- Seismic earth pressure (Mononobe-Okabe)
- Sloping backfill effects
- Water pressure considerations

## Usage Guidelines

### When to Use
- Designing retaining walls
- Analyzing basement walls
- Evaluating excavation support
- Assessing seismic pressures

### Prerequisites
- Soil parameters available
- Wall geometry defined
- Surcharge loads identified
- Groundwater level known

### Best Practices
- Select appropriate theory
- Consider wall movement
- Include seismic where required
- Account for drainage

## Process Integration

This skill integrates with:
- Retaining Wall Design
- Foundation Design

## Configuration

```yaml
earth-pressure-calculator:
  theories:
    - rankine
    - coulomb
    - log-spiral
  pressure-states:
    - active
    - passive
    - at-rest
  seismic:
    - mononobe-okabe
    - wood
```

## Output Artifacts

- Pressure diagrams
- Force calculations
- Moment summaries
- Seismic increment values
