---
name: mpc-configurator
description: Model Predictive Control configuration skill for MPC model identification, tuning, and implementation
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
  skill-id: CE-SK-021
---

# MPC Configurator Skill

## Purpose

The MPC Configurator Skill supports Model Predictive Control implementation including model identification, controller configuration, and performance tuning.

## Capabilities

- Step test design and execution
- Dynamic model identification
- MPC model validation
- CV/MV/DV selection
- Constraint configuration
- Objective function tuning
- Prediction/control horizon selection
- Move suppression tuning
- Performance monitoring

## Usage Guidelines

### When to Use
- Implementing new MPC applications
- Retuning existing MPC controllers
- Identifying process models
- Optimizing MPC performance

### Prerequisites
- Regulatory control stable
- Step test data available
- Process constraints identified
- Economic objectives defined

### Best Practices
- Ensure quality step test data
- Validate models thoroughly
- Start with conservative tuning
- Monitor controller performance

## Process Integration

This skill integrates with:
- Model Predictive Control Implementation
- Control Strategy Development
- PID Controller Tuning

## Configuration

```yaml
mpc-configurator:
  platforms:
    - DMCplus
    - RMPCT
    - Pavilion
    - Honeywell-RMPCT
  identification-methods:
    - step-response
    - subspace
    - prediction-error
```

## Output Artifacts

- Process models
- Controller configuration
- Tuning parameters
- Validation reports
- Performance metrics
