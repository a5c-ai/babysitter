---
name: fea-structural-engine
description: Finite Element Analysis skill for linear and nonlinear structural analysis, modal analysis, and load combination processing
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
  skill-id: CIV-SK-001
---

# FEA Structural Engine Skill

## Purpose

The FEA Structural Engine Skill performs structural analysis using finite element methods, including linear and nonlinear analysis, dynamic analysis, and comprehensive load combination processing per applicable design codes.

## Capabilities

- Linear and nonlinear structural analysis
- Static and dynamic load analysis
- Modal analysis for seismic design
- Stress, strain, and deflection calculations
- Load combination processing per ASCE 7
- Support for beam, column, plate, and shell elements
- Response spectrum analysis
- P-delta effects analysis

## Usage Guidelines

### When to Use
- Analyzing structural systems
- Performing seismic dynamic analysis
- Evaluating load combinations
- Checking deflection and stress limits

### Prerequisites
- Structural model defined
- Load cases identified
- Material properties specified
- Boundary conditions established

### Best Practices
- Verify mesh convergence
- Validate against hand calculations
- Check equilibrium at supports
- Document analysis assumptions

## Process Integration

This skill integrates with:
- Structural Load Analysis
- Reinforced Concrete Design
- Structural Steel Design
- Seismic Design Analysis
- Bridge Design LRFD

## Configuration

```yaml
fea-structural-engine:
  analysis-types:
    - linear
    - nonlinear
    - modal
    - dynamic
  element-types:
    - beam
    - column
    - plate
    - shell
  design-codes:
    - ASCE7
    - IBC
    - AASHTO
```

## Output Artifacts

- Analysis results
- Stress distributions
- Deflection diagrams
- Mode shapes
- Load combination results
