---
name: reactive-hazards-analyzer
description: Reactive chemical hazards analysis skill for thermal stability, incompatibility, and runaway reaction assessment
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
  category: Process Safety
  skill-id: CE-SK-018
---

# Reactive Hazards Analyzer Skill

## Purpose

The Reactive Hazards Analyzer Skill evaluates reactive chemical hazards including thermal stability, chemical incompatibilities, and runaway reaction potential using calorimetric data analysis.

## Capabilities

- Thermal stability assessment
- Chemical compatibility screening
- DSC/ARC data interpretation
- Adiabatic runaway analysis
- TMRad calculations
- Criticality assessment
- SADT determination
- Relief sizing for reactive systems

## Usage Guidelines

### When to Use
- Assessing reactive hazards
- Interpreting calorimetric data
- Designing reactive system safeguards
- Screening chemical incompatibilities

### Prerequisites
- Material safety data available
- Calorimetric test data (if available)
- Process conditions defined
- Reaction stoichiometry known

### Best Practices
- Screen all chemical combinations
- Use appropriate test methods
- Consider worst-case scenarios
- Involve subject matter experts

## Process Integration

This skill integrates with:
- HAZOP Study Facilitation
- Pressure Relief System Design
- Reactor Design and Selection

## Configuration

```yaml
reactive-hazards-analyzer:
  test-methods:
    - DSC
    - ARC
    - RC1
    - VSP2
  hazard-types:
    - thermal-decomposition
    - polymerization
    - incompatibility
    - oxidation
```

## Output Artifacts

- Hazard assessments
- Compatibility matrices
- Calorimetric data analysis
- Relief sizing for reactive
- Safety recommendations
