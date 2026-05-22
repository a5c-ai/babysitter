---
name: multiple-testing-correction
description: Multiple comparison correction methods
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
  category: statistical-computing
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:data-scientist]
---

# Multiple Testing Correction

## Purpose

Provides multiple comparison correction methods for controlling error rates in simultaneous hypothesis testing.

## Capabilities

- Bonferroni correction
- Holm-Bonferroni method
- Benjamini-Hochberg FDR control
- Sidak correction
- Permutation-based corrections
- Family-wise error rate control

## Usage Guidelines

1. **Error Rate Selection**: Choose FWER vs FDR based on goals
2. **Method Selection**: Apply appropriate correction method
3. **Dependency Handling**: Account for test dependencies
4. **Interpretation**: Report adjusted p-values correctly

## Tools/Libraries

- statsmodels
- scipy.stats
- multcomp (R)
- multtest (R)
