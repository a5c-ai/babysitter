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
  - Task
metadata:
  version: "1.0"
  category: statistical-computing
  domain: mathematics
  backlog-id: SK-MATH-021
  tools:
    - Stan
    - CmdStan
    - RStan
    - PyStan
  processes:
    - bayesian-inference-workflow
    - statistical-model-selection
---

# Stan Bayesian Modeling Skill

## Purpose

Provides Stan probabilistic programming for rigorous Bayesian statistical inference using state-of-the-art MCMC.

## Capabilities

- **Model Specification**: Write Stan models
- **MCMC Sampling**: NUTS and HMC sampling
- **Variational Inference**: Automatic variational inference
- **Prior Checks**: Prior predictive checks
- **Posterior Checks**: Posterior predictive checks
- **Model Comparison**: LOO-CV and WAIC comparison

## Usage Guidelines

1. **Model Development**
   - Specify priors carefully
   - Use appropriate likelihood
   - Check model identifiability

2. **Sampling**
   - Run multiple chains
   - Check convergence (Rhat, ESS)
   - Diagnose divergences

3. **Model Checking**
   - Perform prior predictive checks
   - Conduct posterior predictive checks
   - Compare models with LOO

4. **Best Practices**
   - Use weakly informative priors
   - Check diagnostics thoroughly
   - Document model choices
