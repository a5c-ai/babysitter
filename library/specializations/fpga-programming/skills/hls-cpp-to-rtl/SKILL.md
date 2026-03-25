---
name: hls-cpp-to-rtl
description: Expert skill for C/C++ to RTL conversion using High-Level Synthesis tools
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# HLS C/C++ to RTL Skill

## Overview

Expert skill for High-Level Synthesis (HLS) development, converting C/C++ algorithms to optimized RTL implementations for FPGA acceleration.

## Capabilities

- Write HLS-synthesizable C/C++ code
- Apply Vitis HLS pragmas (PIPELINE, UNROLL, ARRAY_PARTITION)
- Optimize loop initiation interval (II)
- Configure HLS interface synthesis (AXI-MM, AXI-Stream, AXI-Lite)
- Analyze HLS reports and iterate on design
- Apply dataflow optimization
- Handle fixed-point arithmetic (ap_fixed, ap_int)
- Integrate HLS IP into Vivado block designs

## Target Processes

- hls-development.js
- hardware-software-codesign.js
- ip-core-integration.js

## Usage Guidelines

### Code Structure
- Use static arrays for memory inference
- Avoid dynamic memory allocation
- Structure loops for pipeline optimization
- Use ap_int/ap_uint for arbitrary precision

### Key Pragmas
- `#pragma HLS PIPELINE II=1` - Pipeline loops for throughput
- `#pragma HLS UNROLL factor=N` - Unroll loops for parallelism
- `#pragma HLS ARRAY_PARTITION` - Memory partitioning
- `#pragma HLS DATAFLOW` - Task-level parallelism
- `#pragma HLS INTERFACE` - Port protocol specification

### Interface Synthesis
- **AXI4-Lite**: Control registers and scalar arguments
- **AXI4 Memory-Mapped**: Large data arrays
- **AXI4-Stream**: Streaming data interfaces
- **ap_none/ap_vld/ap_hs**: Simple handshake protocols

### Optimization Flow
1. Baseline functional implementation
2. Analyze synthesis report
3. Identify bottleneck (II, latency, resources)
4. Apply targeted optimizations
5. Iterate until QoR targets met

## Dependencies

- Vitis HLS CLI awareness
- C/C++ language expertise
- FPGA resource understanding
