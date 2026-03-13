---
name: timing-constraints
description: Expert skill for developing and validating timing constraints. Writes SDC (Synopsys Design Constraints) and XDC files for FPGA timing closure.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob
---

# Timing Constraints Skill

Expert skill for FPGA timing constraint development following SDC (Synopsys Design Constraints) and Xilinx XDC standards. Provides deep expertise in clock definition, I/O timing, false paths, multicycle paths, and constraint validation.

## Overview

The Timing Constraints skill enables comprehensive timing constraint development for FPGA designs, supporting:
- Clock definition (create_clock, create_generated_clock)
- Input/output delay constraints
- False path identification and specification
- Multicycle path constraints with setup/hold
- Clock groups and relationships
- Constraint coverage validation
- Vendor-specific XDC extensions

## Capabilities

### 1. Primary Clock Definition

Define primary clocks entering the FPGA:

```tcl
# Primary clock on input pin
create_clock -name sys_clk -period 10.000 [get_ports clk_100mhz]

# Clock with duty cycle specification
create_clock -name sys_clk -period 10.000 -waveform {0 5} [get_ports clk_100mhz]

# Multiple primary clocks
create_clock -name clk_a -period 8.000 [get_ports clk_125mhz]
create_clock -name clk_b -period 6.667 [get_ports clk_150mhz]

# Clock on GT/transceiver reference
create_clock -name gt_refclk -period 6.400 [get_ports gt_refclk_p]

# Virtual clock (for I/O timing without physical pin)
create_clock -name virt_clk -period 10.000
```

### 2. Generated Clock Definition

Define clocks derived from primary clocks:

```tcl
# MMCM/PLL output clocks (auto-derived in Vivado)
create_generated_clock -name clk_200mhz \
  -source [get_pins mmcm_inst/CLKIN1] \
  -master_clock sys_clk \
  -divide_by 1 -multiply_by 2 \
  [get_pins mmcm_inst/CLKOUT0]

# Clock divider in logic
create_generated_clock -name clk_div2 \
  -source [get_pins clk_div_reg/C] \
  -divide_by 2 \
  [get_pins clk_div_reg/Q]

# Clock multiplexer output
create_generated_clock -name clk_mux_a \
  -source [get_pins clk_mux/I0] \
  -master_clock clk_a \
  -add \
  [get_pins clk_mux/O]

create_generated_clock -name clk_mux_b \
  -source [get_pins clk_mux/I1] \
  -master_clock clk_b \
  -add \
  [get_pins clk_mux/O]
```

### 3. Input Delay Constraints

Constrain timing for input signals:

```tcl
# System synchronous input (source synchronous)
# Data arrives after clock edge
set_input_delay -clock sys_clk -max 3.0 [get_ports data_in[*]]
set_input_delay -clock sys_clk -min 1.0 [get_ports data_in[*]]

# DDR input (double data rate)
set_input_delay -clock ddr_clk -max 2.5 [get_ports ddr_data[*]]
set_input_delay -clock ddr_clk -min 0.5 [get_ports ddr_data[*]]
set_input_delay -clock ddr_clk -max 2.5 [get_ports ddr_data[*]] -clock_fall -add_delay
set_input_delay -clock ddr_clk -min 0.5 [get_ports ddr_data[*]] -clock_fall -add_delay

# Input relative to virtual clock
set_input_delay -clock virt_clk -max 4.0 [get_ports async_data[*]]
set_input_delay -clock virt_clk -min 0.0 [get_ports async_data[*]]

# Source synchronous interface with forwarded clock
set_input_delay -clock rx_clk -max 2.0 [get_ports rx_data[*]]
set_input_delay -clock rx_clk -min 0.5 [get_ports rx_data[*]]
```

### 4. Output Delay Constraints

Constrain timing for output signals:

```tcl
# System synchronous output
# Downstream device setup time: 2ns, hold time: 0.5ns
# Board delay: 0.5ns
set_output_delay -clock sys_clk -max 2.5 [get_ports data_out[*]]
set_output_delay -clock sys_clk -min -0.5 [get_ports data_out[*]]

# DDR output
set_output_delay -clock ddr_clk -max 1.5 [get_ports ddr_out[*]]
set_output_delay -clock ddr_clk -min 0.0 [get_ports ddr_out[*]]
set_output_delay -clock ddr_clk -max 1.5 [get_ports ddr_out[*]] -clock_fall -add_delay
set_output_delay -clock ddr_clk -min 0.0 [get_ports ddr_out[*]] -clock_fall -add_delay

# Source synchronous output with generated clock
set_output_delay -clock tx_clk -max 1.0 [get_ports tx_data[*]]
set_output_delay -clock tx_clk -min -0.5 [get_ports tx_data[*]]
```

### 5. False Path Constraints

Identify and constrain paths that don't need timing analysis:

