---
name: iminuit-statistical-fitter
description: iminuit statistical fitting skill for physics data analysis with proper error handling and profile likelihood
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: physics
  domain: science
  category: data-analysis
  phase: 6
---

# iminuit Statistical Fitter

## Purpose

Provides expert guidance on iminuit for statistical fitting in physics, including proper error estimation and profile likelihood calculations.

## Capabilities

- MINUIT minimization algorithms
- HESSE error matrix calculation
- MINOS asymmetric error estimation
- Profile likelihood computation
- Constrained fitting
- Simultaneous fit orchestration

## Usage Guidelines

1. **Model Definition**: Define cost function for minimization
2. **Minimization**: Run MIGRAD for parameter estimation
3. **Error Analysis**: Use HESSE and MINOS for uncertainties
4. **Profile Likelihood**: Compute profile likelihood for parameters
5. **Simultaneous Fits**: Combine multiple datasets in fits

## Tools/Libraries

- iminuit
- probfit
- zfit
