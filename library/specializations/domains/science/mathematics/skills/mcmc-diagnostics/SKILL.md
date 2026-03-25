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
metadata:
  specialization: mathematics
  domain: science
  category: statistical-computing
  phase: 6
---

# MCMC Diagnostics

## Purpose

Provides MCMC convergence diagnostics and analysis capabilities for validating Bayesian inference results.

## Capabilities

- Rhat (potential scale reduction) computation
- Effective sample size (ESS) calculation
- Trace plot generation
- Autocorrelation analysis
- Divergence detection
- Energy diagnostic (E-BFMI)

## Usage Guidelines

1. **Convergence Check**: Verify Rhat < 1.01 for all parameters
2. **Sample Quality**: Ensure ESS is sufficient for inference
3. **Visual Inspection**: Review trace plots for mixing
4. **Divergences**: Address divergent transitions

## Tools/Libraries

- ArviZ
- CODA
- MCMCpack
