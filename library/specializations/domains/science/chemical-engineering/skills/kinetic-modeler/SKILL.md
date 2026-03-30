---
name: kinetic-modeler
description: Reaction kinetics modeling skill for parameter estimation, mechanism validation, and rate equation development
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
  category: Reaction Engineering
  skill-id: CE-SK-006
---

# Kinetic Modeler Skill

## Purpose

The Kinetic Modeler Skill develops and validates reaction kinetics models, performing parameter estimation from experimental data and supporting reactor design.

## Capabilities

- Rate equation formulation (power law, LHHW, Eley-Rideal)
- Parameter estimation via nonlinear regression
- Arrhenius parameter calculation
- Activation energy determination
- Model discrimination (AIC, BIC criteria)
- Confidence interval estimation
- Reaction mechanism validation
- Kinetic data analysis

## Usage Guidelines

### When to Use
- Developing kinetic models
- Estimating rate parameters
- Validating reaction mechanisms
- Supporting reactor design

### Prerequisites
- Experimental data available
- Proposed mechanism identified
- Operating conditions characterized
- Thermodynamic constraints known

### Best Practices
- Use statistically valid data
- Test multiple model forms
- Validate with independent data
- Report parameter uncertainties

## Process Integration

This skill integrates with:
- Kinetic Model Development
- Reactor Design and Selection
- Catalyst Evaluation and Optimization

## Configuration

```yaml
kinetic-modeler:
  model-types:
    - power-law
    - langmuir-hinshelwood
    - eley-rideal
    - mechanistic
  estimation-methods:
    - least-squares
    - maximum-likelihood
    - bayesian
```

## Output Artifacts

- Kinetic models
- Parameter estimates
- Confidence intervals
- Model validation reports
- Mechanism analysis
