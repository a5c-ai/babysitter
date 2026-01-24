---
name: circuit-optimizer
description: Quantum circuit optimization skill for gate reduction, depth minimization, and hardware-aware compilation
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
    - Qiskit transpiler
    - t|ket>
    - PyZX
  processes:
    - quantum-circuit-design-and-optimization
    - hardware-backend-configuration
    - error-mitigation-strategy-implementation
---

# Circuit Optimizer Skill

## Purpose

Provides quantum circuit optimization capabilities for reducing gate counts, minimizing circuit depth, and adapting circuits to hardware constraints.

## Capabilities

- **Depth Reduction**: Minimize circuit depth through gate reordering
- **Gate Cancellation**: Identify and remove redundant gates
- **Peephole Optimization**: Apply local optimization patterns
- **Template Matching**: Find and apply optimization templates
- **Commutation Analysis**: Exploit gate commutativity
- **Topology Routing**: Route circuits for hardware connectivity

## Usage Guidelines

1. **Analysis**
   - Profile original circuit metrics
   - Identify optimization opportunities
   - Set optimization targets

2. **Optimization Passes**
   - Apply gate cancellation
   - Perform commutation-based reordering
   - Use template matching for patterns

3. **Hardware Adaptation**
   - Route for device topology
   - Decompose to native gates
   - Insert SWAP gates as needed

4. **Best Practices**
   - Compare before/after metrics
   - Verify circuit equivalence
   - Balance depth vs. gate count
   - Document optimization choices
