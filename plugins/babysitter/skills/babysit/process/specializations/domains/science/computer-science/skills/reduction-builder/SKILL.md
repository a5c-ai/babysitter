---
name: reduction-builder
description: Construct and verify polynomial-time reductions between computational problems for complexity proofs
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
  category: complexity-theory
  domain: computer-science
  tools:
    - Graph visualization
    - Formal verification
    - Gadget libraries
  processes:
    - np-completeness-proof
    - computational-problem-classification
    - complexity-lower-bound-proof
---

# Reduction Builder Skill

## Purpose

Provides polynomial-time reduction construction capabilities for proving computational complexity relationships between problems.

## Capabilities

- **Gadget Library**: Access gadgets for common reductions (3-SAT, Vertex Cover, etc.)
- **Correctness Verification**: Verify reduction correctness in both directions
- **Polynomial Verification**: Confirm polynomial-time computability
- **Visualization**: Visualize gadget constructions graphically
- **Documentation**: Generate reduction documentation and proofs

## Usage Guidelines

1. **Reduction Design**
   - Identify source and target problems
   - Design instance transformation
   - Select appropriate gadgets

2. **Correctness Proof**
   - Prove yes-instances map to yes-instances
   - Prove no-instances map to no-instances
   - Verify bijection when needed

3. **Complexity Verification**
   - Verify polynomial-time transformation
   - Count output size vs. input size
   - Analyze construction complexity

4. **Best Practices**
   - Document gadget constructions clearly
   - Visualize reductions when possible
   - Verify both directions of reduction
   - Build on known reductions
