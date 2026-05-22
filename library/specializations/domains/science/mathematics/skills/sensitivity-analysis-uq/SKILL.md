---
name: sensitivity-analysis-uq
description: Global sensitivity analysis methods
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
  category: uncertainty-quantification
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:data-scientist]
---

# Sensitivity Analysis (UQ)

## Purpose

Provides global sensitivity analysis methods for understanding model behavior and input importance.

## Capabilities

- Sobol indices computation
- Morris screening method
- FAST (Fourier amplitude sensitivity test)
- Correlation-based sensitivity
- Derivative-based sensitivity (DGSM)
- Variance-based decomposition

## Usage Guidelines

1. **Method Selection**: Choose based on computational budget
2. **Input Ranges**: Define appropriate input ranges
3. **Sample Size**: Ensure sufficient samples for convergence
4. **Interpretation**: Correctly interpret sensitivity indices

## Tools/Libraries

- SALib
- OpenTURNS
- UQLab
