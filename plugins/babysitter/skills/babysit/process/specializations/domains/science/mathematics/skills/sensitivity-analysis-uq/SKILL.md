---
name: sensitivity-analysis-uq
description: Sensitivity analysis and uncertainty quantification
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: computational-mathematics
  domain: mathematics
  backlog-id: SK-MATH-030
  tools:
    - SALib
    - UQpy
    - OpenTURNS
  processes:
    - uncertainty-quantification
    - model-validation
---

# Sensitivity Analysis and UQ Skill

## Purpose

Provides sensitivity analysis and uncertainty quantification methods for understanding model behavior under parameter variations.

## Capabilities

- **Local Sensitivity**: Derivative-based methods
- **Global Sensitivity**: Sobol indices, Morris screening
- **Variance Decomposition**: ANOVA-based methods
- **Uncertainty Propagation**: Forward propagation methods
- **Surrogate Modeling**: PCE, Kriging for UQ
- **Reliability Analysis**: FORM, SORM methods

## Usage Guidelines

1. **Analysis Planning**
   - Define input uncertainties
   - Specify quantities of interest
   - Choose analysis type

2. **Method Selection**
   - Local vs global sensitivity
   - Sample-based vs surrogate
   - Consider computational budget

3. **Interpretation**
   - Rank parameter importance
   - Identify interactions
   - Quantify output uncertainty

4. **Best Practices**
   - Document uncertainty sources
   - Validate surrogate accuracy
   - Report confidence bounds
