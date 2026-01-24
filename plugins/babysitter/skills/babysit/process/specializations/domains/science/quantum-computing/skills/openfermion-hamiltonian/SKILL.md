---
name: openfermion-hamiltonian
description: OpenFermion integration skill for constructing and transforming molecular Hamiltonians for quantum simulation
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
    - OpenFermion
    - PySCF
    - Psi4
  processes:
    - molecular-hamiltonian-construction
    - vqe-molecular-simulation
    - quantum-chemistry-calculation
---

# OpenFermion Hamiltonian Skill

## Purpose

Provides molecular Hamiltonian construction capabilities using OpenFermion for preparing electronic structure problems for quantum simulation on quantum computers.

## Capabilities

- **Molecular Integrals**: Compute one- and two-electron integrals
- **Fermion Operators**: Build second-quantized Hamiltonians
- **Jordan-Wigner Transform**: Map to qubit operators
- **Bravyi-Kitaev Transform**: Alternative fermion-to-qubit mapping
- **Active Space Selection**: Define active space for simulation
- **Symmetry Reduction**: Reduce qubit count using symmetries

## Usage Guidelines

1. **Molecular Setup**
   - Define molecular geometry
   - Select basis set
   - Configure active space

2. **Hamiltonian Construction**
   - Compute molecular integrals via PySCF/Psi4
   - Build fermionic Hamiltonian
   - Apply symmetry reductions

3. **Qubit Mapping**
   - Choose mapping (JW, BK, parity)
   - Transform to qubit operators
   - Count terms and weight distribution

4. **Best Practices**
   - Start with small active spaces
   - Validate against classical results
   - Consider mapping overhead
   - Document molecular specifications
