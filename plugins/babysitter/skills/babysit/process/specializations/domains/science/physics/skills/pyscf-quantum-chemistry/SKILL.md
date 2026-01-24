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
  - Task
metadata:
  version: "1.0"
  category: quantum-mechanics
  domain: physics
  tools:
    - PySCF
    - Block2
    - libcint
  processes:
    - density-functional-theory-calculations
    - molecular-dynamics-simulation-setup
    - symmetry-and-conservation-law-analysis
---

# PySCF Quantum Chemistry Skill

## Purpose

Provides PySCF quantum chemistry capabilities for accurate molecular electronic structure calculations using post-Hartree-Fock methods and multireference approaches.

## Capabilities

- **Hartree-Fock**: Restricted and unrestricted HF calculations
- **Coupled Cluster**: CCSD and CCSD(T) for dynamic correlation
- **Multireference**: CASSCF and CASPT2 for static correlation
- **Periodic Systems**: Calculations with periodic boundary conditions
- **Relativistic Effects**: Spin-orbit coupling and scalar relativistic corrections
- **DMRG Integration**: Interface with Block2 for large active spaces

## Usage Guidelines

1. **Molecular Setup**
   - Define molecular geometry
   - Select appropriate basis set
   - Set charge and spin multiplicity
   - Choose point group symmetry

2. **Hartree-Fock Calculation**
   - Run RHF/UHF/ROHF as appropriate
   - Check SCF convergence
   - Analyze orbital energies
   - Verify spin contamination

3. **Correlation Methods**
   - Use MP2 for quick correlation estimate
   - Run CCSD(T) for accurate energies
   - Apply local correlation for large systems
   - Check T1 diagnostic for multireference character

4. **Multireference Calculations**
   - Select active space carefully
   - Run CASSCF for static correlation
   - Add dynamic correlation with NEVPT2 or CASPT2
   - Analyze natural orbital occupations

5. **Best Practices**
   - Perform basis set extrapolation
   - Validate against experimental data
   - Document computational settings
   - Consider size consistency
