---
name: power-analysis
description: FPGA power estimation and optimization skill for low-power design
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Power Analysis Skill

## Overview

Expert skill for FPGA power estimation and optimization, enabling low-power design through analysis and targeted optimization techniques.

## Capabilities

- Run power estimation tools (Vivado Power Estimator)
- Analyze static and dynamic power
- Identify high-power consumption areas
- Apply clock gating and enable strategies
- Optimize switching activity
- Configure power domains
- Estimate power from simulation activity
- Generate power reports

## Target Processes

- power-analysis-optimization.js
- synthesis-optimization.js
- clock-network-design.js

## Usage Guidelines

### Power Components
- **Static Power**: Leakage, always present when powered
- **Dynamic Power**: Switching activity, proportional to frequency
- **I/O Power**: External interface drivers
- **Clock Network Power**: Distribution network switching

### Analysis Flow
1. Early estimation with Xilinx Power Estimator (XPE)
2. Post-synthesis power analysis
3. Simulation-based activity annotation (SAIF)
4. Post-implementation power analysis
5. Hardware measurement validation

### Optimization Techniques
- **Clock Gating**: Disable clocks to unused logic
- **Enable Gating**: Use clock enables vs. clock gating
- **Voltage Scaling**: Use lower voltage when possible
- **Frequency Scaling**: Reduce clock where margin exists
- **Logic Optimization**: Minimize switching activity

### Clock Enable Strategy
```verilog
always_ff @(posedge clk)
  if (enable)
    data_reg <= data_in;
```

### Activity Reduction
- Avoid unnecessary toggling
- Initialize registers to reduce X propagation
- Use Gray coding for counters
- Gate outputs of unused modules

### Thermal Considerations
- Identify thermal hotspots
- Plan for cooling requirements
- Consider ambient temperature range
- Design thermal margin

## Dependencies

- Power analysis tool integration
- Thermal analysis awareness
- Activity file generation (SAIF/VCD)
