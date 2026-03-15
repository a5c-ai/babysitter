---
name: control-strategy-designer
description: Process control strategy design skill for control structure selection, loop configuration, and regulatory control
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
  category: Process Control
  skill-id: CE-SK-019
---

# Control Strategy Designer Skill

## Purpose

The Control Strategy Designer Skill develops process control strategies including control structure selection, loop configuration, and regulatory control system design.

## Capabilities

- Control objective identification
- Controlled variable selection
- Manipulated variable pairing
- Control structure synthesis
- Cascade and ratio control design
- Feedforward control design
- Split-range control configuration
- Override and selector control

## Usage Guidelines

### When to Use
- Developing control strategies
- Configuring control loops
- Designing regulatory control
- Evaluating control alternatives

### Prerequisites
- Process P&IDs available
- Control objectives defined
- Process dynamics understood
- Operating modes identified

### Best Practices
- Address controllability early
- Consider all operating modes
- Plan for disturbance rejection
- Document control philosophy

## Process Integration

This skill integrates with:
- Control Strategy Development
- PID Controller Tuning
- Model Predictive Control Implementation

## Configuration

```yaml
control-strategy-designer:
  control-types:
    - feedback
    - feedforward
    - cascade
    - ratio
    - split-range
    - override
  pairing-methods:
    - RGA
    - NI
    - SVD
```

## Output Artifacts

- Control philosophy documents
- Loop diagrams
- Control narrative
- Cause and effect matrices
- Control system specifications
