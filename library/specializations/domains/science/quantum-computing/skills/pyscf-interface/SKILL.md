---
name: pyscf-interface
description: PySCF quantum chemistry interface for classical electronic structure calculations
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: quantum-computing
  domain: science
  category: quantum-chemistry
  phase: 6
---

# PySCF Interface

## Purpose

Provides expert guidance on PySCF quantum chemistry calculations for generating molecular data needed in quantum computing applications.

## Capabilities

- Hartree-Fock calculations
- Coupled cluster (CCSD) calculations
- Active space selection
- Molecular orbital visualization
- Integral computation
- Basis set management
- Geometry optimization
- Property calculations

## Usage Guidelines

1. **Molecule Definition**: Specify molecular geometry and charge/multiplicity
2. **Basis Selection**: Choose appropriate basis set for accuracy requirements
3. **Method Execution**: Run HF, CCSD, or other methods for reference energies
4. **Integral Export**: Extract one and two-electron integrals for quantum algorithms
5. **Active Space**: Identify chemically relevant orbitals for reduced calculations

## Tools/Libraries

- PySCF
- OpenFermion-PySCF
- Qiskit Nature
- ASE
- RDKit
