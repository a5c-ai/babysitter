---
name: thermodynamic-model-selector
description: Automated thermodynamic property method selection based on component characteristics and operating conditions
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
  skill-id: CE-SK-003
---

# Thermodynamic Model Selector Skill

## Purpose

The Thermodynamic Model Selector Skill guides selection of appropriate thermodynamic property methods based on component characteristics, operating conditions, and accuracy requirements.

## Capabilities

- Component analysis (polarity, association, electrolytes)
- Operating condition assessment
- Property method recommendation
- Binary interaction parameter fitting
- VLE/LLE data regression
- Model validation against experimental data
- Uncertainty quantification

## Usage Guidelines

### When to Use
- Selecting property methods for simulation
- Fitting interaction parameters
- Validating thermodynamic models
- Assessing model uncertainty

### Prerequisites
- Component list defined
- Operating ranges specified
- Experimental data available
- Accuracy requirements known

### Best Practices
- Consider all phase equilibria
- Validate with experimental data
- Document model selection rationale
- Assess sensitivity to parameters

## Process Integration

This skill integrates with:
- Process Simulation Model Development
- Distillation Column Design
- Crystallization Process Design

## Configuration

```yaml
thermodynamic-model-selector:
  model-categories:
    - equation-of-state
    - activity-coefficient
    - specialized
  data-sources:
    - DECHEMA
    - NIST
    - DIPPR
```

## Output Artifacts

- Model selection reports
- Parameter fitting results
- Validation comparisons
- Uncertainty assessments
