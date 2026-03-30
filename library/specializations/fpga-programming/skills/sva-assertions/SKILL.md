---
name: sva-assertions
description: Specialized skill for creating and debugging SystemVerilog assertions for FPGA verification
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# SVA Assertions Skill

## Overview

Expert skill for SystemVerilog Assertions (SVA) development, enabling formal property specification and verification for FPGA designs.

## Capabilities

- Write concurrent and immediate assertions
- Create property specifications and sequences
- Implement coverage properties (cover property)
- Create assume properties for formal verification
- Debug assertion failures with cause analysis
- Generate assertion bind files
- Optimize assertion performance
- Integrate assertions with formal tools

## Target Processes

- sva-development.js
- constrained-random-verification.js
- uvm-testbench.js
- verilog-systemverilog-design.js

## Usage Guidelines

### Assertion Types
- **Immediate Assertions**: Use for procedural checks within always blocks
- **Concurrent Assertions**: Use for temporal properties across clock cycles
- **Cover Properties**: Use for functional coverage collection
- **Assume Properties**: Use for formal verification constraints

### Best Practices
- Use `$rose`, `$fell`, `$stable` for edge detection
- Apply `disable iff` for reset handling
- Use `|->` for overlapping implication, `|=>` for non-overlapping
- Create reusable sequences for common patterns
- Add meaningful labels to all assertions

### Performance Optimization
- Limit sequence length for simulation efficiency
- Use local variables in sequences sparingly
- Group related assertions in bind files
- Consider assertion synthesis for emulation

## Dependencies

- SVA parser
- Formal verification tool awareness
- IEEE 1800-2017 SystemVerilog standard knowledge
