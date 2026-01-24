---
name: lumerical-photonics-simulator
description: Lumerical FDTD and MODE skill for nanophotonics, integrated photonics, and solar cell design
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
    - Lumerical FDTD
    - MODE
    - DEVICE
  processes:
    - experiment-design-and-planning
    - spectroscopy-measurement-campaign
---

# Lumerical Photonics Simulator Skill

## Purpose

Provides Lumerical FDTD and MODE Solutions capabilities for nanophotonic device simulation, integrated photonics design, and optoelectronic device modeling.

## Capabilities

- **2D/3D FDTD**: Time-domain electromagnetic simulation for broadband analysis
- **Eigenmode Expansion**: EME for long propagation structures
- **S-Parameter Extraction**: Calculate scattering parameters for circuit design
- **Grating Coupler Optimization**: Optimize fiber-to-chip coupling
- **CW and Pulsed Analysis**: Steady-state and transient simulations
- **CHARGE Integration**: Coupled optical-electrical device simulation

## Usage Guidelines

1. **Structure Design**
   - Import CAD geometry or create parametric structures
   - Assign materials from database or custom fits
   - Define simulation region with appropriate boundaries
   - Configure mesh settings for accuracy

2. **Source Setup**
   - Choose source type (plane wave, mode, dipole)
   - Set wavelength range for broadband simulation
   - Configure mode source for specific waveguide modes
   - Use TFSF for scattering calculations

3. **Monitor Configuration**
   - Place monitors for field and flux collection
   - Configure frequency points for spectral analysis
   - Set up mode expansion monitors
   - Enable time monitors for transient analysis

4. **Running Simulations**
   - Run convergence tests
   - Use parameter sweeps for optimization
   - Monitor memory and time requirements
   - Use parallel resources effectively

5. **Best Practices**
   - Validate mesh convergence
   - Compare with literature results
   - Use symmetry to reduce computation
   - Document all simulation settings
