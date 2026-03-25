---
name: aspen-plus-simulator
description: Aspen Plus integration skill for steady-state process simulation, thermodynamic modeling, and equipment rating
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
  skill-id: CE-SK-001
---

# Aspen Plus Simulator Skill

## Purpose

The Aspen Plus Simulator Skill provides integration with Aspen Plus for steady-state process simulation, thermodynamic modeling, property estimation, and equipment design calculations.

## Capabilities

- Process flowsheet construction and simulation
- Thermodynamic model selection (NRTL, SRK, PRMHV2, UNIFAC)
- Property estimation (DIPPR, Joback methods)
- Equipment rating and design modes
- Sensitivity analysis and optimization
- Report generation and stream table export
- Convergence troubleshooting
- Custom unit operation modeling
- Economic analysis integration

## Usage Guidelines

### When to Use
- Developing process simulation models
- Evaluating thermodynamic properties
- Sizing and rating equipment
- Optimizing process conditions

### Prerequisites
- Process flow diagram available
- Component list defined
- Operating conditions specified
- Thermodynamic data requirements identified

### Best Practices
- Select appropriate thermodynamic models
- Validate against experimental data
- Document all assumptions
- Perform sensitivity analysis

## Process Integration

This skill integrates with:
- Process Flow Diagram Development
- Heat Integration Analysis
- Equipment Sizing and Specification

## Configuration

```yaml
aspen-plus-simulator:
  thermodynamic-models:
    - NRTL
    - SRK
    - Peng-Robinson
    - UNIFAC
  unit-operations:
    - columns
    - reactors
    - heat-exchangers
    - separators
```

## Output Artifacts

- Simulation files
- Stream tables
- Equipment specifications
- Optimization results
- Property reports
