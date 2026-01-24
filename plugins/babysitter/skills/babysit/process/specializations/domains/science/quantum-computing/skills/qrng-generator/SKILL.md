---
name: qrng-generator
description: Quantum random number generation skill for producing certified random numbers using quantum processes
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
  category: quantum-cryptography
  domain: quantum-computing
  tools:
    - Qiskit
    - QRNG APIs
    - Randomness extractors
  processes:
    - quantum-randomness-generation
    - certified-randomness-protocol
    - cryptographic-key-generation
---

# QRNG Generator Skill

## Purpose

Provides quantum random number generation capabilities for producing high-quality random numbers certified by quantum mechanical principles for cryptographic and simulation applications.

## Capabilities

- **Measurement-Based QRNG**: Generate randomness from qubit measurements
- **Vacuum Fluctuation QRNG**: Use quantum vacuum noise
- **Device-Independent QRNG**: Bell-test certified randomness
- **Randomness Extraction**: Post-process raw quantum randomness
- **Entropy Estimation**: Quantify randomness quality
- **Statistical Testing**: Validate randomness quality

## Usage Guidelines

1. **Source Selection**
   - Choose QRNG method based on requirements
   - Consider certification level needed
   - Evaluate throughput requirements

2. **Generation**
   - Configure quantum source
   - Collect raw random bits
   - Apply randomness extraction

3. **Validation**
   - Run statistical test suites
   - Verify entropy bounds
   - Document certification chain

4. **Best Practices**
   - Use appropriate post-processing
   - Maintain entropy accounting
   - Document randomness source
   - Archive certification data
