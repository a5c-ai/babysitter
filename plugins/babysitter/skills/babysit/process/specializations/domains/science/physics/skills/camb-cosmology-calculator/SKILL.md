---
name: camb-cosmology-calculator
description: CAMB cosmological perturbation skill for CMB power spectra, matter power spectra, and cosmological parameter estimation
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
    - CAMB
    - CLASS
    - CosmoMC
  processes:
    - mathematical-model-derivation
    - statistical-analysis-pipeline
    - perturbation-theory-analysis
---

# CAMB Cosmology Calculator Skill

## Purpose

Provides CAMB (Code for Anisotropies in the Microwave Background) capabilities for computing CMB anisotropy power spectra, matter power spectra, and transfer functions for cosmological analysis.

## Capabilities

- **CMB Spectra**: Temperature and polarization power spectra (TT, EE, BB, TE)
- **Matter Power Spectrum**: Linear and nonlinear matter clustering
- **Transfer Functions**: Compute transfer functions for initial conditions
- **Dark Energy Models**: Equation of state parameterizations (w0, wa)
- **Massive Neutrinos**: Include neutrino mass effects
- **Python Interface**: Full Python API for integration

## Usage Guidelines

1. **Cosmological Parameters**
   - Set Hubble constant, omega parameters
   - Configure baryon density
   - Set primordial spectrum parameters
   - Include dark energy equation of state

2. **CMB Calculations**
   - Configure multipole range
   - Enable lensing if needed
   - Choose accuracy settings
   - Compute all relevant spectra

3. **Matter Power Spectrum**
   - Set wavenumber range
   - Choose redshifts of interest
   - Enable nonlinear corrections (Halofit)
   - Consider baryonic effects

4. **Parameter Studies**
   - Vary cosmological parameters
   - Compute derivatives for Fisher analysis
   - Generate theory predictions
   - Compare with observational data

5. **Best Practices**
   - Validate against published results
   - Check numerical convergence
   - Document all parameter choices
   - Use consistent units
