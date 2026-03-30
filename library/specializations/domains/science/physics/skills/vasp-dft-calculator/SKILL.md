---
name: vasp-dft-calculator
description: VASP DFT calculation skill for electronic structure, band structures, and materials property predictions
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: physics
  tags:
    - dft
    - electronic-structure
    - materials-science
    - band-structure
---

# VASP DFT Calculator Skill

## Purpose
Provide comprehensive integration with VASP for density functional theory calculations, electronic structure analysis, and materials property predictions.

## Capabilities
- INCAR/POSCAR/POTCAR generation
- k-point mesh optimization
- Self-consistent field convergence management
- Band structure and DOS calculation
- Geometry optimization workflows
- Phonon calculation setup (with Phonopy)

## Usage Guidelines
- Select appropriate exchange-correlation functionals
- Converge k-point mesh and energy cutoff systematically
- Use appropriate smearing methods for metals vs insulators
- Document pseudopotential versions for reproducibility

## Dependencies
- VASP
- VASPKIT
- Phonopy
- pymatgen

## Process Integration
- Density Functional Theory Calculations
- Material Synthesis and Characterization
- Phase Transition Investigation
