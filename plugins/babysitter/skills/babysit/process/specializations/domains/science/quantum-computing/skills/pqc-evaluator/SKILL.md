---
name: pqc-evaluator
description: Post-quantum cryptography evaluation skill for assessing quantum resistance of cryptographic schemes
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
    - liboqs
    - PQClean
    - NIST PQC tools
  processes:
    - post-quantum-security-assessment
    - cryptographic-migration-planning
    - quantum-threat-analysis
---

# PQC Evaluator Skill

## Purpose

Provides post-quantum cryptography evaluation capabilities for assessing quantum resistance of cryptographic schemes and planning migration to quantum-safe algorithms.

## Capabilities

- **Algorithm Assessment**: Evaluate PQC algorithm candidates
- **Security Analysis**: Analyze quantum attack resistance
- **Performance Benchmarking**: Compare PQC implementations
- **Migration Planning**: Plan transition to PQC
- **Hybrid Schemes**: Design hybrid classical/PQC systems
- **Standards Compliance**: Check NIST PQC compliance

## Usage Guidelines

1. **Threat Assessment**
   - Analyze quantum threat timeline
   - Identify vulnerable systems
   - Prioritize migration targets

2. **Algorithm Selection**
   - Evaluate lattice, code, hash-based options
   - Consider security and performance tradeoffs
   - Check standardization status

3. **Implementation**
   - Use vetted implementations
   - Benchmark performance
   - Test interoperability

4. **Best Practices**
   - Stay current with NIST process
   - Consider crypto agility
   - Document migration decisions
   - Plan for algorithm updates
