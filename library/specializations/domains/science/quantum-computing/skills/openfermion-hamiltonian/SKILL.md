---
name: openfermion-hamiltonian
description: Molecular Hamiltonian construction skill using OpenFermion
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

# OpenFermion Hamiltonian

## Purpose

Provides expert guidance on molecular Hamiltonian construction and fermion-to-qubit mappings using OpenFermion for quantum chemistry applications.

## Capabilities

- Molecular Hamiltonian generation
- Jordan-Wigner transformation
- Bravyi-Kitaev transformation
- Parity transformation
- Second quantization handling
- Symmetry reduction
- Active space selection
- Hamiltonian term grouping

## Usage Guidelines

1. **Molecular Setup**: Define molecular geometry and basis set
2. **Hamiltonian Generation**: Compute molecular integrals and construct Hamiltonian
3. **Transformation Selection**: Choose appropriate fermion-to-qubit mapping
4. **Qubit Reduction**: Apply symmetry and active space reductions
5. **Term Analysis**: Analyze Hamiltonian structure for circuit design

## Tools/Libraries

- OpenFermion
- OpenFermion-PySCF
- OpenFermion-Psi4
- Qiskit Nature
- PennyLane
