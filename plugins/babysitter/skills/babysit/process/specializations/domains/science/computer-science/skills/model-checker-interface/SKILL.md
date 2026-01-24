---
name: model-checker-interface
description: Interface with multiple model checking tools including SPIN, NuSMV, and UPPAAL
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
  category: formal-verification
  domain: computer-science
  tools:
    - SPIN
    - NuSMV
    - UPPAAL
  processes:
    - model-checking-verification
    - distributed-consensus-protocol-design
---

# Model Checker Interface Skill

## Purpose

Provides unified interface to multiple model checking tools for formal verification of systems.

## Capabilities

- **SPIN Interface**: Generate and check Promela specifications
- **NuSMV Interface**: Interface with NuSMV/NuXMV
- **UPPAAL Interface**: Model check timed systems
- **Result Parsing**: Parse and visualize results
- **Trace Analysis**: Analyze counterexample traces

## Usage Guidelines

1. **Tool Selection**
   - Choose SPIN for protocol verification
   - Use NuSMV for hardware verification
   - Apply UPPAAL for timed systems

2. **Specification Translation**
   - Translate system model
   - Specify properties to check
   - Configure state space bounds

3. **Verification Execution**
   - Run model checker
   - Analyze results
   - Interpret counterexamples

4. **Best Practices**
   - Start with bounded checking
   - Use abstraction for large systems
   - Document verification assumptions
   - Archive verification results
