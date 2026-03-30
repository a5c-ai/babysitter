---
name: tla-plus-generator
description: Generate and analyze TLA+ specifications for distributed systems verification
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

# TLA+ Generator

## Purpose

Provides expert guidance on generating TLA+ specifications for distributed systems design and verification.

## Capabilities

- TLA+ module generation from protocol description
- Invariant and temporal property specification
- State space exploration configuration
- PlusCal to TLA+ translation
- Model checking execution
- Refinement mapping

## Usage Guidelines

1. **System Modeling**: Model system components and state
2. **Action Specification**: Define system actions/transitions
3. **Property Specification**: Specify safety and liveness properties
4. **Model Checking**: Configure and run TLC model checker
5. **Refinement**: Relate abstract and concrete specifications

## Tools/Libraries

- TLA+ Toolbox
- TLC model checker
- TLAPS proof system
- PlusCal