```tcl
# Asynchronous reset - no timing requirement
set_false_path -from [get_ports rst_n]

# Static configuration registers
set_false_path -from [get_cells config_reg[*]]

# Clock domain crossing (handled by synchronizers)
set_false_path -from [get_clocks clk_a] -to [get_clocks clk_b]
set_false_path -from [get_clocks clk_b] -to [get_clocks clk_a]

# Specific CDC path (more precise)
set_false_path -from [get_cells -hier -filter {NAME =~ *cdc_src_reg*}] \
               -to [get_cells -hier -filter {NAME =~ *cdc_dst_sync_reg[0]*}]

# Mutually exclusive clock mux paths
set_false_path -from [get_clocks clk_mux_a] -to [get_clocks clk_mux_b]
set_false_path -from [get_clocks clk_mux_b] -to [get_clocks clk_mux_a]

# Debug signals
set_false_path -to [get_ports debug_*]
```

### 6. Multicycle Path Constraints

Define paths that require multiple clock cycles:

```tcl
# 2-cycle path for slow operation
# Data is valid for 2 clock cycles
set_multicycle_path 2 -setup -from [get_cells slow_src_reg] -to [get_cells slow_dst_reg]
set_multicycle_path 1 -hold -from [get_cells slow_src_reg] -to [get_cells slow_dst_reg]

# Multicycle based on enable signal
# Data changes every 4 cycles when enable asserts
set_multicycle_path 4 -setup -from [get_cells data_reg[*]] -to [get_cells proc_reg[*]]
set_multicycle_path 3 -hold -from [get_cells data_reg[*]] -to [get_cells proc_reg[*]]

# Phase-shifted clock multicycle
# Source clock leads destination by 90 degrees
set_multicycle_path 1 -setup -start -from [get_clocks clk_0] -to [get_clocks clk_90]

# Multicycle for wide bus operations
set_multicycle_path 2 -setup -from [get_pins wide_reg[*]/C] -to [get_pins result_reg[*]/D]
set_multicycle_path 1 -hold -from [get_pins wide_reg[*]/C] -to [get_pins result_reg[*]/D]
```

### 7. Clock Groups

Define relationships between clocks:

```tcl
# Asynchronous clock groups - no timing between them
set_clock_groups -asynchronous \
  -group [get_clocks clk_100mhz] \
  -group [get_clocks clk_125mhz] \
  -group [get_clocks gt_refclk]

# Physically exclusive clocks (mux-selected)
set_clock_groups -physically_exclusive \
  -group [get_clocks clk_mux_a] \
  -group [get_clocks clk_mux_b]

# Logically exclusive clocks (runtime selected)
set_clock_groups -logically_exclusive \
  -group [get_clocks pll_config_a] \
  -group [get_clocks pll_config_b]
```

### 8. Max Delay for CDC

Constrain max delay for CDC paths (alternative to false path):

```tcl
# Max delay constraint for CDC synchronizer
# Ensures data is stable before next clock edge
set_max_delay -datapath_only -from [get_cells cdc_src_reg] \
              -to [get_cells cdc_sync_reg[0]] 5.0

# CDC FIFO gray code pointers
set_max_delay -datapath_only \
  -from [get_cells wr_ptr_gray_reg[*]] \
  -to [get_cells rd_ptr_sync_reg[0][*]] \
  [expr {$period_clk_wr * 0.8}]
```

### 9. Physical Constraints (XDC Extensions)

Xilinx-specific physical constraints:

```tcl
# I/O standard
set_property IOSTANDARD LVCMOS33 [get_ports gpio[*]]
set_property IOSTANDARD LVDS_25 [get_ports {lvds_p lvds_n}]

# Pin location
set_property PACKAGE_PIN H16 [get_ports clk_100mhz]
set_property PACKAGE_PIN R14 [get_ports rst_n]

# I/O drive strength
set_property DRIVE 8 [get_ports data_out[*]]
set_property SLEW FAST [get_ports high_speed_out]

# Input termination
set_property PULLUP TRUE [get_ports config_pin]
set_property IBUF_LOW_PWR FALSE [get_ports high_speed_in]

# Clock input buffer type
set_property CLOCK_DEDICATED_ROUTE BACKBONE [get_nets clk_100mhz_IBUF]
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `timing-constraints.js` | Primary constraint development |
| `timing-closure.js` | Constraint refinement for closure |
| `synthesis-optimization.js` | Constraint-aware synthesis |
| `cdc-design.js` | CDC constraint generation |

## Workflow

### 1. Clock Analysis

```markdown
## Clock Domain Analysis

| Clock | Frequency | Source | Domain |
|-------|-----------|--------|--------|
| sys_clk | 100 MHz | External | Primary |
| clk_200 | 200 MHz | MMCM | Processing |
| rx_clk | 125 MHz | PHY | RX path |
| tx_clk | 125 MHz | MMCM | TX path |

