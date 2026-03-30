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
