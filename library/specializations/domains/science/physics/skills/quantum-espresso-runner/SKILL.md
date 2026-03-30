---
name: quantum-espresso-runner
description: Quantum ESPRESSO DFT skill for plane-wave pseudopotential calculations and materials simulation
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
  category: numerical-simulation
  phase: 6
---

# Quantum ESPRESSO Runner

## Purpose

Provides expert guidance on Quantum ESPRESSO DFT calculations, including input file management, pseudopotential selection, and advanced property calculations.

## Capabilities

- Input file generation (pw.x, ph.x, pp.x)
- Pseudopotential library management
- Convergence testing automation
- Wannier90 interface for tight-binding
- Transport property calculations
- Spin-orbit coupling handling

## Usage Guidelines

1. **Input Generation**: Create proper QE input files for pw.x, ph.x, pp.x
2. **Pseudopotentials**: Select appropriate pseudopotentials from libraries
3. **Convergence**: Test cutoff and k-point convergence systematically
4. **Wannier Functions**: Interface with Wannier90 for tight-binding models
5. **Transport**: Calculate transport properties with BoltzTraP or EPW

## Tools/Libraries

- Quantum ESPRESSO
- Wannier90
- EPW
