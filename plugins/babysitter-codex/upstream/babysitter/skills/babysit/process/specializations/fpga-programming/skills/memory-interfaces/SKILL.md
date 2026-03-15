---
name: memory-interfaces
description: Expert skill for on-chip and external memory interface design in FPGAs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Memory Interfaces Skill

## Overview

Expert skill for on-chip and external memory interface design, enabling efficient memory utilization and high-bandwidth data access in FPGA systems.

## Capabilities

- Infer Block RAM correctly (read-first, write-first)
- Design distributed RAM and LUT RAM
- Configure ECC for memory protection
- Implement memory access controllers
- Interface with DDR memory controllers
- Optimize memory bandwidth utilization
- Design memory arbitration logic
- Handle memory initialization

## Target Processes

- memory-interface-design.js
- ip-core-integration.js
- hardware-software-codesign.js

## Usage Guidelines

### Block RAM Inference
- Use synchronous read/write patterns
- Specify read-first or write-first mode
- Apply ram_style attribute when needed
- Consider true dual-port vs simple dual-port
- Initialize with $readmemh for COE files

### Distributed RAM
- Use for small, shallow memories
- Asynchronous read capability
- Lower latency than Block RAM
- Use for FIFOs, small lookup tables
- Apply ram_style="distributed" attribute

### ECC Implementation
- Enable for reliability-critical data
- Understand SECDED capabilities
- Handle ECC error reporting
- Consider performance impact
- Implement error injection for testing

### DDR Interface
- Use vendor memory controller IP
- Configure timing parameters correctly
- Implement user interface logic
- Handle calibration and initialization
- Design for memory bandwidth requirements

### Memory Arbitration
- Round-robin for fairness
- Priority-based for critical paths
- Implement request queuing
- Handle backpressure properly
- Consider burst efficiency

## Dependencies

- Memory controller IP knowledge
- FPGA memory architecture understanding
- DDR specification awareness
