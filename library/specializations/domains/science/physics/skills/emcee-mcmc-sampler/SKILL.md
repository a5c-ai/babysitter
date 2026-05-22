---
name: emcee-mcmc-sampler
description: emcee MCMC skill for Bayesian parameter estimation and posterior sampling in physics applications
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: physics
  domain: science
  category: data-analysis
  phase: 6
graph:
  domains: [domain:physics]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:data-analysis]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:research-scientist, role:computational-scientist]
---

# emcee MCMC Sampler

## Purpose

Provides expert guidance on emcee for Bayesian parameter estimation in physics, including ensemble sampling and convergence diagnostics.

## Capabilities

- Affine-invariant ensemble sampling
- Parallel tempering support
- Autocorrelation analysis
- Convergence diagnostics
- Prior/likelihood specification
- Chain visualization

## Usage Guidelines

1. **Model Setup**: Define log-probability function
2. **Initialization**: Initialize walkers appropriately
3. **Sampling**: Run ensemble sampler
4. **Convergence**: Check autocorrelation and convergence
5. **Analysis**: Extract posterior distributions

## Tools/Libraries

- emcee
- corner
- arviz
