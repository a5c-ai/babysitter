---
name: synthesis-optimization
description: Expertise in RTL optimization for FPGA synthesis tools. Analyzes synthesis reports, applies attributes, and guides resource inference for optimal QoR.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob
---

# Synthesis Optimization Skill

Expert skill for FPGA synthesis optimization targeting Vivado and Quartus tools. Provides deep expertise in synthesis report analysis, attribute application, resource inference control, and QoR (Quality of Results) improvement.

## Overview

The Synthesis Optimization skill enables comprehensive synthesis optimization for FPGA designs, supporting:
- Synthesis report analysis and resource utilization review
- Synthesis attributes (keep, max_fanout, ram_style, etc.)
- DSP and BRAM inference guidance
- FSM encoding optimization (one-hot, binary, Gray)
- Retiming and register balancing
- Logic optimization strategies
- High-fanout net reduction
- Multi-vendor synthesis flows

## Capabilities

### 1. Synthesis Report Analysis

Parse and analyze synthesis reports:

```tcl
# Vivado synthesis report analysis
report_utilization -hierarchical
report_utilization -cells [get_cells -hier -filter {IS_PRIMITIVE}]
report_timing_summary -setup -hold

# Resource utilization breakdown
report_utilization -format csv -file utilization.csv

# Check specific resource types
report_utilization -cells [get_cells -hier -filter {REF_NAME =~ DSP*}]
report_utilization -cells [get_cells -hier -filter {REF_NAME =~ RAM*}]
```

### 2. Synthesis Attributes

Apply Xilinx/Vivado synthesis attributes:

```systemverilog
// Keep hierarchy for debugging
(* KEEP_HIERARCHY = "yes" *)
module critical_path_module (
  // ...
);

// Prevent register optimization
(* DONT_TOUCH = "yes" *) logic debug_reg;

// Control register duplication for timing
(* MAX_FANOUT = 50 *) logic high_fanout_signal;

// Force specific implementation
(* KEEP = "true" *) logic preserved_signal;

// RAM style control
(* RAM_STYLE = "block" *) logic [7:0] large_mem [1024];
(* RAM_STYLE = "distributed" *) logic [7:0] small_mem [16];
(* RAM_STYLE = "registers" *) logic [7:0] tiny_mem [4];
(* RAM_STYLE = "ultra" *) logic [7:0] uram_mem [4096];  // UltraRAM

// ROM style control
(* ROM_STYLE = "block" *) logic [7:0] lookup_table [256];

// Use DSP for arithmetic
(* USE_DSP = "yes" *) logic [47:0] mult_result;
(* USE_DSP = "no" *) logic [15:0] small_mult;  // Use fabric

// Shreg extraction control
(* SHREG_EXTRACT = "yes" *) logic [15:0] shift_reg;
(* SRL_STYLE = "register" *) logic [7:0] no_srl_shift;

// Async register for CDC synchronizers
(* ASYNC_REG = "TRUE" *) logic [1:0] sync_reg;

// FSM encoding
(* FSM_ENCODING = "one_hot" *) enum logic [3:0] {
  IDLE, INIT, RUN, DONE
} state;

(* FSM_ENCODING = "sequential" *)  // Binary encoding
(* FSM_ENCODING = "gray" *)        // Gray code
(* FSM_ENCODING = "johnson" *)     // Johnson encoding
(* FSM_ENCODING = "auto" *)        // Tool decides
```

### 3. Intel/Quartus Attributes

Apply Quartus synthesis attributes:

```systemverilog
// RAM style
(* ramstyle = "M20K" *) logic [7:0] intel_bram [1024];
(* ramstyle = "MLAB" *) logic [7:0] intel_lutram [32];
(* ramstyle = "logic" *) logic [7:0] intel_ff_mem [8];
(* ramstyle = "no_rw_check" *) logic [7:0] dual_port_mem [256];

// Preserve signal
(* preserve *) logic keep_signal;
(* noprune *) logic unused_but_keep;

// DSP usage
(* multstyle = "dsp" *) logic [31:0] use_dsp;
(* multstyle = "logic" *) logic [7:0] use_fabric;

// Synchronizer
(* altera_attribute = "-name SYNCHRONIZER_IDENTIFICATION FORCED" *)
logic [1:0] altera_sync;

// Maximum fanout
(* maxfan = 32 *) logic fanout_limited;
```

