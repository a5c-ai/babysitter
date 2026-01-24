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
  - Task
metadata:
  version: "1.0"
  category: optimization
  domain: mathematics
  backlog-id: SK-MATH-020
  tools:
    - scipy.optimize
    - Optuna
    - GPyOpt
  processes:
    - optimization-problem-formulation
---

# Derivative-Free Optimization Skill

## Purpose

Provides optimization methods that do not require gradient information, suitable for noisy or expensive functions.

## Capabilities

- **Nelder-Mead**: Simplex-based direct search
- **Powell's Method**: Direction set methods
- **Surrogate Optimization**: Surrogate-based methods
- **Bayesian Optimization**: Bayesian optimization with GPs
- **Pattern Search**: Pattern and mesh search methods
- **Trust Region**: Derivative-free trust region methods

## Usage Guidelines

1. **Method Selection**
   - Use Nelder-Mead for low dimensions
   - Use surrogate methods for expensive functions
   - Use Bayesian optimization for few evaluations

2. **Configuration**
   - Set appropriate bounds
   - Configure evaluation budget
   - Handle constraints appropriately

3. **Convergence**
   - Monitor convergence
   - Use multiple restarts
   - Validate final solution

4. **Best Practices**
   - Start with simple methods
   - Budget function evaluations
   - Document search history
