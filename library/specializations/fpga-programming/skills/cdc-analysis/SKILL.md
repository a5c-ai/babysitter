---
name: cdc-analysis
description: Specialized skill for clock domain crossing analysis and synchronizer design in FPGA designs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# CDC Analysis Skill

## Overview

Expert skill for Clock Domain Crossing (CDC) analysis and synchronizer design, ensuring metastability-safe multi-clock FPGA designs.

## Capabilities

- Identify all clock domain crossings in RTL
- Design 2FF and 3FF synchronizers with ASYNC_REG
- Implement Gray code counters for async FIFOs
- Design handshake protocols (req-ack, valid-ready)
- Calculate MTBF for synchronizers
- Generate CDC constraints (set_false_path, set_max_delay)
- Detect CDC violations (reconvergence, data stability)
- Support Xilinx CDC-aware design flows

## Target Processes

- cdc-design.js
- reset-strategy.js
- clock-network-design.js
- timing-constraints.js

## Usage Guidelines

### Synchronizer Types
- **2FF Synchronizer**: Standard single-bit synchronization (MTBF > 100 years typical)
- **3FF Synchronizer**: High-reliability applications
- **Pulse Synchronizer**: Edge detection across domains
- **Handshake Synchronizer**: Multi-bit data with control signals

### FIFO Design
- Use Gray code for pointer crossing
- Ensure proper empty/full flag generation
- Consider almost-empty/almost-full for flow control
- Apply correct FIFO depth calculation

### Constraint Guidelines
- `set_false_path` for 2FF synchronizer paths
- `set_max_delay` for data bus with valid synchronization
- `set_clock_groups` for asynchronous clocks
- Apply ASYNC_REG attribute to synchronizer flip-flops

### CDC Violations to Detect
- Combinational logic between synchronizer stages
- Fan-out from unsynchronized signals
- Reconvergence of synchronized signals
- Data stability violations

## Dependencies

- CDC analysis tool integration
- Vendor-specific CDC rule knowledge
- Metastability theory understanding
