---
name: wannier90-tight-binding
description: Wannier90 skill for maximally localized Wannier functions and tight-binding model construction
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
    - Wannier90
    - WannierTools
    - Z2Pack
  processes:
    - density-functional-theory-calculations
    - phase-transition-investigation
    - material-synthesis-and-characterization
---

# Wannier90 Tight-Binding Skill

## Purpose

Provides Wannier90 capabilities for constructing maximally localized Wannier functions from DFT calculations, enabling tight-binding model construction and topological property analysis.

## Capabilities

- **Wannierization**: Transform Bloch states to maximally localized Wannier functions
- **Band Interpolation**: Interpolate band structures to arbitrary k-point meshes
- **Berry Phase Calculations**: Compute Berry phases and Chern numbers
- **Topological Invariants**: Calculate Z2 invariants and Wilson loops
- **Transport Properties**: Model electronic transport using Wannier Hamiltonians
- **DFT Interface**: Interface with VASP, Quantum ESPRESSO, and other DFT codes

## Usage Guidelines

1. **DFT Preparation**
   - Run non-self-consistent calculation on uniform k-mesh
   - Generate overlap matrices (e.g., VASP: LWANNIER90=.TRUE.)
   - Ensure sufficient bands are included
   - Check band disentanglement needs

2. **Wannierization Setup**
   - Define projection centers and orbital types
   - Set energy windows for disentanglement
   - Configure spread minimization parameters
   - Specify number of Wannier functions

3. **Running Wannier90**
   - Generate initial projections
   - Run minimization to localize Wannier functions
   - Check spread convergence
   - Verify Wannier band structure matches DFT

4. **Tight-Binding Analysis**
   - Export Hamiltonian matrix elements
   - Calculate DOS and band structure on fine mesh
   - Compute Fermi surface
   - Evaluate transport properties

5. **Topological Analysis**
   - Calculate Berry curvature and Chern numbers
   - Determine Z2 invariants with Z2Pack
   - Compute surface states with WannierTools
   - Visualize Wannier functions
