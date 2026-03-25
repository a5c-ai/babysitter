---
name: pyscf-quantum-chemistry
description: PySCF quantum chemistry skill for molecular calculations, coupled cluster, and multireference methods
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
  category: quantum-mechanics
  phase: 6
---

# PySCF Quantum Chemistry

## Purpose

Provides expert guidance on PySCF quantum chemistry calculations, including post-Hartree-Fock methods and multireference approaches.

## Capabilities

- Hartree-Fock and post-HF methods
- Coupled cluster (CCSD, CCSD(T))
- CASSCF/CASPT2 multireference
- Periodic boundary conditions
- Relativistic corrections
- DMRG integration

## Usage Guidelines

1. **System Setup**: Define molecular geometry and basis set
2. **Mean-Field**: Run Hartree-Fock calculations
3. **Correlation**: Apply post-HF methods for correlation
4. **Multireference**: Use CASSCF for strongly correlated systems
5. **Advanced**: Include relativistic effects when needed

## Tools/Libraries

- PySCF
- Block2
- libcint
