---
name: cosmosis-parameter-estimator
description: CosmoSIS cosmological parameter estimation skill for MCMC sampling and likelihood analysis
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
  category: cosmology
  domain: physics
  tools:
    - CosmoSIS
    - emcee
    - GetDist
  processes:
    - statistical-analysis-pipeline
    - uncertainty-propagation-and-quantification
    - machine-learning-for-physics
---

# CosmoSIS Parameter Estimator Skill

## Purpose

Provides CosmoSIS cosmological parameter estimation capabilities using modular likelihood construction and MCMC sampling for constraining cosmological models.

## Capabilities

- **Modular Likelihoods**: Construct likelihoods from independent modules
- **Multiple Samplers**: Support for emcee, multinest, polychord
- **Prior Specification**: Flexible prior definitions
- **Chain Analysis**: Convergence diagnostics and chain processing
- **Visualization**: Triangle plots and posterior visualization
- **Pipeline Construction**: Build complex analysis pipelines

## Usage Guidelines

1. **Pipeline Setup**
   - Define modules for theory calculations
   - Configure data likelihoods
   - Set parameter priors
   - Choose sampler settings

2. **Likelihood Configuration**
   - Add CMB, BAO, SN likelihoods
   - Configure covariance matrices
   - Set nuisance parameters
   - Define systematic uncertainties

3. **Sampling**
   - Run MCMC with appropriate sampler
   - Monitor convergence (Gelman-Rubin)
   - Check acceptance rates
   - Continue chains if needed

4. **Post-Processing**
   - Remove burn-in samples
   - Thin chains for independence
   - Compute marginalized constraints
   - Generate publication plots

5. **Best Practices**
   - Validate pipeline against published results
   - Run multiple independent chains
   - Document all configuration choices
   - Archive full chain outputs
