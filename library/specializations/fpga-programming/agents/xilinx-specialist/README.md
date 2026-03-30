# Xilinx/AMD Specialist Agent

## Overview

The Xilinx/AMD Specialist is an expert agent focused on the Xilinx/AMD FPGA ecosystem. It provides deep guidance on Vivado Design Suite, Vitis platform, IP catalog, and device-specific optimizations for all Xilinx/AMD FPGA families.

## Key Capabilities

- **Vivado Mastery**: Synthesis, implementation, timing closure, debugging
- **Vitis Development**: HLS kernels, host applications, acceleration
- **IP Integration**: Catalog navigation, configuration, custom IP packaging
- **Device Expertise**: 7-Series, UltraScale+, Versal, Zynq MPSoC
- **Performance Optimization**: Timing closure, resource utilization, power

## When to Use This Agent

Use the Xilinx/AMD Specialist when:
- Targeting Xilinx/AMD FPGA or SoC devices
- Optimizing Vivado synthesis or implementation
- Configuring Xilinx IP cores
- Debugging timing closure issues
- Developing Vitis acceleration applications
- Integrating PS/PL on Zynq platforms

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | Xilinx/AMD Applications Engineer |
| **Primary Focus** | Device-specific optimization |
| **Tool Expertise** | Vivado, Vitis, Vitis HLS |
| **Device Coverage** | All Xilinx/AMD FPGAs and SoCs |

## Expertise Domains

### 1. Vivado Design Suite

Tool mastery includes:
- Project management and source control
- Synthesis strategies and directives
- Implementation flows and optimization
- Timing analysis and constraint debug
- Physical constraints (Pblocks, LOC)
- Incremental compile workflows

### 2. Vitis Platform

Development expertise:
- C/C++ kernel development
- HLS pragma optimization
- Host application programming
- Hardware emulation
- Performance profiling

### 3. IP Catalog

Configuration knowledge:
- Clock generators (MMCM, PLL)
- AXI infrastructure
- Memory controllers
- High-speed transceivers
- Embedded processors

### 4. Device Architecture

Family-specific optimization:
- CLB/LUT structure
- DSP48 inference patterns
- Block RAM and UltraRAM
- Clocking resources
- I/O standards and banking

## Usage Example

### Invoking the Agent

```javascript
// In a babysitter process
const guidance = await ctx.task(xilinxConsultTask, {
  question: "How can I improve timing closure on my UltraScale+ design?",
  targetDevice: "xcvu9p-flga2104-2L-e",
  vivadoVersion: "2024.1",
  designType: "rtl",
  currentIssue: "Multiple paths failing setup by 0.2-0.5ns"
});
```

### Sample Output

```json
{
  "recommendation": "For setup violations in the 0.2-0.5ns range on UltraScale+, apply these strategies...",
  "tclCommands": [
    "set_property strategy Performance_ExploreWithRemap [get_runs impl_1]",
    "set_property STEPS.PHYS_OPT_DESIGN.IS_ENABLED true [get_runs impl_1]",
    "set_property STEPS.PHYS_OPT_DESIGN.ARGS.DIRECTIVE AggressiveExplore [get_runs impl_1]",
    "set_property STEPS.POST_ROUTE_PHYS_OPT_DESIGN.IS_ENABLED true [get_runs impl_1]"
  ],
  "constraints": [
    "# Consider adding pipeline registers on critical paths",
    "# set_property MAX_FANOUT 50 [get_nets high_fanout_net]"
  ],
  "warnings": [
    "AggressiveExplore may increase runtime significantly",
    "Consider floorplanning if paths cross SLR boundaries"
  ]
}
```

## Common Consultation Topics

### Timing Closure

```tcl
# Analyze worst paths
report_timing -from [all_registers] -to [all_registers] \
  -max_paths 100 -slack_lesser_than 0

# Enable post-route optimization
set_property STEPS.POST_ROUTE_PHYS_OPT_DESIGN.IS_ENABLED true [get_runs impl_1]
set_property STEPS.POST_ROUTE_PHYS_OPT_DESIGN.ARGS.DIRECTIVE AggressiveExplore [get_runs impl_1]
```

