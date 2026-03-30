---
name: power-sample-size-calculator
description: Statistical power analysis and sample size determination
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

# Power and Sample Size Calculator

## Purpose

Provides statistical power analysis and sample size determination capabilities for experimental design.

## Capabilities

- Power analysis for common tests (t-test, ANOVA, chi-square)
- Effect size calculation
- Sample size estimation
- Simulation-based power analysis
- Multi-level model power analysis
- Sequential analysis design

## Usage Guidelines

1. **Effect Size**: Specify meaningful effect sizes
2. **Power Target**: Set appropriate power levels (typically 0.80)
3. **Type I Error**: Control alpha appropriately
4. **Simulation**: Use simulation for complex designs

## Tools/Libraries

- G*Power
- pwr (R)
- statsmodels
