---
name: spinw-magnetic-simulator
description: SpinW spin wave simulation skill for magnetic materials, magnon dispersions, and neutron scattering analysis
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
  category: condensed-matter
  domain: physics
  tools:
    - SpinW (MATLAB)
    - magnopy
  processes:
    - spectroscopy-measurement-campaign
    - phase-transition-investigation
    - material-synthesis-and-characterization
---

# SpinW Magnetic Simulator Skill

## Purpose

Provides SpinW capabilities for spin wave calculations in magnetic materials, enabling analysis of magnon dispersions and neutron scattering cross sections.

## Capabilities

- **Magnetic Structure**: Define complex magnetic orderings and unit cells
- **Exchange Couplings**: Parameterize exchange interactions and anisotropies
- **Linear Spin Wave Theory**: Calculate magnon dispersions and eigenvectors
- **Neutron Scattering**: Compute dynamical structure factor S(Q,w)
- **Phase Diagrams**: Explore magnetic phase transitions
- **Powder Averaging**: Calculate powder-averaged spectra for polycrystals

## Usage Guidelines

1. **Structure Setup**
   - Define crystal structure with magnetic ions
   - Specify magnetic unit cell (may differ from chemical)
   - Set magnetic moment directions
   - Define propagation vector for incommensurate structures

2. **Exchange Parameters**
   - Add isotropic exchange interactions
   - Include Dzyaloshinskii-Moriya interactions
   - Set single-ion anisotropy terms
   - Define g-tensor if non-diagonal

3. **Spin Wave Calculation**
   - Verify ground state stability
   - Calculate magnon dispersion along Q-paths
   - Compute spin wave intensities
   - Check for imaginary frequencies (instabilities)

4. **Comparison with Experiment**
   - Simulate neutron scattering cross section
   - Apply experimental resolution function
   - Fit exchange parameters to data
   - Calculate powder averages for polycrystalline samples

5. **Best Practices**
   - Validate structure with magnetic refinement
   - Compare multiple exchange models
   - Document symmetry-allowed interactions
   - Archive all parameter sets
