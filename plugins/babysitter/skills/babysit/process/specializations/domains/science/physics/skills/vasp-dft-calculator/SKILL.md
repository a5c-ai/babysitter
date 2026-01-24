---
name: vasp-dft-calculator
description: VASP DFT calculation skill for electronic structure, band structures, and materials property predictions
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
    - VASP
    - VASPKIT
    - Phonopy
    - pymatgen
  processes:
    - density-functional-theory-calculations
    - material-synthesis-and-characterization
    - phase-transition-investigation
---

# VASP DFT Calculator Skill

## Purpose

Provides comprehensive VASP density functional theory calculation capabilities for electronic structure calculations, including band structures, density of states, geometry optimization, and materials property predictions.

## Capabilities

- **Input File Generation**: Create INCAR, POSCAR, POTCAR, and KPOINTS files with appropriate settings
- **K-point Mesh Optimization**: Determine optimal k-point sampling for accuracy vs. computational cost
- **SCF Convergence**: Manage self-consistent field convergence with appropriate mixing schemes
- **Band Structure Calculation**: Compute and plot band structures along high-symmetry paths
- **DOS Calculation**: Calculate total and projected density of states
- **Geometry Optimization**: Perform ionic relaxation and cell optimization
- **Phonon Calculations**: Interface with Phonopy for lattice dynamics

## Usage Guidelines

1. **Calculation Setup**
   - Choose appropriate exchange-correlation functional (PBE, PBE+U, HSE06)
   - Set ENCUT based on POTCAR recommendations
   - Configure k-point mesh appropriate for system size
   - Set EDIFF and EDIFFG for convergence criteria

2. **Convergence Testing**
   - Test ENCUT convergence (typically +30% above POTCAR recommendation)
   - Test k-point convergence for total energy
   - Check magnetic moment convergence for spin-polarized calculations

3. **Workflow Best Practices**
   - Start with rough optimization before fine calculations
   - Use IBRION=2 for ionic relaxation
   - Enable symmetry (ISYM=2) when appropriate
   - Save WAVECAR and CHGCAR for restart capabilities

4. **Post-Processing**
   - Use VASPKIT for DOS and band structure extraction
   - Use pymatgen for structure manipulation
   - Validate results against experimental data
   - Document all calculation parameters
