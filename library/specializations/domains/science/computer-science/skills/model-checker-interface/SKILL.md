---
name: model-checker-interface
description: Interface with multiple model checking tools for formal verification
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
  category: formal-verification
  phase: 6
---

# Model Checker Interface

## Purpose

Provides expert guidance on using model checking tools for formal verification of systems and protocols.

## Capabilities

- SPIN/Promela specification generation
- NuSMV/NuXMV interface
- UPPAAL for timed systems
- Result parsing and visualization
- Counterexample trace analysis
- Abstraction refinement

## Usage Guidelines

1. **Tool Selection**: Choose appropriate model checker
2. **Specification**: Translate system to checker's language
3. **Properties**: Specify properties to verify
4. **Checking**: Run model checker
5. **Analysis**: Interpret results and counterexamples

## Tools/Libraries

- SPIN
- NuSMV
- UPPAAL
- PRISM
