---
name: derivative-free-optimization
description: Optimization without gradient information
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
---

# Derivative-Free Optimization

## Purpose

Provides optimization capabilities for problems where gradient information is unavailable or unreliable.

## Capabilities

- Nelder-Mead simplex method
- Powell's method
- Surrogate-based optimization
- Bayesian optimization
- Pattern search methods
- Trust region methods

## Usage Guidelines

1. **Method Selection**: Choose based on problem characteristics
2. **Function Evaluations**: Minimize expensive function calls
3. **Surrogate Models**: Build and refine surrogate approximations
4. **Exploration-Exploitation**: Balance search strategies

## Tools/Libraries

- scipy.optimize
- Optuna
- GPyOpt
