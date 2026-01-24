---
name: kwant-quantum-transport
description: Kwant quantum transport skill for mesoscopic physics, scattering matrix calculations, and nanostructure modeling
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
  category: condensed-matter
  domain: physics
  tools:
    - Kwant
    - NumPy
    - SciPy
  processes:
    - density-functional-theory-calculations
    - material-synthesis-and-characterization
---

# Kwant Quantum Transport Skill

## Purpose

Provides Kwant capabilities for quantum transport simulations in mesoscopic systems, enabling scattering matrix calculations and analysis of nanostructure electronic properties.

## Capabilities

- **System Builder**: Construct tight-binding systems with arbitrary geometries
- **Scattering Matrix**: Compute S-matrices for multi-terminal devices
- **Landauer-Buttiker**: Calculate conductance using Landauer formalism
- **Hamiltonian Construction**: Build tight-binding Hamiltonians with various terms
- **Band Structure**: Compute band structures for infinite systems
- **Parallel Computation**: Parallelize calculations over energy or parameter ranges

## Usage Guidelines

1. **System Definition**
   - Define lattice structure and unit cell
   - Create scattering region shape function
   - Add leads with appropriate lattice symmetry
   - Define onsite and hopping terms

2. **Hamiltonian Setup**
   - Include magnetic field via Peierls phase
   - Add spin-orbit coupling terms
   - Implement disorder as needed
   - Set up potential profiles

3. **Transport Calculations**
   - Finalize system before calculations
   - Compute S-matrix at each energy
   - Extract transmission coefficients
   - Calculate conductance from Landauer formula

4. **Analysis**
   - Plot band structure of leads
   - Visualize wave functions
   - Compute local density of states
   - Study parameter dependence

5. **Best Practices**
   - Verify lead modes are propagating
   - Check convergence with system size
   - Validate against known results
   - Document Hamiltonian parameters
