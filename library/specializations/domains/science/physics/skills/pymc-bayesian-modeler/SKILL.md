---
name: pymc-bayesian-modeler
description: PyMC probabilistic programming skill for hierarchical Bayesian models in physics data analysis
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

# PyMC Bayesian Modeler

## Purpose

Provides expert guidance on PyMC for Bayesian modeling in physics, including hierarchical models and advanced inference methods.

## Capabilities

- Probabilistic model construction
- NUTS/HMC sampling
- Variational inference
- Gaussian processes
- Model comparison (WAIC, LOO)
- Prior predictive checks

## Usage Guidelines

1. **Model Building**: Construct probabilistic models
2. **Priors**: Specify informative or weakly informative priors
3. **Sampling**: Use NUTS for efficient sampling
4. **Diagnostics**: Check convergence with trace plots and r-hat
5. **Comparison**: Compare models with information criteria

## Tools/Libraries

- PyMC
- arviz
- Theano/JAX
