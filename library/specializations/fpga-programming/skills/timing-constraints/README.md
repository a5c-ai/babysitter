# Timing Constraints Skill

## Overview

The Timing Constraints skill provides expert capabilities for developing SDC and XDC timing constraints for FPGA designs. It handles clock definition, I/O timing, false paths, multicycle paths, and CDC constraints.

## Quick Start

### Prerequisites

1. Design netlist or RTL source
2. Target FPGA device specification
3. Interface timing requirements (datasheets)
4. Clock architecture documentation

### Basic Usage

```javascript
// In a babysitter process
const constraints = await ctx.task(generateTimingConstraints, {
  design: 'packet_processor',
  clocks: [
    { name: 'sys_clk', port: 'clk_100mhz', frequency: 100e6 },
    { name: 'rx_clk', port: 'rgmii_rx_clk', frequency: 125e6 }
  ],
  interfaces: [
    { name: 'rgmii', type: 'source_sync', clock: 'rx_clk', dataPort: 'rgmii_rxd' }
  ],
  cdcCrossings: [
    { from: 'sys_clk', to: 'rx_clk', type: 'async_fifo' }
  ]
});

console.log(`Generated: ${constraints.artifacts.join(', ')}`);
```

## Features

### Clock Constraints

- **Primary clocks**: External clock inputs
- **Generated clocks**: MMCM/PLL outputs, dividers
- **Virtual clocks**: For I/O timing without physical pins
- **Clock groups**: Async, exclusive relationships

### I/O Timing

- **Input delay**: Setup/hold for input paths
- **Output delay**: Clock-to-out requirements
- **DDR interfaces**: Both clock edges
- **Source synchronous**: Forwarded clocks

### Path Exceptions

- **False paths**: Reset, static config, CDC
- **Multicycle paths**: Slow operations, phase shifts
- **Max delay**: CDC synchronizer constraints

## Use Cases

### 1. Generate Clock Constraints

Create comprehensive clock definitions:

```javascript
const result = await ctx.task(generateClockConstraints, {
  primaryClocks: [
    { name: 'sys_clk', port: 'clk_100mhz', period: 10.0 },
    { name: 'gt_refclk', port: 'gt_refclk_p', period: 6.4 }
  ],
  mmcmOutputs: [
    { mmcm: 'clk_wiz_0', outputs: ['clk_200', 'clk_50', 'clk_25'] }
  ],
  asyncRelationships: [
    ['sys_clk', 'gt_refclk']
  ]
});
```

### 2. Generate I/O Timing Constraints

Constrain interface timing:

```javascript
const result = await ctx.task(generateIOConstraints, {
  interfaces: [
    {
      name: 'ddr_interface',
      type: 'ddr',
      clock: 'ddr_clk',
      inputs: { ports: 'ddr_dq[*]', maxDelay: 2.5, minDelay: 0.5 },
      outputs: { ports: 'ddr_dq[*]', maxDelay: 1.5, minDelay: 0.0 }
    },
    {
      name: 'spi_interface',
      type: 'sdr',
      clock: 'spi_clk',
      inputs: { ports: 'spi_miso', maxDelay: 4.0, minDelay: 0.0 },
      outputs: { ports: 'spi_mosi', maxDelay: 3.0, minDelay: -0.5 }
    }
  ]
});
```

### 3. Generate CDC Constraints

Create constraints for clock domain crossings:

```javascript
const result = await ctx.task(generateCDCConstraints, {
  crossings: [
    {
      fromClock: 'sys_clk',
      toClock: 'rx_clk',
      type: 'synchronizer',
      srcCells: '*cdc_src*',
      dstCells: '*cdc_sync_reg[0]*'
    },
    {
      fromClock: 'sys_clk',
      toClock: 'tx_clk',
      type: 'async_fifo',
      fifoInstance: 'tx_fifo'
    }
  ],
  constraintStyle: 'max_delay'  // or 'false_path'
});
```

### 4. Validate Constraints

Check constraint coverage:

