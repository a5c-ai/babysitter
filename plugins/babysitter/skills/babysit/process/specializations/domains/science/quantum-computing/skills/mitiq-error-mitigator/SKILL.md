---
name: mitiq-error-mitigator
description: Mitiq integration skill for quantum error mitigation techniques on noisy quantum devices
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
  category: error-management
  domain: quantum-computing
  tools:
    - Mitiq
    - Zero-noise extrapolation
    - Probabilistic error cancellation
  processes:
    - error-mitigation-strategy-implementation
    - noisy-simulation-and-analysis
    - quantum-hardware-benchmarking
---

# Mitiq Error Mitigator Skill

## Purpose

Provides quantum error mitigation capabilities using the Mitiq library for improving computational results on noisy intermediate-scale quantum (NISQ) devices without requiring full quantum error correction.

## Capabilities

- **Zero-Noise Extrapolation**: Extrapolate to zero-noise limit
- **Probabilistic Error Cancellation**: Cancel noise with quasi-probabilities
- **Clifford Data Regression**: Learn and mitigate noise effects
- **Digital Dynamical Decoupling**: Suppress coherent errors
- **Readout Error Mitigation**: Correct measurement errors
- **Framework Agnostic**: Works with Qiskit, Cirq, PennyLane

## Usage Guidelines

1. **Technique Selection**
   - Choose based on noise type and circuit structure
   - Consider overhead requirements
   - Evaluate expected improvement

2. **ZNE Implementation**
   - Select noise scaling method
   - Choose extrapolation model
   - Configure scale factors

3. **PEC Implementation**
   - Characterize noise operations
   - Build quasi-probability representations
   - Sample mitigation circuits

4. **Best Practices**
   - Benchmark on known circuits
   - Combine techniques when beneficial
   - Monitor shot overhead
   - Document mitigation choices
