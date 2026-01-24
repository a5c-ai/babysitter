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
  - Task
metadata:
  version: "1.0"
  category: data-analysis
  domain: physics
  tools:
    - PyMC
    - arviz
    - Theano/JAX
  processes:
    - statistical-analysis-pipeline
    - machine-learning-for-physics
    - uncertainty-propagation-and-quantification
---

# PyMC Bayesian Modeler Skill

## Purpose

Provides PyMC probabilistic programming capabilities for building hierarchical Bayesian models with advanced inference techniques for physics data analysis.

## Capabilities

- **Model Construction**: Build probabilistic models with intuitive syntax
- **NUTS Sampling**: No-U-Turn Sampler for efficient posterior exploration
- **Variational Inference**: Fast approximate inference with ADVI
- **Gaussian Processes**: GP regression for smooth functions
- **Model Comparison**: WAIC and LOO cross-validation
- **Prior Predictive**: Validate models with prior predictive checks

## Usage Guidelines

1. **Model Definition**
   - Specify priors for parameters
   - Define likelihood function
   - Add hierarchical structure if needed
   - Include measurement uncertainties

2. **Prior Specification**
   - Choose weakly informative priors when possible
   - Use domain knowledge to constrain priors
   - Run prior predictive checks
   - Document prior choices

3. **Sampling**
   - Use NUTS for efficient sampling
   - Set target acceptance rate
   - Run multiple chains
   - Check for divergences

4. **Diagnostics**
   - Examine trace plots
   - Check R-hat for convergence
   - Compute effective sample size
   - Identify problematic parameters

5. **Best Practices**
   - Start with simple models
   - Validate against simulated data
   - Perform posterior predictive checks
   - Document model assumptions
