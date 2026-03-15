---
name: pqc-evaluator
description: Post-quantum cryptography evaluation skill for quantum-safe migration
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

# PQC Evaluator

## Purpose

Provides expert guidance on evaluating post-quantum cryptographic algorithms and planning quantum-safe migration strategies.

## Capabilities

- NIST PQC standard implementation checks
- Lattice-based algorithm analysis
- Code-based cryptography evaluation
- Hash-based signature verification
- Hybrid classical-PQC schemes
- Migration impact assessment
- Performance benchmarking
- Key size analysis

## Usage Guidelines

1. **Inventory Assessment**: Catalog current cryptographic usage
2. **Algorithm Selection**: Choose appropriate PQC algorithms for use cases
3. **Implementation Review**: Verify correct implementation of PQC schemes
4. **Performance Testing**: Benchmark PQC against classical algorithms
5. **Migration Planning**: Develop phased migration strategy

## Tools/Libraries

- liboqs
- PQClean
- OpenSSL (with PQC support)
- Bouncy Castle
- SUPERCOP
