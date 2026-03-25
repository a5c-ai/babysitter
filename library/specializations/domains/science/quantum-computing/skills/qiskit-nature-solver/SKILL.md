---
name: qiskit-nature-solver
description: Qiskit Nature skill for quantum chemistry and materials science applications
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

# Qiskit Nature Solver

## Purpose

Provides expert guidance on quantum chemistry and materials science calculations using Qiskit Nature, enabling ground state and excited state solutions.

## Capabilities

- VQE ground state solver
- QEOM excited state solver
- Fermionic operator handling
- Molecular driver integration
- Active space reduction
- Lattice model construction
- Property calculation
- Qubit converter management

## Usage Guidelines

1. **Problem Setup**: Define molecular system using supported drivers
2. **Mapping Selection**: Choose qubit mapping strategy (Jordan-Wigner, Parity, etc.)
3. **Solver Configuration**: Set up VQE with ansatz and optimizer
4. **Execution**: Run ground state calculation with convergence monitoring
5. **Analysis**: Extract energies, wavefunctions, and molecular properties

## Tools/Libraries

- Qiskit Nature
- Qiskit Algorithms
- PySCF driver
- Gaussian driver
- Qiskit Aer
