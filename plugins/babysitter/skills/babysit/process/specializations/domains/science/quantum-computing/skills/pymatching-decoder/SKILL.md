---
name: pymatching-decoder
description: PyMatching integration skill for minimum-weight perfect matching decoding of quantum error correction codes
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
    - PyMatching
    - MWPM decoding
    - Stim integration
  processes:
    - quantum-error-correction-design
    - fault-tolerant-circuit-design
    - decoder-performance-benchmarking
---

# PyMatching Decoder Skill

## Purpose

Provides minimum-weight perfect matching (MWPM) decoding capabilities using PyMatching for decoding surface codes and other CSS codes with high performance.

## Capabilities

- **MWPM Decoding**: Decode using minimum-weight perfect matching
- **Stim Integration**: Direct integration with Stim circuits
- **Custom Matching Graphs**: Build matching graphs from error models
- **Weighted Edges**: Support probability-weighted matching
- **Batch Decoding**: Decode many syndrome samples efficiently
- **Threshold Analysis**: Determine code threshold via simulation

## Usage Guidelines

1. **Matching Graph Construction**
   - Build from Stim detector error models
   - Define custom matching graphs
   - Configure edge weights from error probabilities

2. **Decoding**
   - Decode syndrome samples from Stim
   - Process detector outcomes
   - Determine logical errors

3. **Performance Analysis**
   - Run threshold simulations
   - Calculate logical error rates
   - Compare decoder variants

4. **Best Practices**
   - Use Stim integration for efficiency
   - Verify decoder correctness on small codes
   - Profile decoding speed
   - Document matching graph structure
