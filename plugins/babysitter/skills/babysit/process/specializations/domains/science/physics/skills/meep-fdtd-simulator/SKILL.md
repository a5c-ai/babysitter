---
name: meep-fdtd-simulator
description: MEEP electromagnetic FDTD simulation skill for photonic devices, metamaterials, and waveguides
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
  category: optics-photonics
  domain: physics
  tools:
    - MEEP
    - MPB
    - h5py
  processes:
    - experiment-design-and-planning
    - material-synthesis-and-characterization
    - spectroscopy-measurement-campaign
---

# MEEP FDTD Simulator Skill

## Purpose

Provides MEEP finite-difference time-domain simulation capabilities for electromagnetic wave propagation in photonic devices, metamaterials, and waveguide structures.

## Capabilities

- **Geometry Definition**: Define structures with arbitrary materials and shapes
- **Source Configuration**: Set up dipole, Gaussian beam, and plane wave sources
- **Absorbing Boundaries**: Configure perfectly matched layers (PML)
- **Flux Extraction**: Calculate transmission, reflection, and scattering
- **Parameter Sweeps**: Automated wavelength and parameter variation
- **Parallel Execution**: Distributed computation via domain decomposition

## Usage Guidelines

1. **Geometry Setup**
   - Define computational cell with appropriate size
   - Add geometric objects with material properties
   - Configure PML thickness for absorbing boundaries
   - Set spatial resolution for accuracy

2. **Source Configuration**
   - Choose source type based on application
   - Set center frequency and bandwidth
   - Position sources correctly relative to structures
   - Use eigenmode sources for waveguides

3. **Simulation Execution**
   - Run until fields decay for spectral calculations
   - Use continuous sources for steady-state analysis
   - Enable symmetries for computational savings
   - Monitor field evolution

4. **Post-Processing**
   - Extract flux through monitor surfaces
   - Calculate transmission/reflection spectra
   - Visualize field distributions
   - Export data in HDF5 format

5. **Best Practices**
   - Convergence test resolution
   - Validate against analytical solutions
   - Document all simulation parameters
   - Use normalization runs for absolute values
