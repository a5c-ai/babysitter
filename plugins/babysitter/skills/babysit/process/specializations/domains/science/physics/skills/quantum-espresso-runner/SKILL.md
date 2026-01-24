---
name: quantum-espresso-runner
description: Quantum ESPRESSO DFT skill for plane-wave pseudopotential calculations and materials simulation
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
    - Quantum ESPRESSO
    - Wannier90
    - EPW
  processes:
    - density-functional-theory-calculations
    - spectroscopy-measurement-campaign
---

# Quantum ESPRESSO Runner Skill

## Purpose

Provides Quantum ESPRESSO plane-wave DFT calculation capabilities for electronic structure, materials properties, and advanced calculations including Wannier functions and electron-phonon coupling.

## Capabilities

- **Input Generation**: Create input files for pw.x, ph.x, pp.x, and other QE executables
- **Pseudopotential Management**: Select and configure pseudopotentials from standard libraries
- **Convergence Automation**: Automated testing of cutoff energies and k-point grids
- **Wannier90 Interface**: Generate maximally localized Wannier functions for tight-binding models
- **Transport Properties**: Calculate conductivity and other transport coefficients
- **Spin-Orbit Coupling**: Handle fully relativistic calculations with SOC

## Usage Guidelines

1. **Input Preparation**
   - Select appropriate pseudopotential library (SSSP, PseudoDojo)
   - Set ecutwfc and ecutrho based on pseudopotential recommendations
   - Configure k-point mesh for desired accuracy
   - Enable spin polarization if needed (nspin=2)

2. **Self-Consistent Calculations**
   - Run SCF calculation (pw.x with calculation='scf')
   - Check convergence of total energy and forces
   - Save charge density for subsequent calculations

3. **Band Structure Workflow**
   - Run NSCF calculation on k-path
   - Use bands.x for band structure extraction
   - Plot using plotband.x or custom scripts

4. **Advanced Calculations**
   - Phonons: Use ph.x with appropriate q-point grid
   - Wannier: Generate Wannier functions with wannier90.x
   - EPW: Calculate electron-phonon matrix elements

5. **Best Practices**
   - Document all input parameters
   - Perform systematic convergence tests
   - Validate against known results
   - Use restart capabilities for long calculations
