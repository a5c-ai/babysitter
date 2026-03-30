---
name: section-property-calculator
description: Cross-sectional property calculation skill for structural sections including standard and custom shapes
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
  skill-id: CIV-SK-002
---

# Section Property Calculator Skill

## Purpose

The Section Property Calculator Skill calculates cross-sectional properties for structural sections including area, moment of inertia, section modulus, and plastic modulus for both standard and custom shapes.

## Capabilities

- Calculate cross-sectional properties (A, I, S, Z, r)
- Support for standard shapes (W, HSS, C, L, pipe)
- Custom section analysis
- Composite section properties
- Cracked section analysis for concrete
- Plastic section modulus calculation
- Effective section properties
- Built-up section analysis

## Usage Guidelines

### When to Use
- Determining section properties for design
- Analyzing composite sections
- Evaluating cracked concrete sections
- Designing built-up members

### Prerequisites
- Section geometry defined
- Material properties specified
- Cracking criteria established (for concrete)
- Effective width defined (for composites)

### Best Practices
- Use correct axis orientation
- Account for holes and penetrations
- Consider effective sections per code
- Verify against published values

## Process Integration

This skill integrates with:
- Reinforced Concrete Design
- Structural Steel Design
- Bridge Design LRFD

## Configuration

```yaml
section-property-calculator:
  standard-shapes:
    - W-shapes
    - HSS-rectangular
    - HSS-round
    - channels
    - angles
    - pipes
  analysis-types:
    - gross
    - net
    - effective
    - cracked
```

## Output Artifacts

- Section property tables
- Cross-section drawings
- Calculation summaries
- Composite section analysis
