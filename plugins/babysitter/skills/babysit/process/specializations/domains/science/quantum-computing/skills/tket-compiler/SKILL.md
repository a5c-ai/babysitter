---
name: tket-compiler
description: Quantinuum t|ket> integration skill for advanced quantum circuit compilation and optimization
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
  category: circuit-design
  domain: quantum-computing
  tools:
    - pytket
    - t|ket> compiler
    - pytket-extensions
  processes:
    - quantum-circuit-design-and-optimization
    - hardware-backend-configuration
    - multi-platform-deployment
---

# t|ket> Compiler Skill

## Purpose

Provides Quantinuum t|ket> quantum compiler capabilities for advanced circuit optimization, hardware-specific compilation, and cross-platform circuit deployment.

## Capabilities

- **Multi-Stage Compilation**: Apply optimization passes in sequence
- **Hardware Routing**: Route circuits for specific device topologies
- **Gate Set Conversion**: Convert to target native gate sets
- **Peephole Optimization**: Apply local circuit optimizations
- **Backend Integration**: Compile for multiple hardware platforms
- **Circuit Transformation**: Transform circuits between representations

## Usage Guidelines

1. **Circuit Import**
   - Import from Qiskit, Cirq, or other frameworks
   - Define circuits using pytket primitives
   - Configure symbolic parameters

2. **Optimization Passes**
   - Apply FullPeepholeOptimise for general optimization
   - Use RemoveRedundancies for gate cancellation
   - Configure pass sequences for specific goals

3. **Backend Compilation**
   - Select target backend
   - Apply device-specific compilation
   - Verify compiled circuit validity

4. **Best Practices**
   - Benchmark different optimization strategies
   - Use platform-specific extensions
   - Document compilation choices
   - Test on simulators before hardware