### 4. DSP Inference Optimization

Guide DSP48/DSP block inference:

```systemverilog
// Optimal DSP48 inference pattern (multiply-accumulate)
module dsp_mac #(
  parameter int A_WIDTH = 18,
  parameter int B_WIDTH = 18,
  parameter int P_WIDTH = 48
) (
  input  logic                 clk,
  input  logic                 rst_n,
  input  logic                 ce,
  input  logic signed [A_WIDTH-1:0] a,
  input  logic signed [B_WIDTH-1:0] b,
  input  logic signed [P_WIDTH-1:0] c,
  input  logic                 load,  // Load C vs accumulate
  output logic signed [P_WIDTH-1:0] p
);

  // Pipeline registers for timing
  logic signed [A_WIDTH-1:0] a_reg;
  logic signed [B_WIDTH-1:0] b_reg;
  logic signed [P_WIDTH-1:0] mult_reg;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      a_reg <= '0;
      b_reg <= '0;
      mult_reg <= '0;
      p <= '0;
    end else if (ce) begin
      // Input registers (A and B)
      a_reg <= a;
      b_reg <= b;
      // Multiplier register (M)
      mult_reg <= a_reg * b_reg;
      // Accumulator/output (P)
      p <= load ? c + mult_reg : p + mult_reg;
    end
  end

endmodule

// Prevent DSP for small multiplies
(* USE_DSP = "no" *)
module small_mult (
  input  logic [7:0] a, b,
  output logic [15:0] p
);
  assign p = a * b;  // Will use fabric LUTs
endmodule
```

### 5. BRAM Inference Optimization

Ensure correct Block RAM inference:

```systemverilog
// Simple dual-port RAM (correct inference pattern)
module sdp_ram #(
  parameter int DATA_WIDTH = 32,
  parameter int DEPTH = 1024,
  parameter int ADDR_WIDTH = $clog2(DEPTH)
) (
  input  logic                    clk,
  // Write port
  input  logic                    wr_en,
  input  logic [ADDR_WIDTH-1:0]   wr_addr,
  input  logic [DATA_WIDTH-1:0]   wr_data,
  // Read port
  input  logic [ADDR_WIDTH-1:0]   rd_addr,
  output logic [DATA_WIDTH-1:0]   rd_data
);

  (* RAM_STYLE = "block" *)
  logic [DATA_WIDTH-1:0] mem [DEPTH];

  // Write port
  always_ff @(posedge clk) begin
    if (wr_en) begin
      mem[wr_addr] <= wr_data;
    end
  end

  // Read port (registered output for BRAM)
  always_ff @(posedge clk) begin
    rd_data <= mem[rd_addr];
  end

endmodule

// True dual-port RAM
module tdp_ram #(
  parameter int DATA_WIDTH = 32,
  parameter int DEPTH = 1024
) (
  // Port A
  input  logic                    clk_a,
  input  logic                    en_a,
  input  logic                    wr_en_a,
  input  logic [$clog2(DEPTH)-1:0] addr_a,
  input  logic [DATA_WIDTH-1:0]   wr_data_a,
  output logic [DATA_WIDTH-1:0]   rd_data_a,
  // Port B
  input  logic                    clk_b,
  input  logic                    en_b,
  input  logic                    wr_en_b,
  input  logic [$clog2(DEPTH)-1:0] addr_b,
  input  logic [DATA_WIDTH-1:0]   wr_data_b,
  output logic [DATA_WIDTH-1:0]   rd_data_b
);

  (* RAM_STYLE = "block" *)
  logic [DATA_WIDTH-1:0] mem [DEPTH];

  // Port A
  always_ff @(posedge clk_a) begin
    if (en_a) begin
      if (wr_en_a)
        mem[addr_a] <= wr_data_a;
      rd_data_a <= mem[addr_a];  // Read-first mode
    end
  end

  // Port B
  always_ff @(posedge clk_b) begin
    if (en_b) begin
      if (wr_en_b)
        mem[addr_b] <= wr_data_b;
      rd_data_b <= mem[addr_b];  // Read-first mode
    end
  end

endmodule
```

