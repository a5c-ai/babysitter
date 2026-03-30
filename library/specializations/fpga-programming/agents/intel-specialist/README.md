# Intel/Altera Specialist Agent

## Overview

The Intel/Altera Specialist is an expert agent focused on the Intel FPGA ecosystem. It provides deep guidance on Quartus Prime, Platform Designer (Qsys), Intel IP catalog, and device-specific optimizations for all Intel FPGA families.

## Key Capabilities

- **Quartus Prime Mastery**: Analysis, synthesis, fitting, timing analysis
- **Platform Designer**: System integration, Avalon interfaces, IP
- **Intel IP Catalog**: PLLs, memory controllers, transceivers
- **Device Expertise**: Cyclone, Stratix, Agilex families
- **Performance Optimization**: Timing closure, HyperFlex, physical synthesis

## When to Use This Agent

Use the Intel/Altera Specialist when:
- Targeting Intel/Altera FPGA devices
- Optimizing Quartus synthesis or fitting
- Configuring Intel IP cores
- Debugging timing closure issues
- Creating Platform Designer systems
- Working with Nios II/V processors

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | Intel/Altera Applications Engineer |
| **Primary Focus** | Device-specific optimization |
| **Tool Expertise** | Quartus Prime, Platform Designer |
| **Device Coverage** | All Intel FPGAs (Cyclone, Stratix, Agilex) |

## Expertise Domains

### 1. Quartus Prime

Tool mastery includes:
- Project management and compilation
- Analysis & Synthesis settings
- Fitter effort and strategies
- Timing Analyzer constraints
- Logic Lock regions
- Incremental compilation

### 2. Platform Designer

System integration expertise:
- Component instantiation
- Avalon-MM/ST interfaces
- Clock domain bridging
- Address decoding
- Interrupt handling

### 3. Intel IP Catalog

Configuration knowledge:
- IOPLL and fPLL
- EMIF memory controllers
- Transceiver Native PHY
- Hard PCIe IP
- Nios processors

### 4. Device Architecture

Family-specific optimization:
- ALM structure
- DSP blocks (variable precision)
- M20K and MLAB memory
- HyperFlex (Stratix 10+)
- I/O standards

## Usage Example

### Invoking the Agent

```javascript
// In a babysitter process
const guidance = await ctx.task(intelConsultTask, {
  question: "How can I optimize my Stratix 10 design for timing?",
  targetDevice: "1SG280HU2F50E2VG",
  quartusVersion: "23.4",
  quartusEdition: "pro",
  designType: "rtl",
  currentIssue: "Failing setup by 0.3ns on critical paths"
});
```

### Sample Output

```json
{
  "recommendation": "For Stratix 10 timing optimization, leverage HyperFlex architecture...",
  "tclCommands": [
    "set_global_assignment -name OPTIMIZATION_MODE \"AGGRESSIVE PERFORMANCE\"",
    "set_global_assignment -name ALLOW_REGISTER_RETIMING ON",
    "set_global_assignment -name PHYSICAL_SYNTHESIS_REGISTER_RETIMING ON",
    "set_global_assignment -name HYPER_RETIMER ON"
  ],
  "sdcConstraints": [
    "# Ensure clock is properly constrained",
    "create_clock -name sys_clk -period 10.0 [get_ports clk]"
  ],
  "warnings": [
    "HyperFlex retiming may require RTL style changes",
    "Check Hyper-Retimer reports for optimization opportunities"
  ]
}
```

## Common Consultation Topics

### Timing Closure

```tcl
# Analyze critical paths
report_timing -setup -npaths 50 -detail full_path

# Enable physical synthesis
set_global_assignment -name PHYSICAL_SYNTHESIS_COMBO_LOGIC ON
set_global_assignment -name PHYSICAL_SYNTHESIS_REGISTER_RETIMING ON
set_global_assignment -name PHYSICAL_SYNTHESIS_REGISTER_DUPLICATION ON

# For Stratix 10+, enable Hyper-Retiming
set_global_assignment -name ALLOW_REGISTER_RETIMING ON
```

