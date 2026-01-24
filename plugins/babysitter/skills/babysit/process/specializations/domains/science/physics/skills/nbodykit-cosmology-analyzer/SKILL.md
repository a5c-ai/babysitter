---
name: nbodykit-cosmology-analyzer
description: nbodykit large-scale structure analysis skill for N-body simulations and galaxy surveys
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
    - nbodykit
    - Corrfunc
    - halotools
  processes:
    - monte-carlo-simulation-implementation
    - high-performance-computing-workflow
    - statistical-analysis-pipeline
---

# nbodykit Cosmology Analyzer Skill

## Purpose

Provides nbodykit capabilities for analyzing large-scale structure from N-body simulations and galaxy surveys, including power spectrum estimation and correlation functions.

## Capabilities

- **Power Spectrum**: FFT-based power spectrum estimation
- **Correlation Functions**: Two-point and higher-order correlations
- **Halo Finding**: Identify halos and compute mass functions
- **Particle Mesh**: Efficient density field operations
- **Mock Catalogs**: Generate realistic galaxy catalogs
- **MPI Parallelization**: Scale to large datasets

## Usage Guidelines

1. **Data Loading**
   - Read simulation snapshots
   - Load galaxy survey catalogs
   - Apply selection functions
   - Configure cosmology

2. **Density Field**
   - Paint particles to mesh
   - Apply compensation for mass assignment
   - Compute overdensity field
   - Handle periodic boundaries

3. **Power Spectrum**
   - Configure k-binning
   - Estimate P(k) with FFT
   - Apply window function corrections
   - Compute multipoles for redshift space

4. **Correlation Functions**
   - Use Corrfunc for pair counting
   - Estimate xi(r) or wp(rp)
   - Apply RR from randoms
   - Handle edge corrections

5. **Best Practices**
   - Test on smaller datasets first
   - Validate against known results
   - Document binning choices
   - Estimate sample variance
