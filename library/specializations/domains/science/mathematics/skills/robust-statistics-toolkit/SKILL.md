---
name: robust-statistics-toolkit
description: Robust statistical methods resistant to outliers
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

# Robust Statistics Toolkit

## Purpose

Provides robust statistical methods resistant to outliers and model violations for reliable inference.

## Capabilities

- M-estimators (Huber, Tukey)
- Trimmed and winsorized estimators
- Robust regression (MM-estimation)
- Breakdown point analysis
- Influence function computation
- Robust covariance estimation

## Usage Guidelines

1. **Outlier Detection**: Identify potential outliers first
2. **Estimator Selection**: Choose based on expected contamination
3. **Breakdown Point**: Consider required breakdown point
4. **Efficiency**: Balance robustness and efficiency

## Tools/Libraries

- robustbase (R)
- scikit-learn
- statsmodels
