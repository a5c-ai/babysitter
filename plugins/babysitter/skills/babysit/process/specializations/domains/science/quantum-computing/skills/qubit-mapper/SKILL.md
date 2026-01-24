---
name: qubit-mapper
description: Qubit mapping and routing skill for adapting quantum circuits to hardware connectivity constraints
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
  category: hardware-integration
  domain: quantum-computing
  tools:
    - Qiskit transpiler
    - t|ket> routing
    - Cirq device mapping
  processes:
    - hardware-backend-configuration
    - circuit-compilation-optimization
    - qubit-assignment-strategy
---

# Qubit Mapper Skill

## Purpose

Provides qubit mapping and routing capabilities for adapting logical quantum circuits to physical device connectivity constraints while minimizing added SWAP gates.

## Capabilities

- **Initial Mapping**: Find good initial qubit assignments
- **SWAP Routing**: Insert SWAPs for non-adjacent interactions
- **Lookahead Routing**: Anticipate future routing needs
- **Noise-Aware Mapping**: Consider qubit quality in mapping
- **Dynamic Remapping**: Adjust mapping during circuit
- **SWAP Network Optimization**: Minimize SWAP depth

## Usage Guidelines

1. **Device Analysis**
   - Load device coupling map
   - Analyze qubit connectivity
   - Identify high-quality qubits

2. **Initial Mapping**
   - Use trivial, dense, or noise-aware mapping
   - Consider circuit structure
   - Optimize for first layers

3. **Routing**
   - Apply SWAP insertion algorithm
   - Optimize SWAP network
   - Verify routing correctness

4. **Best Practices**
   - Profile different routing strategies
   - Consider noise in mapping decisions
   - Document mapping choices
   - Compare before/after depth
