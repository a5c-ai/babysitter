---
name: fpga-debugging
description: On-chip debugging skill with ILA, VIO, and related FPGA debug tools
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# FPGA Debugging Skill

## Overview

Expert skill for on-chip debugging using Integrated Logic Analyzer (ILA), Virtual I/O (VIO), and related debug infrastructure for FPGA designs.

## Capabilities

- Insert Integrated Logic Analyzer (ILA) probes
- Configure trigger conditions and capture depth
- Design Virtual I/O (VIO) debug interfaces
- Analyze captured waveforms
- Use ChipScope/SignalTap for debugging
- Debug timing and functional issues in hardware
- Remove debug logic for production builds
- Configure JTAG and debug hub

## Target Processes

- fpga-on-chip-debugging.js
- functional-simulation.js
- design-for-testability.js

## Usage Guidelines

### ILA Insertion
- Identify critical signals to probe
- Consider capture depth vs. resource usage
- Group related signals in single ILA
- Use mark_debug attribute for HDL signals
- Configure appropriate data and trigger widths

### Trigger Configuration
- Use basic triggers for simple conditions
- Apply advanced triggers for complex patterns
- Combine triggers with AND/OR logic
- Configure trigger position in capture window
- Use storage qualification for efficient capture

### VIO Usage
- Create debug control interfaces
- Inject test patterns dynamically
- Override internal signals
- Monitor status in real-time
- Useful for bring-up and characterization

### Debug Infrastructure
- Connect debug hub to JTAG
- Configure clock domain for debug logic
- Plan for multiple ILA instances
- Consider debug access port routing
- Document debug signal mapping

### Production Considerations
- Use ifdef guards for debug logic
- Create debug and release build flows
- Minimize debug impact on timing
- Remove debug before final release
- Maintain debug build configurations

## Dependencies

- Debug tool CLI (hw_server, etc.)
- JTAG connectivity
- Vendor debug IP knowledge