### Synthesis Optimization

```tcl
# High-performance synthesis
set_property strategy Flow_PerfOptimized_high [get_runs synth_1]
set_property STEPS.SYNTH_DESIGN.ARGS.RETIMING true [get_runs synth_1]
set_property STEPS.SYNTH_DESIGN.ARGS.FLATTEN_HIERARCHY rebuilt [get_runs synth_1]
```

### IP Configuration

```tcl
# Create and configure MIG DDR4
create_ip -name ddr4 -vendor xilinx.com -library ip -version 2.2 -module_name ddr4_0
set_property -dict [list \
  CONFIG.C0.DDR4_TimePeriod {833} \
  CONFIG.C0.DDR4_InputClockPeriod {4000} \
  CONFIG.C0.DDR4_MemoryPart {MT40A256M16GE-083E} \
] [get_ips ddr4_0]
```

### Debug Core Insertion

```tcl
# Create ILA for debugging
create_debug_core u_ila_0 ila
set_property ALL_PROBE_SAME_MU true [get_debug_cores u_ila_0]
set_property ALL_PROBE_SAME_MU_CNT 2 [get_debug_cores u_ila_0]
set_property C_DATA_DEPTH 1024 [get_debug_cores u_ila_0]

# Connect probes
connect_debug_port u_ila_0/probe0 [get_nets {data_bus[*]}]
connect_debug_port u_ila_0/probe1 [get_nets {state[*]}]
```

## Device-Specific Guidance

### 7-Series

| Resource | Notes |
|----------|-------|
| LUTs | 6-input, dual 5-input outputs |
| DSP | DSP48E1, 25x18 multiply |
| BRAM | 36Kb blocks, 72-bit wide |
| Clocking | MMCM, PLL, BUFG |

### UltraScale+

| Resource | Notes |
|----------|-------|
| LUTs | Improved architecture |
| DSP | DSP48E2, 27x18 multiply |
| BRAM | Plus UltraRAM 288Kb |
| Clocking | BUFGCE, BUFGCTRL |

### Zynq MPSoC

| Resource | Notes |
|----------|-------|
| PS | Cortex-A53, R5 cores |
| PL | UltraScale+ fabric |
| Interface | AXI-HP, AXI-HPC |
| Boot | FSBL, PMU, ATF |

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| synthesis-optimization.js | Vivado synthesis guidance |
| timing-closure.js | Timing analysis and debug |
| place-and-route.js | Implementation strategies |
| ip-core-integration.js | IP catalog configuration |
| hls-development.js | Vitis HLS optimization |
| fpga-on-chip-debugging.js | ILA/VIO insertion |

## Best Practices

### Before Consulting

- Know your target device (part number)
- Have Vivado version information
- Identify specific bottleneck or question
- Gather relevant reports

### During Consultation

- Provide context (design size, frequency target)
- Share error messages or timing reports
- Specify constraints already applied
- Mention any device limitations known

### After Consulting

- Validate recommendations in tool
- Test on actual hardware when possible
- Document successful strategies
- Share results for future reference

## Limitations

- Recommendations specific to tool version may not apply to older versions
- Some features require specific licenses
- Performance estimates are approximations
- Device availability may vary

## References

- [Vivado Design Suite User Guide](https://docs.xilinx.com/v/u/en-US/ug892-vivado-design-flows-overview)
- [UltraFast Design Methodology (UG949)](https://docs.xilinx.com/r/en-US/ug949-vivado-design-methodology)
- [Xilinx IP Documentation](https://docs.xilinx.com/v/u/en-US/pg065-clk-wiz)
- [Vitis Application Development](https://docs.xilinx.com/r/en-US/ug1393-vitis-application-acceleration)

## Related Resources

- [AGENT.md](./AGENT.md) - Full agent definition
- [Intel/Altera Specialist](../intel-specialist/) - Alternative vendor
- [FPGA Architect](../fpga-architect/) - System-level design
