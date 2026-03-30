---
name: bearing-capacity-calculator
description: Soil bearing capacity calculation skill using multiple methods for various foundation types
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
  skill-id: CIV-SK-008
---

# Bearing Capacity Calculator Skill

## Purpose

The Bearing Capacity Calculator Skill determines ultimate and allowable bearing capacity for foundations using established geotechnical methods including Terzaghi, Meyerhof, Hansen, and Vesic.

## Capabilities

- Ultimate bearing capacity calculation
- Allowable bearing capacity with factor of safety
- Effect of groundwater
- Eccentric and inclined loads
- Layered soil bearing capacity
- Settlement-based bearing capacity
- Shape, depth, and inclination factors
- Bearing capacity for footings on slopes

## Usage Guidelines

### When to Use
- Designing shallow foundations
- Evaluating foundation bearing
- Checking settlement limits
- Analyzing eccentric loading

### Prerequisites
- Soil parameters available
- Foundation dimensions defined
- Groundwater level known
- Load conditions established

### Best Practices
- Use appropriate analysis method
- Consider all failure modes
- Apply suitable safety factors
- Verify with settlement analysis

## Process Integration

This skill integrates with:
- Foundation Design
- Geotechnical Site Investigation

## Configuration

```yaml
bearing-capacity-calculator:
  methods:
    - terzaghi
    - meyerhof
    - hansen
    - vesic
  foundation-types:
    - spread
    - strip
    - mat
  considerations:
    - groundwater
    - eccentricity
    - inclination
```

## Output Artifacts

- Bearing capacity calculations
- Safety factor summaries
- Settlement predictions
- Recommendation reports