### 6. FSM Encoding Optimization

Choose optimal FSM encoding:

```systemverilog
// One-hot encoding (fast, more registers)
(* FSM_ENCODING = "one_hot" *)
typedef enum logic [7:0] {
  IDLE    = 8'b00000001,
  INIT    = 8'b00000010,
  CONFIG  = 8'b00000100,
  RUN     = 8'b00001000,
  PAUSE   = 8'b00010000,
  DONE    = 8'b00100000,
  ERROR   = 8'b01000000,
  RESET   = 8'b10000000
} state_t;

// Binary encoding (compact, slower decode)
(* FSM_ENCODING = "sequential" *)
typedef enum logic [2:0] {
  S_IDLE  = 3'd0,
  S_INIT  = 3'd1,
  S_RUN   = 3'd2,
  S_DONE  = 3'd3
} compact_state_t;

// Gray encoding (low power, one-bit transitions)
(* FSM_ENCODING = "gray" *)
typedef enum logic [2:0] {
  G_IDLE  = 3'b000,
  G_INIT  = 3'b001,
  G_RUN   = 3'b011,
  G_DONE  = 3'b010
} gray_state_t;

// Safe FSM with illegal state recovery
module safe_fsm (
  input  logic clk,
  input  logic rst_n,
  input  logic start,
  input  logic done,
  output state_t state
);

  state_t current_state, next_state;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n)
      current_state <= IDLE;
    else
      current_state <= next_state;
  end

  always_comb begin
    next_state = current_state;
    case (current_state)
      IDLE:   if (start) next_state = INIT;
      INIT:   next_state = RUN;
      RUN:    if (done) next_state = DONE;
      DONE:   next_state = IDLE;
      default: next_state = IDLE;  // Illegal state recovery
    endcase
  end

  assign state = current_state;

endmodule
```

### 7. High-Fanout Net Optimization

Reduce high-fanout timing issues:

```systemverilog
// Register duplication for fanout control
module fanout_control (
  input  logic clk,
  input  logic rst_n,
  input  logic enable_in,
  output logic [31:0] data_out
);

  // High-fanout enable - duplicate for timing
  (* MAX_FANOUT = 50 *)
  logic enable_r;

  // Or explicitly replicate
  logic enable_bank0, enable_bank1, enable_bank2, enable_bank3;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      enable_r <= 1'b0;
      enable_bank0 <= 1'b0;
      enable_bank1 <= 1'b0;
      enable_bank2 <= 1'b0;
      enable_bank3 <= 1'b0;
    end else begin
      enable_r <= enable_in;
      // Replicated enables
      enable_bank0 <= enable_in;
      enable_bank1 <= enable_in;
      enable_bank2 <= enable_in;
      enable_bank3 <= enable_in;
    end
  end

  // Use dedicated enables for each bank
  always_ff @(posedge clk) begin
    if (enable_bank0) data_out[7:0]   <= /* ... */;
    if (enable_bank1) data_out[15:8]  <= /* ... */;
    if (enable_bank2) data_out[23:16] <= /* ... */;
    if (enable_bank3) data_out[31:24] <= /* ... */;
  end

endmodule
```

### 8. Retiming and Pipelining

Apply retiming for timing improvement:

