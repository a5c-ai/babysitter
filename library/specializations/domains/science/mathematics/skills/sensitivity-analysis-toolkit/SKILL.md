---
name: sensitivity-analysis-toolkit
description: Comprehensive sensitivity analysis for optimization
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: optimization
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-engineer, role:computational-scientist]
---

# Sensitivity Analysis Toolkit

## Purpose

Provides comprehensive sensitivity analysis capabilities for optimization problems to understand solution robustness.

## Capabilities

- Dual variable computation and interpretation
- Shadow price analysis
- Parametric programming
- Binding constraint analysis
- Post-optimality analysis
- Robust optimization formulations

## Usage Guidelines

1. **Dual Extraction**: Obtain dual variables from solvers
2. **Shadow Prices**: Interpret marginal values correctly
3. **Parametric Analysis**: Study solution changes with parameters
4. **Robustness**: Formulate robust counterparts when needed

## Tools/Libraries

- Pyomo
- JuMP
- AMPL
