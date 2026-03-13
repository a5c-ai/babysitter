---
name: mitiq-error-mitigator
description: Error mitigation skill using Mitiq for NISQ device noise reduction
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

# Mitiq Error Mitigator

## Purpose

Provides expert guidance on error mitigation techniques for NISQ devices using Mitiq, reducing the impact of noise without full quantum error correction.

## Capabilities

- Zero-noise extrapolation (ZNE)
- Probabilistic error cancellation (PEC)
- Clifford data regression (CDR)
- Digital dynamical decoupling
- Pauli twirling
- Learning-based error mitigation
- Noise scaling methods
- Extrapolation fitting

## Usage Guidelines

1. **Technique Selection**: Choose mitigation method based on noise characteristics
2. **Noise Scaling**: Configure appropriate noise amplification factors
3. **Extrapolation**: Select fitting model for zero-noise extrapolation
4. **Overhead Analysis**: Evaluate sampling overhead vs. accuracy improvement
5. **Validation**: Compare mitigated results with theoretical expectations

## Tools/Libraries

- Mitiq
- Qiskit
- Cirq
- PennyLane
- NumPy
