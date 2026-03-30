---
name: ip-core-management
description: Vendor IP core configuration and integration expertise for FPGA designs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# IP Core Management Skill

## Overview

Expert skill for vendor IP core configuration and integration, enabling efficient use of pre-built intellectual property in FPGA designs.

## Capabilities

- Configure Xilinx/AMD IP cores
- Configure Intel/Altera IP cores
- Generate IP output products
- Connect IP interfaces correctly
- Handle IP versioning and updates
- Configure IP parameters via TCL
- Integrate third-party IP cores
- Document IP configurations

## Target Processes

- ip-core-integration.js
- clock-network-design.js
- memory-interface-design.js
- axi-interface-design.js

## Usage Guidelines

### Xilinx IP Configuration
- Use IP Integrator for block design
- Configure via GUI or TCL scripts
- Generate output products before synthesis
- Lock IP versions for reproducibility
- Use IP upgrade advisor for version changes

### Intel IP Configuration
- Use Platform Designer (Qsys)
- Configure system interconnect
- Generate HDL and synthesis files
- Handle parameterization correctly
- Use IP upgrade reports

### Common IP Categories
- **Clock Management**: MMCM, PLL configurations
- **Memory Controllers**: DDR, HBM, QDR
- **Interconnect**: AXI Interconnect, SmartConnect
- **Processing**: MicroBlaze, Nios II
- **Communication**: Ethernet, PCIe, UART

### TCL Scripting
```tcl
create_ip -name clk_wiz -vendor xilinx.com -library ip -version 6.0 -module_name clk_wiz_0
set_property CONFIG.CLKOUT1_REQUESTED_OUT_FREQ 200 [get_ips clk_wiz_0]
generate_target all [get_ips clk_wiz_0]
```

### Integration Best Practices
- Create wrapper modules for IP
- Document configuration choices
- Version control IP TCL scripts
- Test IP in isolation before integration
- Plan for IP core updates

## Dependencies

- Vendor IP catalog access
- Vendor tool CLI knowledge
- IP licensing understanding
