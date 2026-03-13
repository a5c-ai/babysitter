---
name: uvm-methodology
description: Deep expertise in Universal Verification Methodology (IEEE 1800.2) for FPGA verification
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# UVM Methodology Skill

## Overview

Expert skill for Universal Verification Methodology (UVM) development following IEEE 1800.2 standards for comprehensive FPGA verification.

## Capabilities

- Generate UVM agent architecture (driver, monitor, sequencer)
- Create UVM environments and scoreboards
- Implement uvm_sequence and virtual sequences
- Configure UVM factory and config_db
- Implement functional coverage with covergroups
- Design UVM register models (RAL)
- Apply UVM phasing and objections correctly
- Debug UVM testbenches effectively

## Target Processes

- uvm-testbench.js
- constrained-random-verification.js
- testbench-development.js

## Usage Guidelines

### Agent Architecture
- **Driver**: Converts sequence items to pin-level activity
- **Monitor**: Observes DUT interface and creates transactions
- **Sequencer**: Routes sequence items to driver
- **Agent**: Contains driver, monitor, sequencer; configurable active/passive

### Environment Structure
- Top-level environment contains agents and scoreboard
- Scoreboard performs reference model comparison
- Config objects distribute configuration
- Virtual sequencer coordinates multiple agents

### Sequence Development
- Extend from uvm_sequence#(item_type)
- Use `start_item()` / `finish_item()` paradigm
- Create layered sequences for complex scenarios
- Use virtual sequences for multi-agent coordination

### Coverage Strategy
- Embed covergroups in monitors
- Sample on transaction completion
- Cross functional coverage points
- Track coverage closure progress

### Best Practices
- Use factory for all component creation
- Configure via config_db, not constructors
- Raise/drop objections properly
- Use UVM reporting macros consistently

## Dependencies

- UVM 1.2 or UVM IEEE 1800.2 library
- SystemVerilog expertise
- Verification methodology knowledge