## Clock Relationships
- sys_clk -> clk_200: synchronous (MMCM)
- sys_clk <-> rx_clk: asynchronous
- tx_clk -> rx_clk: asynchronous
```

### 2. Generate Constraints

```bash
# Output files generated:
# - constraints/clocks.xdc       - Clock definitions
# - constraints/io_timing.xdc    - I/O delay constraints
# - constraints/cdc.xdc          - CDC constraints
# - constraints/exceptions.xdc   - False/multicycle paths
# - constraints/physical.xdc     - Pin assignments
```

### 3. Validate Constraints

```tcl
# In Vivado
report_clocks
report_clock_interaction
report_timing_summary -delay_type min_max
check_timing
report_methodology
```

## Output Schema

```json
{
  "constraints": {
    "clocks": {
      "primary": [
        { "name": "sys_clk", "period": 10.0, "port": "clk_100mhz" }
      ],
      "generated": [
        { "name": "clk_200", "source": "sys_clk", "multiply": 2, "divide": 1 }
      ]
    },
    "ioTiming": {
      "inputs": [
        { "port": "data_in[*]", "clock": "sys_clk", "maxDelay": 3.0, "minDelay": 1.0 }
      ],
      "outputs": [
        { "port": "data_out[*]", "clock": "sys_clk", "maxDelay": 2.5, "minDelay": -0.5 }
      ]
    },
    "exceptions": {
      "falsePaths": [
        { "from": "rst_n", "reason": "Asynchronous reset" }
      ],
      "multicyclePaths": [
        { "from": "slow_reg", "to": "proc_reg", "setup": 2, "hold": 1 }
      ]
    },
    "clockGroups": [
      { "type": "asynchronous", "clocks": ["sys_clk", "rx_clk"] }
    ]
  },
  "validation": {
    "allClocksConstrained": true,
    "allIOConstrained": true,
    "noUnconstrainedPaths": true,
    "cdcCovered": true
  },
  "artifacts": [
    "constraints/clocks.xdc",
    "constraints/io_timing.xdc",
    "constraints/cdc.xdc",
    "constraints/exceptions.xdc"
  ]
}
```

## Common Patterns

### Source Synchronous Interface

```tcl
# Source synchronous input (clock forwarded with data)
create_clock -name rx_clk -period 8.000 [get_ports rx_clk]
set_input_delay -clock rx_clk -max 2.5 [get_ports rx_data[*]]
set_input_delay -clock rx_clk -min 0.5 [get_ports rx_data[*]]

# Source synchronous output (FPGA generates clock)
create_generated_clock -name tx_clk \
  -source [get_pins mmcm/CLKOUT1] \
  [get_ports tx_clk]
set_output_delay -clock tx_clk -max 1.0 [get_ports tx_data[*]]
set_output_delay -clock tx_clk -min -0.5 [get_ports tx_data[*]]
```

### Asynchronous FIFO CDC

```tcl
# FIFO gray code pointer crossing
set_max_delay -datapath_only \
  -from [get_cells fifo_inst/wr_ptr_gray_reg[*]] \
  -to [get_cells fifo_inst/wr_ptr_sync_reg[0][*]] 8.0

set_max_delay -datapath_only \
  -from [get_cells fifo_inst/rd_ptr_gray_reg[*]] \
  -to [get_cells fifo_inst/rd_ptr_sync_reg[0][*]] 10.0
```

### Reset Synchronizer

```tcl
# Async reset input
set_false_path -from [get_ports rst_n]

# Reset synchronizer - allow 2 clock cycles
set_max_delay -from [get_cells rst_sync_reg[0]] \
              -to [get_cells rst_sync_reg[1]] \
              [get_property PERIOD [get_clocks sys_clk]]
```

## Best Practices

### Clock Constraints
- Always define all clock sources explicitly
- Use meaningful clock names
- Document clock relationships
- Verify with `report_clocks`

### I/O Constraints
- Calculate delays from datasheets
- Include board-level delays
- Use virtual clocks for async interfaces
- Document delay budget

### CDC Handling
- Prefer `set_max_delay -datapath_only` over `set_false_path`
- Ensure synchronizer ASYNC_REG attributes are set
- Use `report_cdc` to verify coverage
- Document all CDC paths

### Validation
- Run `check_timing` before implementation
- Review `report_timing_summary` for unconstrained paths
- Use `report_methodology` for DRC checks
- Document all timing waivers

## References

- Synopsys Design Constraints (SDC) Reference
- Xilinx UG903: Vivado Using Constraints
- Xilinx UG949: UltraFast Design Methodology
- Intel Quartus Prime Timing Analyzer

## See Also

- `timing-constraints.js` - Timing constraint development process
- `timing-closure.js` - Timing closure methodology
- SK-005: CDC Analysis skill
- AG-002: FPGA Timing Expert agent