```javascript
const result = await ctx.task(validateConstraints, {
  constraintFiles: ['constraints/*.xdc'],
  checks: [
    'all_clocks_defined',
    'all_io_constrained',
    'cdc_paths_covered',
    'no_latch_paths'
  ]
});
```

## Configuration

### Constraint Configuration

```json
{
  "design": {
    "name": "top_level",
    "targetDevice": "xc7a200t-2-fbg484"
  },
  "clockDomains": {
    "sys_clk": { "frequency": 100e6, "source": "external" },
    "proc_clk": { "frequency": 200e6, "source": "mmcm", "parent": "sys_clk" }
  },
  "cdcPolicy": {
    "defaultConstraint": "max_delay",
    "maxDelayMultiplier": 0.8,
    "requireAsyncReg": true
  }
}
```

### I/O Timing Budget

```json
{
  "interface": "rgmii",
  "timing": {
    "boardDelay": { "min": 0.1, "max": 0.5 },
    "setupTime": 1.5,
    "holdTime": 0.5,
    "clockToOut": 2.0
  }
}
```

## Output Files

### Generated Artifacts

| File | Description |
|------|-------------|
| `constraints/clocks.xdc` | Clock definitions |
| `constraints/io_timing.xdc` | I/O delay constraints |
| `constraints/cdc.xdc` | CDC path constraints |
| `constraints/exceptions.xdc` | False/multicycle paths |
| `constraints/physical.xdc` | Pin assignments |
| `docs/timing_budget.md` | Documentation |

### Sample Clock Constraints

```tcl
# clocks.xdc
# Primary clocks
create_clock -name sys_clk -period 10.000 [get_ports clk_100mhz]
create_clock -name rx_clk -period 8.000 [get_ports rgmii_rx_clk]

# Generated clocks (MMCM)
create_generated_clock -name clk_200 \
  -source [get_pins clk_wiz_0/clkin1] \
  -master_clock sys_clk \
  [get_pins clk_wiz_0/clkout0]

# Clock relationships
set_clock_groups -asynchronous \
  -group [get_clocks sys_clk] \
  -group [get_clocks rx_clk]
```

## Integration

### Vivado Integration

```tcl
# Add constraint files in order
read_xdc constraints/clocks.xdc
read_xdc constraints/io_timing.xdc
read_xdc constraints/cdc.xdc
read_xdc constraints/exceptions.xdc
read_xdc constraints/physical.xdc

# Validate
check_timing -verbose
report_clock_interaction -delay_type min_max
report_timing_summary
```

### Process Integration

The Timing Constraints skill integrates with these processes:

- `timing-constraints.js` - Primary constraint development
- `timing-closure.js` - Iterative timing refinement
- `cdc-design.js` - CDC verification
- `synthesis-optimization.js` - Constraint-aware optimization

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Unconstrained clock | Missing create_clock | Add clock definition |
| Timing failure | Insufficient constraint | Review delay values |
| CDC violation | Missing false_path | Add CDC constraint |
| Pulse width error | Clock definition wrong | Check waveform spec |

### Validation Commands

```tcl
# Check all clocks
report_clocks

# Check clock relationships
report_clock_interaction -delay_type min_max

# Find unconstrained paths
report_timing -no_path_detail -max_paths 100

# Check constraint coverage
check_timing -verbose

# Verify CDC constraints
report_cdc -details
```

## Best Practices

1. **Start with clocks** - Define all clock sources first
2. **Document assumptions** - Comment delay calculations
3. **Use clock groups** - Explicitly state relationships
4. **Prefer max_delay** - Over false_path for CDC
5. **Validate early** - Run check_timing before implementation

## References

- [Xilinx UG903: Using Constraints](https://docs.xilinx.com/r/en-US/ug903-vivado-using-constraints)
- [Xilinx UG949: UltraFast Design Methodology](https://docs.xilinx.com/r/en-US/ug949-vivado-design-methodology)
- [Intel Quartus Timing Analyzer](https://www.intel.com/content/www/us/en/docs/programmable/683068/)
- [Synopsys SDC Reference](https://www.synopsys.com/support/training/synthesis.html)

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Timing Constraints Process](../../timing-constraints.js)
- [Timing Closure Process](../../timing-closure.js)
