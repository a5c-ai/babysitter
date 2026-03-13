# FPGA Architect Agent

## Overview

The FPGA Architect is a senior-level agent that provides system-level design guidance for FPGA projects. It helps with device selection, architecture planning, resource budgeting, clock strategy, and interface design.

## Key Capabilities

- **Architecture Selection**: Device family comparison and sizing
- **System Partitioning**: HW/SW boundaries, multi-FPGA systems
- **Clock Architecture**: Domain planning, CDC strategy
- **Resource Planning**: Estimation, budgeting, margin analysis
- **Interface Design**: Protocol selection, bandwidth planning
- **Risk Assessment**: Technical and project risk identification

## When to Use This Agent

Use the FPGA Architect when:
- Starting a new FPGA project
- Selecting target device(s)
- Planning system architecture
- Evaluating HW/SW partitioning
- Reviewing existing architecture
- Addressing architectural issues

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | Principal FPGA Architect |
| **Experience** | 15+ years digital design |
| **Primary Focus** | System-level decisions |
| **Output** | Architecture documents, resource budgets |

## Expertise Domains

### 1. Device Selection

Comprehensive device evaluation:
- Resource requirements analysis
- Performance estimation
- Power budget assessment
- Cost-volume tradeoffs
- Availability and lead times

### 2. System Partitioning

Workload allocation decisions:
- FPGA vs CPU boundaries
- Hard vs soft IP tradeoffs
- Multi-FPGA architectures
- Acceleration opportunities
- Memory hierarchy design

### 3. Clock Architecture

Timing domain planning:
- Clock domain identification
- Frequency planning
- PLL/MMCM allocation
- CDC strategy
- Reset distribution

### 4. Resource Planning

Utilization estimation:
- Logic (LUTs, FFs)
- Memory (BRAM, UltraRAM)
- DSP resources
- I/O and transceivers
- Routing overhead

## Usage Example

### Invoking the Agent

```javascript
// In a babysitter process
const architecture = await ctx.task(architectureReviewTask, {
  designDescription: "100Gbps packet processing system with ML inference",
  requirements: {
    throughput: "100 Gbps",
    latency: "< 1 us",
    interfaces: ["2x 100GbE", "PCIe Gen4", "DDR4"],
    processing: "Header parsing, flow classification, ML inference",
    power: "< 75W"
  },
  constraints: {
    budget: "$5000 per unit",
    volume: "1000 units/year",
    timeline: "12 months to production"
  },
  specificQuestions: [
    "Should we use Versal AI or UltraScale+?",
    "Is external memory sufficient or do we need HBM?"
  ]
});
```

### Sample Output

```json
{
  "recommendations": [
    {
      "area": "Device Selection",
      "recommendation": "Versal Premium VP1202",
      "rationale": "Integrated 100GbE, AIE for ML, adequate logic",
      "alternatives": ["VU13P + external ML", "Agilex 7 F-Series"]
    },
    {
      "area": "Memory Architecture",
      "recommendation": "HBM2e + DDR4",
      "rationale": "ML inference requires high bandwidth, DDR4 for packet buffering"
    }
  ],
  "resourceEstimates": {
    "logic": { "required": 600000, "available": 900000, "margin": "33%" },
    "bram": { "required": 180, "available": 300, "margin": "40%" },
    "dsp": { "required": 800, "available": 1968, "margin": "59%" },
    "aie": { "required": 200, "available": 400, "margin": "50%" }
  },
  "clockArchitecture": {
    "domains": [
      { "name": "core_clk", "frequency": "400 MHz", "source": "PLL" },
      { "name": "mac_clk", "frequency": "156.25 MHz", "source": "recovered" },
      { "name": "pcie_clk", "frequency": "250 MHz", "source": "PCIe core" }
    ],
    "cdcCrossings": ["core-mac", "core-pcie"]
  },
  "risks": [
    {
      "risk": "ML inference latency",
      "likelihood": "Medium",
      "impact": "High",
      "mitigation": "Early profiling with AIE simulator"
    },
    {
      "risk": "Power budget",
      "likelihood": "Medium",
      "impact": "Medium",
      "mitigation": "Thermal modeling, clock gating strategy"
    }
  ],
  "nextSteps": [
    "Create detailed block diagram",
    "Prototype critical data paths",
    "Develop timing budget",
    "Order development board"
  ]
}
```

## Architecture Review Checklist

### Requirements Gathering

- [ ] Functional requirements documented
- [ ] Performance targets defined (throughput, latency)
- [ ] Interface requirements specified
- [ ] Power and thermal constraints known
- [ ] Cost targets established

### Device Selection

- [ ] Resource estimates completed
- [ ] Multiple device options evaluated
- [ ] Speed grade selected
- [ ] Package and pin count verified
- [ ] Development vs production devices planned

### Architecture Design

- [ ] Block diagram created
- [ ] Clock domains identified
- [ ] Reset strategy defined
- [ ] Memory architecture planned
- [ ] Interface protocols selected

### Risk Assessment

- [ ] Technical risks identified
- [ ] Project risks evaluated
- [ ] Mitigation strategies defined
- [ ] Contingency plans documented

## Resource Estimation Quick Reference

### Logic (LUTs)

| Component | Typical Range |
|-----------|---------------|
| Simple FSM | 50-200 |
| UART | 200-500 |
| SPI Master | 300-600 |
| AXI-Lite Slave | 500-1K |
| 10GbE MAC | 5K-15K |
| PCIe Endpoint | 10K-30K |

### Memory (BRAM 36Kb)

| Buffer Size | BRAM Count |
|-------------|------------|
| 1 KB | 0.5 |
| 4 KB | 1-2 |
| 16 KB | 4-5 |
| 64 KB | 16-18 |
| 256 KB | 64-72 |

### DSP

| Operation | DSP Count |
|-----------|-----------|
| 18x18 multiply | 1 |
| 27x18 multiply | 1 |
| MAC operation | 1 |
| FIR (N taps) | N/2 |

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| rtl-module-architecture.js | Module-level decisions |
| hardware-software-codesign.js | Partitioning guidance |
| ip-core-integration.js | IP selection strategy |
| clock-network-design.js | Clock planning |
| memory-interface-design.js | Memory architecture |

## Best Practices

### Before Review

- Gather all requirements
- Document constraints
- Identify stakeholders
- Prepare specific questions

### During Review

- Challenge assumptions
- Explore alternatives
- Quantify trade-offs
- Document decisions

### After Review

- Create action items
- Update architecture docs
- Schedule follow-ups
- Track risks

## Limitations

- Estimates are approximations
- Device availability varies
- Tool capabilities evolve
- Actual results depend on implementation

## References

- [Xilinx UltraFast Design Methodology](https://docs.xilinx.com/r/en-US/ug949-vivado-design-methodology)
- [Intel FPGA Design Guidelines](https://www.intel.com/content/www/us/en/docs/programmable/683082/)
- [FPGA Architecture Overview](https://www.xilinx.com/support/documentation/selection-guides/cost-optimized-portfolio-product-selection-guide.pdf)

## Related Resources

- [AGENT.md](./AGENT.md) - Full agent definition
- [Xilinx Specialist](../xilinx-specialist/) - Device-specific guidance
- [Intel Specialist](../intel-specialist/) - Device-specific guidance
