---
name: monte-carlo-simulation
description: Monte Carlo methods for sampling and estimation
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
  backlog-id: SK-MATH-029
  tools:
    - NumPy
    - SciPy
    - PyMC
  processes:
    - uncertainty-quantification
    - bayesian-inference-workflow
---

# Monte Carlo Simulation Skill

## Purpose

Provides Monte Carlo methods for probabilistic sampling, numerical integration, and stochastic estimation.

## Capabilities

- **Random Sampling**: Uniform, stratified, importance sampling
- **MCMC Methods**: Metropolis-Hastings, Gibbs sampling
- **Variance Reduction**: Control variates, antithetic variables
- **Rare Event Simulation**: Importance sampling, splitting
- **Convergence Analysis**: Error estimation, confidence intervals
- **Quasi-Monte Carlo**: Low-discrepancy sequences

## Usage Guidelines

1. **Method Selection**
   - Analyze problem dimensionality
   - Assess variance requirements
   - Choose appropriate sampler

2. **Implementation**
   - Validate random number quality
   - Implement burn-in for MCMC
   - Monitor convergence

3. **Error Analysis**
   - Estimate Monte Carlo error
   - Compute confidence intervals
   - Check for bias

4. **Best Practices**
   - Use reproducible seeds
   - Document assumptions
   - Report uncertainty estimates
