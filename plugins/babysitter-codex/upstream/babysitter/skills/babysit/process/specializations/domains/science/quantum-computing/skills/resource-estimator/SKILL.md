---
name: resource-estimator
description: Quantum resource estimation skill for algorithm feasibility analysis
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

# Resource Estimator

## Purpose

Provides expert guidance on estimating quantum resources required for algorithm execution, enabling feasibility analysis and hardware roadmap comparison.

## Capabilities

- Qubit count estimation
- Circuit depth analysis
- T-gate counting
- Error correction overhead
- Runtime projection
- Hardware roadmap comparison
- Logical-to-physical overhead
- Space-time volume calculation

## Usage Guidelines

1. **Algorithm Analysis**: Decompose algorithm into quantum operations
2. **Gate Counting**: Count gates by type (Clifford, T, etc.)
3. **Overhead Calculation**: Apply error correction overhead factors
4. **Timeline Projection**: Estimate execution time on target hardware
5. **Feasibility Assessment**: Compare with hardware capability roadmaps

## Tools/Libraries

- Azure Quantum Resource Estimator
- Qiskit
- Q#
- Custom estimation tools
- Spreadsheet models
