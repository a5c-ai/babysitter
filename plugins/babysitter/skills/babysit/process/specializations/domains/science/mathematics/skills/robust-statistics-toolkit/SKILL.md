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
  - Task
metadata:
  version: "1.0"
  category: statistical-computing
  domain: mathematics
  backlog-id: SK-MATH-026
  tools:
    - robustbase (R)
    - statsmodels
    - scikit-learn
  processes:
    - exploratory-data-analysis
    - regression-analysis
---

# Robust Statistics Toolkit Skill

## Purpose

Provides robust statistical methods that are resistant to outliers and violations of distributional assumptions.

## Capabilities

- **M-Estimators**: Huber and bisquare M-estimators
- **Robust Regression**: MM-estimation, LTS, LMS regression
- **Robust Covariance**: MCD and OGK estimators
- **Robust PCA**: ROBPCA and projection pursuit
- **Outlier Detection**: Robust Mahalanobis distances
- **Robust Scale**: MAD and Qn estimators

## Usage Guidelines

1. **Method Selection**
   - Assess data contamination level
   - Choose appropriate breakdown point
   - Consider efficiency tradeoffs

2. **Implementation**
   - Start with robust exploration
   - Compare with classical methods
   - Identify influential observations

3. **Diagnostics**
   - Check robustness weights
   - Examine flagged outliers
   - Validate with sensitivity analysis

4. **Best Practices**
   - Document outlier handling
   - Report both robust and classical results
   - Justify method selection
