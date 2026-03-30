---
name: tensor-network-simulator
description: Tensor network-based simulation skill for large circuit approximation
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
  category: simulation
  phase: 6
---

# Tensor Network Simulator

## Purpose

Provides expert guidance on tensor network-based quantum circuit simulation for approximate evaluation of circuits beyond state vector limits.

## Capabilities

- MPS (Matrix Product State) simulation
- PEPS simulation for 2D circuits
- Contraction path optimization
- Truncation error control
- GPU-accelerated contraction
- Circuit cutting support
- Entanglement-limited approximation
- Memory-time tradeoff tuning

## Usage Guidelines

1. **Structure Analysis**: Identify circuit entanglement structure
2. **Method Selection**: Choose MPS, PEPS, or general tensor network
3. **Bond Dimension**: Set appropriate truncation threshold
4. **Contraction Ordering**: Optimize contraction path for efficiency
5. **Error Monitoring**: Track approximation errors through simulation

## Tools/Libraries

- TensorNetwork
- quimb
- ITensor
- cuTensorNet (NVIDIA cuQuantum)
- cotengra
