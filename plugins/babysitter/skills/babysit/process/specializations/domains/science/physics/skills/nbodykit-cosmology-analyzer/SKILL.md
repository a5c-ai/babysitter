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
metadata:
  specialization: physics
  domain: science
  category: cosmology
  phase: 6
---

# Nbodykit Cosmology Analyzer

## Purpose

Provides expert guidance on nbodykit for large-scale structure analysis, including power spectrum estimation and correlation function calculations.

## Capabilities

- Power spectrum estimation (FFT-based)
- Correlation function computation
- Halo finding and mass functions
- Particle mesh operations
- Mock catalog generation
- MPI parallelization

## Usage Guidelines

1. **Data Loading**: Load simulation or survey data
2. **Power Spectrum**: Estimate power spectra with FFT methods
3. **Correlation Functions**: Compute two-point correlations
4. **Halo Catalogs**: Work with halo finder outputs
5. **Mock Generation**: Create mock galaxy catalogs

## Tools/Libraries

- nbodykit
- Corrfunc
- halotools
