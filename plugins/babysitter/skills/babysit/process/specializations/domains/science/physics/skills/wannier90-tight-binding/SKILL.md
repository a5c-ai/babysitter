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
metadata:
  specialization: physics
  domain: science
  category: condensed-matter
  phase: 6
---

# Wannier90 Tight-Binding

## Purpose

Provides expert guidance on Wannier90 for constructing maximally localized Wannier functions and tight-binding models from DFT calculations.

## Capabilities

- Wannierization from DFT
- Band interpolation
- Berry phase calculations
- Topological invariant computation
- Transport property modeling
- Interface with DFT codes (VASP, QE)

## Usage Guidelines

1. **Wannierization**: Set up Wannier90 input from DFT calculations
2. **Disentanglement**: Configure frozen and disentanglement windows
3. **Band Interpolation**: Generate interpolated band structures
4. **Topology**: Calculate Berry phases and topological invariants
5. **Transport**: Interface with transport codes

## Tools/Libraries

- Wannier90
- WannierTools
- Z2Pack
