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
  - Task
metadata:
  version: "1.0"
  category: distributed-systems
  domain: computer-science
  tools:
    - TLA+ Toolbox
    - TLC model checker
    - PlusCal
  processes:
    - distributed-consensus-protocol-design
    - model-checking-verification
    - formal-specification-development
---

# TLA+ Generator Skill

## Purpose

Provides TLA+ specification generation capabilities for formal verification of distributed systems and protocols.

## Capabilities

- **Module Generation**: Generate TLA+ modules from protocol descriptions
- **Property Specification**: Specify invariants and temporal properties
- **State Space Configuration**: Configure model checking parameters
- **PlusCal Translation**: Translate PlusCal to TLA+
- **Model Checking**: Execute TLC model checker

## Usage Guidelines

1. **Specification Design**
   - Define state variables
   - Specify initial states
   - Define next-state relation

2. **Property Specification**
   - Define safety invariants
   - Specify liveness properties
   - Encode fairness conditions

3. **Model Checking**
   - Configure state space bounds
   - Execute TLC checker
   - Analyze counterexamples

4. **Best Practices**
   - Start with small models
   - Use symmetry reduction
   - Document specification assumptions
   - Iterate on counterexamples
