---
name: water-distribution-modeler
description: Water distribution system modeling skill for pipe networks, pump analysis, and fire flow
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
  skill-id: CIV-SK-025
---

# Water Distribution Modeler Skill

## Purpose

The Water Distribution Modeler Skill analyzes water distribution systems including pipe network analysis, fire flow evaluation, and pump performance assessment.

## Capabilities

- Pipe network analysis (Hardy-Cross, Newton-Raphson)
- Fire flow analysis
- Pump curve analysis
- Storage tank sizing
- Pressure zone analysis
- Water quality modeling
- Extended period simulation
- System optimization

## Usage Guidelines

### When to Use
- Designing water systems
- Evaluating system capacity
- Analyzing fire flow
- Optimizing operations

### Prerequisites
- Network topology defined
- Demand patterns established
- Pump curves available
- Tank data complete

### Best Practices
- Calibrate with field data
- Model multiple scenarios
- Verify pressure limits
- Consider emergency conditions

## Process Integration

This skill integrates with:
- Water Distribution Design

## Configuration

```yaml
water-distribution-modeler:
  analysis-types:
    - steady-state
    - extended-period
    - fire-flow
    - water-quality
  solvers:
    - gradient
    - linear-theory
  components:
    - pipes
    - pumps
    - tanks
    - valves
```

## Output Artifacts

- Network solutions
- Pressure maps
- Fire flow reports
- Water age analysis
