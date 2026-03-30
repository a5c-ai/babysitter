---
name: monte-carlo-simulation
description: Monte Carlo methods for uncertainty quantification
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
  category: uncertainty-quantification
  phase: 6
---

# Monte Carlo Simulation

## Purpose

Provides Monte Carlo methods for uncertainty quantification, integration, and probabilistic analysis.

## Capabilities

- Standard Monte Carlo sampling
- Importance sampling
- Stratified sampling
- Quasi-Monte Carlo (Sobol, Halton sequences)
- Markov chain Monte Carlo
- Convergence analysis

## Usage Guidelines

1. **Sampling Strategy**: Choose appropriate sampling method
2. **Sample Size**: Determine sufficient sample sizes
3. **Variance Reduction**: Apply variance reduction techniques
4. **Convergence**: Monitor convergence diagnostics

## Tools/Libraries

- NumPy
- scipy.stats
- SALib
