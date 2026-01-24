---
name: mcmc-diagnostics
description: MCMC convergence diagnostics and analysis
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
  backlog-id: SK-MATH-023
  tools:
    - ArviZ
    - CODA
    - MCMCpack
  processes:
    - bayesian-inference-workflow
---

# MCMC Diagnostics Skill

## Purpose

Provides comprehensive MCMC convergence diagnostics for validating Bayesian inference results.

## Capabilities

- **Rhat Computation**: Compute potential scale reduction factor
- **ESS Calculation**: Effective sample size analysis
- **Trace Plots**: Generate trace plots
- **Autocorrelation**: Autocorrelation analysis
- **Divergence Detection**: Detect and analyze divergences
- **Energy Diagnostics**: E-BFMI energy diagnostics

## Usage Guidelines

1. **Convergence Checks**
   - Compute Rhat for all parameters
   - Check ESS is sufficient
   - Examine trace plots

2. **Problem Detection**
   - Identify divergences
   - Check energy diagnostics
   - Examine autocorrelation

3. **Remediation**
   - Increase warmup
   - Reparameterize model
   - Adjust step size

4. **Best Practices**
   - Run multiple chains
   - Check all diagnostics
   - Document diagnostic results
