---
name: axi-protocol
description: Expert skill for AMBA AXI protocol implementation and verification in FPGA designs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# AXI Protocol Skill

## Overview

Expert skill for AMBA AXI protocol implementation and verification, enabling high-performance interconnect design for FPGA systems.

## Capabilities

- Implement AXI4, AXI4-Lite, and AXI4-Stream interfaces
- Design AXI masters, slaves, and interconnects
- Handle burst transactions (INCR, WRAP, FIXED)
- Implement proper valid/ready handshaking
- Design AXI address decoding and routing
- Create AXI VIP-based verification
- Optimize AXI performance and throughput
- Generate AXI protocol checkers

## Target Processes

- axi-interface-design.js
- ip-core-integration.js
- memory-interface-design.js
- hls-development.js

## Usage Guidelines

### AXI4 Full Features
- Write address channel (AW), Write data channel (W), Write response (B)
- Read address channel (AR), Read data channel (R)
- Burst types: FIXED, INCR, WRAP
- Burst lengths up to 256 beats
- Out-of-order transaction completion

### AXI4-Lite Subset
- Single-beat transactions only
- No burst support
- Simplified for control/status registers
- 32-bit or 64-bit data width

### AXI4-Stream
- Continuous data streaming
- TVALID/TREADY handshake
- TLAST for packet boundaries
- TKEEP/TSTRB for byte enables

### Handshake Rules
- Source must not wait for READY before asserting VALID
- Once VALID asserted, must remain until READY
- Transfer occurs on clock edge when both VALID and READY high
- Deadlock prevention through proper protocol compliance

### Performance Optimization
- Pipeline channels for frequency
- Use write interleaving when supported
- Implement outstanding transaction support
- Size data width for bandwidth requirements

## Dependencies

- ARM AMBA AXI specification knowledge
- Protocol checker integration
- VIP awareness for verification