### Synthesis Optimization

```tcl
# High-performance settings
set_global_assignment -name OPTIMIZATION_MODE "AGGRESSIVE PERFORMANCE"
set_global_assignment -name FITTER_EFFORT "STANDARD FIT"
set_global_assignment -name AUTO_RAM_RECOGNITION ON
set_global_assignment -name AUTO_DSP_RECOGNITION ON
```

### Platform Designer System

```tcl
# Create system
create_system my_system

# Add clock
add_instance clk_0 altera_clock_bridge

# Add processor
add_instance cpu nios2_qsys
set_instance_parameter_value cpu icache_size 4096
set_instance_parameter_value cpu dcache_size 4096

# Connect
add_connection clk_0.out_clk cpu.clk
add_connection cpu.data_master ram.s1

# Generate
save_system
generate_system
```

### SDC Constraints

```tcl
# Primary clock
create_clock -name sys_clk -period 10.0 [get_ports clk]

# PLL generated clocks (auto-derived by Quartus)
derive_pll_clocks

# I/O timing
set_input_delay -clock sys_clk -max 2.5 [get_ports data_in[*]]
set_output_delay -clock sys_clk -max 2.5 [get_ports data_out[*]]

# Async groups
set_clock_groups -asynchronous -group {sys_clk} -group {pcie_clk}
```

## Device-Specific Guidance

### Cyclone V/10

| Resource | Notes |
|----------|-------|
| Logic | Adaptive Logic Modules (ALMs) |
| DSP | Variable precision blocks |
| Memory | M10K blocks, MLAB |
| Clocking | Fractional PLLs |

### Stratix 10

| Resource | Notes |
|----------|-------|
| Logic | HyperFlex ALMs |
| DSP | Variable precision + hard FP |
| Memory | M20K, MLAB |
| Clocking | fPLL, IOPLL |

### Agilex 7

| Resource | Notes |
|----------|-------|
| Logic | Enhanced HyperFlex |
| DSP | AI-optimized blocks |
| Memory | M20K, MLAB, HBM2e |
| Clocking | Advanced PLLs |

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| synthesis-optimization.js | Quartus synthesis guidance |
| timing-closure.js | Timing Analyzer usage |
| place-and-route.js | Fitter strategies |
| ip-core-integration.js | Intel IP configuration |
| hls-development.js | Intel HLS optimization |
| fpga-on-chip-debugging.js | Signal Tap insertion |

## MCP Server Integration

This agent can leverage:

| Server | Purpose |
|--------|---------|
| fpga-mcp-servers | Quartus build automation |
| Quartus MCP | Async synthesis/fitting |
| DE10-Nano MCP | Board deployment |

## Best Practices

### Before Consulting

- Know your target device part number
- Have Quartus version and edition info
- Identify specific issue or question
- Gather relevant timing reports

### During Consultation

- Provide design context
- Share error messages
- Specify constraints applied
- Mention known limitations

### After Consulting

- Validate in Quartus
- Check timing reports
- Test on hardware
- Document results

## Limitations

- Recommendations may be version-specific
- Some features require Pro Edition
- Device availability varies
- Performance estimates are approximate

## References

- [Intel Quartus Prime Handbook](https://www.intel.com/content/www/us/en/docs/programmable/683432/)
- [Timing Analyzer Cookbook](https://www.intel.com/content/www/us/en/docs/programmable/683068/)
- [Platform Designer User Guide](https://www.intel.com/content/www/us/en/docs/programmable/683609/)
- [Intel FPGA Technical Training](https://www.intel.com/content/www/us/en/programmable/support/training.html)

## Related Resources

- [AGENT.md](./AGENT.md) - Full agent definition
- [Xilinx/AMD Specialist](../xilinx-specialist/) - Alternative vendor
- [FPGA Architect](../fpga-architect/) - System-level design
