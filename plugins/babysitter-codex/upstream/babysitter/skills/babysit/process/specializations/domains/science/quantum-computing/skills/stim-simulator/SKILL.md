---
name: stim-simulator
description: Clifford circuit simulation skill using Stim for error correction studies
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
  category: error-management
  phase: 6
---

# Stim Simulator

## Purpose

Provides expert guidance on fast stabilizer circuit simulation using Stim, enabling large-scale quantum error correction studies and noise analysis.

## Capabilities

- Fast stabilizer circuit simulation
- Error injection and propagation
- Detector sampling
- Circuit tableau tracking
- Memory-efficient large-scale simulation
- Monte Carlo error rate estimation
- Detector error model generation
- Pauli frame simulation

## Usage Guidelines

1. **Circuit Construction**: Build Stim circuits with appropriate gates and noise
2. **Detector Definition**: Specify detectors for syndrome measurement
3. **Sampling**: Generate detector samples for decoding analysis
4. **Error Model**: Extract detector error models for decoder training
5. **Statistics**: Collect sufficient samples for statistical significance

## Tools/Libraries

- Stim
- Stimcirq
- PyMatching
- NumPy
