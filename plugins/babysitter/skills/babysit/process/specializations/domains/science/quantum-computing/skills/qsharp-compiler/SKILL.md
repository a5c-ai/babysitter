---
name: qsharp-compiler
description: Microsoft Q# skill for quantum algorithm development with the Q# language and Azure Quantum integration
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
  category: quantum-frameworks
  domain: quantum-computing
  tools:
    - Q#
    - QDK
    - Azure Quantum
  processes:
    - quantum-circuit-design-and-optimization
    - quantum-resource-estimation
    - quantum-sdk-library-development
---

# Q# Compiler Skill

## Purpose

Provides Microsoft Q# quantum development capabilities for algorithm implementation, resource estimation, and Azure Quantum integration.

## Capabilities

- **Q# Compilation**: Compile and execute Q# programs
- **Resource Estimation**: Estimate quantum resources for algorithms
- **Azure Integration**: Submit jobs to Azure Quantum backends
- **QDK Simulation**: Simulate with Microsoft QDK
- **T-Gate Analysis**: Count T-gates and analyze circuit depth
- **Chemistry Libraries**: Access Microsoft.Quantum.Chemistry

## Usage Guidelines

1. **Q# Development**
   - Write operations and functions in Q#
   - Use built-in libraries for common tasks
   - Leverage Q# type system for safety

2. **Resource Estimation**
   - Configure target architecture
   - Run resource estimator
   - Analyze qubit and gate requirements

3. **Azure Quantum**
   - Configure Azure workspace
   - Select target provider
   - Submit and monitor jobs

4. **Best Practices**
   - Use namespaces for organization
   - Document operation signatures
   - Test with simulators first
   - Profile resource requirements
