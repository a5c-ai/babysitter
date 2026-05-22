---
name: stan-bayesian-modeling
description: Stan probabilistic programming for Bayesian inference
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
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:data-scientist]
---

# Stan Bayesian Modeling

## Purpose

Provides Stan probabilistic programming capabilities for Bayesian inference and statistical modeling.

## Capabilities

- Stan model specification
- MCMC sampling (NUTS, HMC)
- Variational inference
- Prior predictive checks
- Posterior predictive checks
- Model comparison (LOO-CV, WAIC)

## Usage Guidelines

1. **Model Specification**: Write Stan code with clear blocks
2. **Prior Selection**: Choose appropriate, weakly informative priors
3. **Diagnostics**: Check Rhat, ESS, and divergences
4. **Model Comparison**: Use LOO-CV for model selection

## Tools/Libraries

- Stan
- CmdStan
- RStan
- PyStan
