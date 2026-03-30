---
name: hysys-dynamic-simulator
description: Aspen HYSYS integration skill for dynamic simulation, pressure-flow networks, and process dynamics
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
  skill-id: CE-SK-002
---

# HYSYS Dynamic Simulator Skill

## Purpose

The HYSYS Dynamic Simulator Skill enables dynamic process simulation for transient analysis, control system design, and emergency scenario evaluation.

## Capabilities

- Dynamic process simulation
- Pressure-flow solver configuration
- Controller tuning with dynamics
- Compressible flow analysis
- Transient scenario analysis
- Emergency shutdown simulation
- Trip system verification
- Batch process modeling

## Usage Guidelines

### When to Use
- Analyzing transient behavior
- Designing control systems
- Evaluating emergency scenarios
- Validating trip systems

### Prerequisites
- Steady-state simulation complete
- Equipment volumes defined
- Control strategy established
- Scenario requirements identified

### Best Practices
- Start from converged steady-state
- Define appropriate time steps
- Validate against plant data
- Document scenario assumptions

## Process Integration

This skill integrates with:
- Process Simulation Model Development
- Control Strategy Development
- Process Startup Procedure Development

## Configuration

```yaml
hysys-dynamic-simulator:
  solver-modes:
    - implicit
    - explicit
  scenario-types:
    - startup
    - shutdown
    - emergency
    - load-change
```

## Output Artifacts

- Dynamic simulation files
- Trend plots
- Controller performance data
- Scenario analysis reports
