---
name: qrng-generator
description: Quantum random number generation skill for cryptographic applications
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
  category: cryptography
  phase: 6
---

# QRNG Generator

## Purpose

Provides expert guidance on generating true random numbers using quantum processes for cryptographic and security applications.

## Capabilities

- Hadamard-based randomness generation
- Randomness extraction and post-processing
- NIST SP 800-90B compliance testing
- Entropy rate estimation
- Min-entropy analysis
- Integration with cryptographic APIs
- Bias correction
- Real-time QRNG streaming

## Usage Guidelines

1. **Circuit Design**: Build quantum circuits for randomness generation
2. **Execution**: Run on quantum hardware for true randomness
3. **Testing**: Verify randomness quality with statistical tests
4. **Post-Processing**: Apply extractors to remove bias
5. **Integration**: Connect QRNG output to cryptographic systems

## Tools/Libraries

- Qiskit
- NIST Statistical Test Suite
- dieharder
- TestU01
- PractRand
