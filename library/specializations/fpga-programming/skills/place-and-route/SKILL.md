---
name: place-and-route
description: Expert skill for FPGA place and route optimization and physical implementation
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Place and Route Skill

## Overview

Expert skill for FPGA place and route optimization, achieving timing closure and optimal resource utilization through physical implementation strategies.

## Capabilities

- Create floorplans for large designs
- Define Pblocks and placement constraints
- Analyze and resolve routing congestion
- Apply physical optimization directives
- Use incremental implementation flows
- Optimize for timing closure
- Analyze and fix timing violations
- Generate utilization and timing reports

## Target Processes

- place-and-route.js
- timing-closure.js
- clock-network-design.js

## Usage Guidelines

### Floorplanning Strategy
- Identify major functional blocks
- Allocate resources by region
- Consider data flow and connectivity
- Plan for clock distribution
- Reserve space for debug logic

### Pblock Constraints
- Define rectangular regions
- Assign hierarchical modules
- Set resource limits per Pblock
- Consider I/O proximity
- Allow flexibility for routing

### Congestion Resolution
- Identify congested regions in reports
- Apply SpreadLogic directives
- Adjust Pblock boundaries
- Consider logic restructuring
- Use alternate routing architectures

### Physical Optimization
- Enable post-place optimization
- Apply post-route physical optimization
- Use retiming when beneficial
- Consider register replication
- Balance pipeline stages

### Incremental Flows
- Lock placed/routed cells
- Use reference checkpoints
- Minimize ECO iterations
- Preserve timing-critical paths
- Update only changed logic

## Dependencies

- P&R tool awareness (Vivado, Quartus)
- FPGA architecture knowledge
- Physical constraint syntax
