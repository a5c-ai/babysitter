---
name: pymatching-decoder
description: Minimum-weight perfect matching decoder skill for surface code error correction
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

# PyMatching Decoder

## Purpose

Provides expert guidance on minimum-weight perfect matching decoding for surface codes and other topological quantum error correction codes.

## Capabilities

- MWPM decoding for surface codes
- Weighted edge matching
- Detector error model processing
- Logical error rate calculation
- Integration with Stim simulations
- Custom graph construction
- Belief propagation integration
- Parallelized decoding

## Usage Guidelines

1. **Graph Construction**: Build matching graph from detector error model
2. **Weight Assignment**: Configure edge weights based on error probabilities
3. **Decoding Execution**: Run MWPM algorithm on syndrome data
4. **Error Analysis**: Calculate logical error rates from decoding results
5. **Optimization**: Tune decoder parameters for specific code structures

## Tools/Libraries

- PyMatching
- NetworkX
- Stim
- NumPy
