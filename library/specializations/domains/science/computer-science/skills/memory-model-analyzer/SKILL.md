---
name: memory-model-analyzer
description: Analyze programs under various memory models for concurrent correctness
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: computer-science
  domain: science
  category: distributed-systems
  phase: 6
---

# Memory Model Analyzer

## Purpose

Provides expert guidance on analyzing concurrent programs under various hardware and language memory models.

## Capabilities

- Sequential consistency checking
- Total Store Order (TSO) analysis
- C/C++ memory model compliance
- Memory barrier insertion guidance
- Race condition detection
- Weak memory model reasoning

## Usage Guidelines

1. **Model Selection**: Identify relevant memory model
2. **Analysis**: Check program behavior under model
3. **Barrier Placement**: Determine required fences/barriers
4. **Race Detection**: Find data races
5. **Verification**: Verify correct synchronization

## Tools/Libraries

- CDSChecker
- GenMC
- CBMC
- herd7
