---
name: pymc-probabilistic-programming
description: PyMC for flexible Bayesian modeling in Python
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
  backlog-id: SK-MATH-022
  tools:
    - PyMC
    - ArviZ
    - PyTensor
  processes:
    - bayesian-inference-workflow
    - statistical-model-selection
---

# PyMC Probabilistic Programming Skill

## Purpose

Provides PyMC for flexible Bayesian modeling with Python integration and excellent visualization support.

## Capabilities

- **Hierarchical Models**: Build hierarchical/multilevel models
- **Custom Distributions**: Define custom distributions
- **Gaussian Processes**: GP regression and classification
- **MCMC/VI**: MCMC and variational inference
- **Diagnostics**: Comprehensive model diagnostics
- **ArviZ Integration**: Visualization with ArviZ

## Usage Guidelines

1. **Model Building**
   - Use PyMC context managers
   - Define priors appropriately
   - Build hierarchical structure

2. **Inference**
   - Choose MCMC or VI
   - Configure sampler settings
   - Run diagnostics

3. **Analysis**
   - Use ArviZ for visualization
   - Check convergence
   - Perform model comparison

4. **Best Practices**
   - Start with simple models
   - Check prior predictions
   - Iterate on model design