```systemverilog
// Vivado retiming attribute
(* RETIMING_FORWARD = 1 *)
module forward_retiming (
  input  logic clk,
  input  logic [7:0] a, b,
  output logic [15:0] result
);
  // Synthesis may move registers forward
  logic [15:0] mult;
  logic [15:0] result_r1, result_r2;

  assign mult = a * b;

  always_ff @(posedge clk) begin
    result_r1 <= mult;
    result_r2 <= result_r1;
    result <= result_r2;
  end
endmodule

// Manual pipeline balancing
module balanced_pipeline #(
  parameter int PIPELINE_STAGES = 3
) (
  input  logic clk,
  input  logic [31:0] data_in,
  input  logic        valid_in,
  output logic [31:0] data_out,
  output logic        valid_out
);

  logic [31:0] data_pipe [PIPELINE_STAGES];
  logic [PIPELINE_STAGES-1:0] valid_pipe;

  always_ff @(posedge clk) begin
    // Data pipeline
    data_pipe[0] <= data_in;
    for (int i = 1; i < PIPELINE_STAGES; i++) begin
      data_pipe[i] <= data_pipe[i-1];
    end

    // Valid pipeline
    valid_pipe <= {valid_pipe[PIPELINE_STAGES-2:0], valid_in};
  end

  assign data_out = data_pipe[PIPELINE_STAGES-1];
  assign valid_out = valid_pipe[PIPELINE_STAGES-1];

endmodule
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `synthesis-optimization.js` | Primary synthesis optimization |
| `timing-closure.js` | Synthesis for timing |
| `place-and-route.js` | Post-synthesis optimization |
| `power-analysis-optimization.js` | Power-aware synthesis |

## Output Schema

```json
{
  "synthesisAnalysis": {
    "resourceUtilization": {
      "luts": { "used": 45000, "available": 203800, "percentage": 22.1 },
      "registers": { "used": 52000, "available": 407600, "percentage": 12.8 },
      "bram": { "used": 120, "available": 445, "percentage": 27.0 },
      "dsp": { "used": 48, "available": 740, "percentage": 6.5 }
    },
    "hierarchy": [
      { "module": "processor", "luts": 25000, "regs": 30000 },
      { "module": "memory_ctrl", "luts": 10000, "regs": 12000 }
    ],
    "criticalPaths": [
      { "from": "reg_a", "to": "reg_b", "slack": -0.5, "levels": 12 }
    ]
  },
  "optimizations": [
    { "type": "attribute", "target": "sync_reg", "attribute": "ASYNC_REG" },
    { "type": "encoding", "target": "state_fsm", "encoding": "one_hot" },
    { "type": "ramStyle", "target": "data_mem", "style": "block" }
  ],
  "recommendations": [
    "Consider pipelining multiplier at line 125",
    "High fanout on enable signal (fan=500) - add MAX_FANOUT",
    "Consider distributed RAM for small_mem (depth=16)"
  ],
  "artifacts": [
    "src/optimized_module.sv",
    "reports/utilization.rpt",
    "reports/timing_summary.rpt"
  ]
}
```

## Best Practices

### Attribute Application
- Use ASYNC_REG on all CDC synchronizers
- Apply MAX_FANOUT to high-fanout signals
- Control RAM_STYLE for predictable inference
- Use USE_DSP sparingly to balance resources

### Resource Inference
- Register RAM outputs for BRAM inference
- Match DSP48 patterns for automatic inference
- Use SRL for deep shift registers
- Avoid async resets for BRAM

### Timing Optimization
- Add pipeline stages to long combinational paths
- Use retiming attributes when appropriate
- Balance pipeline stages across modules
- Consider FSM encoding impact on timing

## References

- Xilinx UG901: Vivado Synthesis Guide
- Xilinx UG949: UltraFast Design Methodology
- Intel Quartus Prime Synthesis Guide
- Yosys Open Synthesis Manual

## See Also

- `synthesis-optimization.js` - Synthesis optimization process
- `timing-closure.js` - Timing closure methodology
- SK-010: Place and Route skill
- AG-007: Synthesis Expert agent
