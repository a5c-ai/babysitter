---
name: monte-carlo-physics-simulator
description: Monte Carlo simulation skill for statistical physics, particle transport, and stochastic processes
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
  category: numerical-simulation
  domain: physics
  tools:
    - Custom MC codes
    - OpenMC
    - Geant4
  processes:
    - monte-carlo-simulation-implementation
    - statistical-analysis-pipeline
    - monte-carlo-event-generation
---

# Monte Carlo Physics Simulator Skill

## Purpose

Provides Monte Carlo simulation capabilities for statistical physics problems, particle transport, and stochastic process modeling with rigorous error estimation and variance reduction techniques.

## Capabilities

- **Metropolis Algorithm**: Implement Metropolis-Hastings sampling for equilibrium systems
- **Wang-Landau Sampling**: Flat-histogram methods for density of states calculations
- **Parallel Tempering**: Replica exchange Monte Carlo for complex energy landscapes
- **Variance Reduction**: Importance sampling, stratification, and control variates
- **Autocorrelation Analysis**: Determine statistical independence of samples
- **Error Estimation**: Jackknife and bootstrap methods for uncertainty quantification

## Usage Guidelines

1. **Algorithm Selection**
   - Choose algorithm based on problem structure
   - Metropolis for simple equilibrium sampling
   - Wang-Landau for phase transitions and rare events
   - Parallel tempering for complex landscapes

2. **Implementation**
   - Define energy function and proposal distribution
   - Set appropriate temperature or parameter schedule
   - Implement efficient data structures
   - Enable checkpointing for long runs

3. **Equilibration**
   - Discard initial samples during burn-in period
   - Monitor observables for equilibration
   - Use multiple independent runs
   - Check detailed balance

4. **Error Analysis**
   - Calculate autocorrelation time
   - Use binning analysis for error estimation
   - Apply jackknife or bootstrap for derived quantities
   - Report statistical uncertainties

5. **Best Practices**
   - Validate against exactly solvable cases
   - Document random number generator and seed
   - Perform systematic convergence studies
   - Archive raw data for reproducibility
