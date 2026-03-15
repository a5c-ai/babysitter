---
name: pid-tuner
description: PID controller tuning skill for loop optimization using various tuning methods and performance criteria
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
  skill-id: CE-SK-020
---

# PID Tuner Skill

## Purpose

The PID Tuner Skill optimizes PID controller parameters using various tuning methods to achieve desired control performance and robustness.

## Capabilities

- Process identification (step tests, relay)
- First-order plus dead-time (FOPDT) modeling
- Tuning methods (IMC, Lambda, Cohen-Coon, Ziegler-Nichols)
- Performance criteria optimization (IAE, ISE, ITAE)
- Robustness analysis
- Loop interaction assessment
- Tuning for various objectives (setpoint, disturbance)
- Bumpless transfer configuration

## Usage Guidelines

### When to Use
- Tuning new control loops
- Retuning underperforming loops
- Optimizing control performance
- Commissioning control systems

### Prerequisites
- Process in stable operation
- Loop components commissioned
- Process model or test data available
- Performance criteria defined

### Best Practices
- Start with conservative tuning
- Test in simulation first
- Validate robustness
- Document tuning rationale

## Process Integration

This skill integrates with:
- PID Controller Tuning
- Control Strategy Development
- Process Startup Procedure Development

## Configuration

```yaml
pid-tuner:
  tuning-methods:
    - IMC
    - lambda
    - cohen-coon
    - ziegler-nichols
    - SIMC
  performance-criteria:
    - IAE
    - ISE
    - ITAE
```

## Output Artifacts

- Tuning parameters
- Process models
- Performance metrics
- Robustness analysis
- Tuning recommendations
