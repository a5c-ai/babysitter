---
name: pyscf-interface
description: PySCF quantum chemistry interface skill for generating molecular data for quantum algorithms
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
  category: quantum-chemistry
  domain: quantum-computing
  tools:
    - PySCF
    - OpenFermion-PySCF
    - Qiskit Nature
  processes:
    - molecular-hamiltonian-construction
    - classical-reference-calculation
    - active-space-selection
---

# PySCF Interface Skill

## Purpose

Provides PySCF quantum chemistry interface capabilities for computing molecular integrals, performing classical reference calculations, and preparing molecular data for quantum simulation.

## Capabilities

- **Hartree-Fock Calculations**: Compute HF reference states
- **Integral Generation**: Generate one- and two-electron integrals
- **Active Space Selection**: Define CASSCF active spaces
- **Geometry Optimization**: Optimize molecular structures
- **Basis Set Support**: Wide range of basis sets
- **OpenFermion Integration**: Export to OpenFermion format

## Usage Guidelines

1. **Molecular Setup**
   - Define atom positions and charges
   - Select appropriate basis set
   - Configure spin and symmetry

2. **Reference Calculations**
   - Run Hartree-Fock or DFT
   - Analyze molecular orbitals
   - Select active space orbitals

3. **Integral Export**
   - Generate AO or MO integrals
   - Export to OpenFermion
   - Prepare for quantum simulation

4. **Best Practices**
   - Validate basis set convergence
   - Check SCF convergence
   - Document computational settings
   - Compare with literature values
