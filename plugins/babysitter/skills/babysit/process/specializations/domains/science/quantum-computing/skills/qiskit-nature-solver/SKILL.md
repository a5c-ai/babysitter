---
name: qiskit-nature-solver
description: Qiskit Nature integration skill for quantum chemistry and materials science simulations
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
    - Qiskit Nature
    - Qiskit Algorithms
    - PySCF driver
  processes:
    - vqe-molecular-simulation
    - ground-state-energy-calculation
    - molecular-property-computation
---

# Qiskit Nature Solver Skill

## Purpose

Provides Qiskit Nature capabilities for solving quantum chemistry and materials science problems using variational and other quantum algorithms.

## Capabilities

- **VQE Solver**: Variational quantum eigensolver for ground states
- **ADAPT-VQE**: Adaptive ansatz construction
- **Excited States**: Compute excited state energies
- **Property Calculation**: Dipole moments and other properties
- **Driver Integration**: PySCF, PSI4, Gaussian drivers
- **Qubit Mapping**: Multiple fermion-to-qubit transforms

## Usage Guidelines

1. **Problem Setup**
   - Load molecular geometry
   - Run classical driver for integrals
   - Configure qubit mapping

2. **Algorithm Configuration**
   - Select solver (VQE, ADAPT-VQE, etc.)
   - Choose ansatz and optimizer
   - Configure convergence criteria

3. **Execution**
   - Run on simulator or hardware
   - Monitor optimization progress
   - Extract final energies

4. **Best Practices**
   - Start with small molecules
   - Compare with classical results
   - Use symmetry reduction
   - Document solver configuration
