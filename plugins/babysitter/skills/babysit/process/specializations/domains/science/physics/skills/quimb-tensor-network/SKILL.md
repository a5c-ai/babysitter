---
name: quimb-tensor-network
description: QuTiP/quimb tensor network skill for quantum many-body simulations and entanglement analysis
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

# Quimb Tensor Network

## Purpose

Provides expert guidance on tensor network simulations for quantum many-body systems, including MPS, DMRG, and entanglement analysis.

## Capabilities

- MPS and DMRG calculations
- TEBD time evolution
- Entanglement entropy computation
- Quantum master equation solving
- Open quantum systems dynamics
- GPU-accelerated contractions

## Usage Guidelines

1. **State Representation**: Use MPS for one-dimensional systems
2. **Ground States**: Run DMRG for ground state calculations
3. **Time Evolution**: Use TEBD for dynamics
4. **Entanglement**: Calculate entanglement entropy and spectra
5. **Open Systems**: Model dissipative quantum systems

## Tools/Libraries

- quimb
- QuTiP
- ITensor
