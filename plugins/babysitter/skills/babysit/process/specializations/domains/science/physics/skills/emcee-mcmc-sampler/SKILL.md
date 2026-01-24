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
  - Task
metadata:
  version: "1.0"
  category: data-analysis
  domain: physics
  tools:
    - emcee
    - corner
    - arviz
  processes:
    - statistical-analysis-pipeline
    - uncertainty-propagation-and-quantification
    - blinded-analysis-protocol
---

# emcee MCMC Sampler Skill

## Purpose

Provides emcee affine-invariant ensemble MCMC sampling capabilities for Bayesian parameter estimation and posterior characterization in physics data analysis.

## Capabilities

- **Ensemble Sampling**: Affine-invariant stretch move algorithm
- **Parallel Tempering**: Sample multimodal distributions with ptemcee
- **Autocorrelation Analysis**: Estimate integrated autocorrelation time
- **Convergence Diagnostics**: Monitor chain convergence
- **Prior Specification**: Flexible prior distributions
- **Chain Visualization**: Corner plots and trace plots

## Usage Guidelines

1. **Problem Setup**
   - Define log-probability function (log-prior + log-likelihood)
   - Specify number of dimensions and walkers
   - Initialize walkers in high-probability region
   - Set number of steps based on autocorrelation

2. **Running Sampler**
   - Run initial burn-in phase
   - Monitor acceptance fraction
   - Check for walker convergence
   - Continue until well-mixed

3. **Convergence Assessment**
   - Calculate autocorrelation time
   - Ensure chain length >> autocorrelation time
   - Check Gelman-Rubin statistic across walkers
   - Visually inspect trace plots

4. **Results Analysis**
   - Discard burn-in samples
   - Thin chains if autocorrelated
   - Compute marginalized posteriors
   - Generate corner plots

5. **Best Practices**
   - Use many walkers (>> 2*ndim)
   - Run multiple independent chains
   - Document prior choices
   - Report median and credible intervals
