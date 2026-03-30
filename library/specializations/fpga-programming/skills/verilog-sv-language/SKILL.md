---
name: verilog-sv-language
description: Expert-level Verilog and SystemVerilog knowledge following IEEE 1800 standards. Generates synthesizable RTL code with proper coding styles and constructs.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob
---

# Verilog/SystemVerilog Language Skill

Expert skill for Verilog and SystemVerilog development following IEEE 1364 and IEEE 1800 standards. Provides deep expertise in synthesizable RTL code generation, proper construct usage, and modern coding practices.

## Overview

The Verilog/SystemVerilog Language skill enables comprehensive HDL development for FPGA and ASIC designs, supporting:
- IEEE 1800-2017 SystemVerilog standard
- Verilog-2005 backward compatibility
- Proper always_ff, always_comb, always_latch usage
- SystemVerilog interfaces and modports
- Parameterized modules with localparam
- Packed and unpacked arrays
- Packages and imports

## Capabilities

### 1. Proper Always Block Usage

Use SystemVerilog always block variants correctly:

```systemverilog
// Sequential logic - always_ff
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n) begin
    counter <= '0;
    state   <= IDLE;
  end else begin
    counter <= counter + 1'b1;
    state   <= next_state;
  end
end

// Combinational logic - always_comb
always_comb begin
  // Default assignments prevent latches
  next_state = state;
  output_valid = 1'b0;

  case (state)
    IDLE: begin
      if (start) next_state = RUN;
    end
    RUN: begin
      output_valid = 1'b1;
      if (done) next_state = IDLE;
    end
    default: next_state = IDLE;
  endcase
end

// Intentional latch - always_latch (rare)
always_latch begin
  if (enable)
    latch_out = data_in;
end
```

### 2. Parameterized Modules

Create reusable parameterized modules:

```systemverilog
module sync_fifo #(
  parameter int DATA_WIDTH = 8,
  parameter int DEPTH = 16,
  parameter int ALMOST_FULL_THRESH = DEPTH - 2,
  parameter int ALMOST_EMPTY_THRESH = 2,
  // Derived parameters using localparam
  localparam int ADDR_WIDTH = $clog2(DEPTH),
  localparam int CNT_WIDTH = $clog2(DEPTH + 1)
) (
  input  logic                    clk,
  input  logic                    rst_n,
  // Write interface
  input  logic                    wr_en,
  input  logic [DATA_WIDTH-1:0]   wr_data,
  output logic                    full,
  output logic                    almost_full,
  // Read interface
  input  logic                    rd_en,
  output logic [DATA_WIDTH-1:0]   rd_data,
  output logic                    empty,
  output logic                    almost_empty,
  // Status
  output logic [CNT_WIDTH-1:0]    fill_level
);

  // Memory array
  logic [DATA_WIDTH-1:0] mem [DEPTH];

  // Pointers
  logic [ADDR_WIDTH-1:0] wr_ptr, rd_ptr;
  logic [CNT_WIDTH-1:0] count;

  // Write logic
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      wr_ptr <= '0;
    end else if (wr_en && !full) begin
      mem[wr_ptr] <= wr_data;
      wr_ptr <= wr_ptr + 1'b1;
    end
  end

  // Read logic
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      rd_ptr <= '0;
    end else if (rd_en && !empty) begin
      rd_ptr <= rd_ptr + 1'b1;
    end
  end

  // Read data (registered output)
  always_ff @(posedge clk) begin
    if (rd_en && !empty) begin
      rd_data <= mem[rd_ptr];
    end
  end

  // Count logic
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      count <= '0;
    end else begin
      case ({wr_en && !full, rd_en && !empty})
        2'b10: count <= count + 1'b1;
        2'b01: count <= count - 1'b1;
        default: count <= count;
      endcase
    end
  end

  // Status outputs
  assign full         = (count == DEPTH);
  assign empty        = (count == '0);
  assign almost_full  = (count >= ALMOST_FULL_THRESH);
  assign almost_empty = (count <= ALMOST_EMPTY_THRESH);
  assign fill_level   = count;

endmodule
```

### 3. SystemVerilog Interfaces

Define reusable interfaces with modports:

```systemverilog
// AXI-Stream interface definition
interface axis_if #(
  parameter int DATA_WIDTH = 32,
  parameter int USER_WIDTH = 1,
  parameter int ID_WIDTH = 1
) (
  input logic aclk,
  input logic aresetn
);

  logic                    tvalid;
  logic                    tready;
  logic [DATA_WIDTH-1:0]   tdata;
  logic [DATA_WIDTH/8-1:0] tstrb;
  logic [DATA_WIDTH/8-1:0] tkeep;
  logic                    tlast;
  logic [ID_WIDTH-1:0]     tid;
  logic [ID_WIDTH-1:0]     tdest;
  logic [USER_WIDTH-1:0]   tuser;

  // Master modport
  modport master (
    input  aclk, aresetn, tready,
    output tvalid, tdata, tstrb, tkeep, tlast, tid, tdest, tuser
  );

  // Slave modport
  modport slave (
    input  aclk, aresetn, tvalid, tdata, tstrb, tkeep, tlast, tid, tdest, tuser,
    output tready
  );

  // Monitor modport for verification
  modport monitor (
    input aclk, aresetn, tvalid, tready, tdata, tstrb, tkeep, tlast, tid, tdest, tuser
  );

  // Helper tasks for verification
  task automatic wait_for_handshake();
    @(posedge aclk);
    while (!(tvalid && tready)) @(posedge aclk);
  endtask

endinterface

// Using the interface in a module
module axis_register #(
  parameter int DATA_WIDTH = 32
) (
  input logic clk,
  input logic rst_n,
  axis_if.slave  s_axis,
  axis_if.master m_axis
);

  // Skid buffer implementation
  logic [DATA_WIDTH-1:0] data_reg;
  logic                  valid_reg;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      valid_reg <= 1'b0;
      data_reg  <= '0;
    end else if (s_axis.tready) begin
      valid_reg <= s_axis.tvalid;
      data_reg  <= s_axis.tdata;
    end
  end

  assign m_axis.tvalid = valid_reg;
  assign m_axis.tdata  = data_reg;
  assign s_axis.tready = m_axis.tready || !valid_reg;

endmodule
```

### 4. Packages and Imports

Create and use SystemVerilog packages:

```systemverilog
// Package definition
package fpga_pkg;

  // Type definitions
  typedef enum logic [2:0] {
    IDLE    = 3'b000,
    INIT    = 3'b001,
    RUN     = 3'b010,
    PAUSE   = 3'b011,
    DONE    = 3'b100,
    ERROR   = 3'b101
  } state_t;

  // Struct definitions
  typedef struct packed {
    logic        valid;
    logic [31:0] data;
    logic [3:0]  strb;
    logic        last;
  } axi_data_t;

  // Constants
  localparam int CLK_FREQ_HZ = 100_000_000;
  localparam int TIMEOUT_CYCLES = CLK_FREQ_HZ / 1000;  // 1ms

  // Functions
  function automatic int clog2(int value);
    int result = 0;
    value = value - 1;
    while (value > 0) begin
      result++;
      value = value >> 1;
    end
    return result;
  endfunction

  function automatic logic [31:0] reverse_bits(logic [31:0] data);
    for (int i = 0; i < 32; i++) begin
      reverse_bits[i] = data[31-i];
    end
  endfunction

endpackage

// Using the package
module my_design
  import fpga_pkg::*;
(
  input  logic     clk,
  input  logic     rst_n,
  input  logic     start,
  output state_t   current_state,
  output axi_data_t output_data
);

  state_t state, next_state;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n)
      state <= IDLE;
    else
      state <= next_state;
  end

  always_comb begin
    next_state = state;
    case (state)
      IDLE:  if (start) next_state = RUN;
      RUN:   next_state = DONE;
      DONE:  next_state = IDLE;
      default: next_state = IDLE;
    endcase
  end

  assign current_state = state;

endmodule
```

### 5. Packed and Unpacked Arrays

Use arrays correctly for synthesis:

```systemverilog
module array_examples #(
  parameter int WIDTH = 8,
  parameter int DEPTH = 4
) (
  input  logic clk,
  input  logic rst_n,
  input  logic [WIDTH-1:0] data_in,
  output logic [WIDTH-1:0] data_out
);

  // Unpacked array - multiple memory locations
  logic [WIDTH-1:0] memory_array [DEPTH];  // Memory inference

  // Packed array - single contiguous bit vector
  logic [DEPTH-1:0][WIDTH-1:0] shift_reg;  // Shift register

  // Multi-dimensional packed array
  logic [3:0][7:0] packed_data;  // 32-bit value as 4 bytes

  // Multi-dimensional unpacked array
  logic [7:0] mem_2d [4][8];  // 4x8 array of bytes

  // Shift register using packed array
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      shift_reg <= '0;
    end else begin
      shift_reg <= {shift_reg[DEPTH-2:0], data_in};
    end
  end

  // Memory write
  logic [$clog2(DEPTH)-1:0] wr_addr;
  always_ff @(posedge clk) begin
    memory_array[wr_addr] <= data_in;
  end

  // Byte access to packed data
  assign packed_data[0] = 8'hAB;  // Least significant byte
  assign packed_data[3] = 8'hCD;  // Most significant byte

  assign data_out = shift_reg[DEPTH-1];

endmodule
```

### 6. Blocking vs Non-Blocking Assignments

Apply assignments correctly:

```systemverilog
// CORRECT: Non-blocking for sequential logic
always_ff @(posedge clk) begin
  reg_a <= data_in;     // Non-blocking
  reg_b <= reg_a;       // Non-blocking - creates pipeline
  reg_c <= reg_b;       // Non-blocking
end

// CORRECT: Blocking for combinational logic
always_comb begin
  temp = a & b;         // Blocking
  result = temp | c;    // Blocking - uses updated temp
end

// INCORRECT: Don't mix in sequential blocks
always_ff @(posedge clk) begin
  temp = data_in;       // WRONG: blocking in sequential
  reg_a <= temp;
end

// CORRECT: Use intermediate signals
logic temp_comb;
always_comb begin
  temp_comb = data_in & enable;
end

always_ff @(posedge clk) begin
  reg_a <= temp_comb;   // Non-blocking
end
```

### 7. Synthesis Attributes

Apply vendor-specific attributes:

```systemverilog
module synthesis_attributes (
  input  logic clk,
  input  logic rst_n,
  input  logic async_in,
  output logic sync_out
);

  // Xilinx: ASYNC_REG for synchronizers
  (* ASYNC_REG = "TRUE" *) logic [1:0] sync_reg;

  // Xilinx: Keep signal for debugging
  (* KEEP = "TRUE" *) logic debug_signal;

  // Xilinx: RAM style control
  (* RAM_STYLE = "block" *) logic [7:0] block_mem [1024];
  (* RAM_STYLE = "distributed" *) logic [7:0] dist_mem [16];

  // Xilinx: FSM encoding
  (* FSM_ENCODING = "one_hot" *) enum logic [2:0] {
    IDLE, RUN, DONE
  } state;

  // Intel: RAM inference
  (* ramstyle = "M20K" *) logic [7:0] intel_mem [1024];

  // Synchronizer implementation
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      sync_reg <= '0;
    end else begin
      sync_reg <= {sync_reg[0], async_in};
    end
  end

  assign sync_out = sync_reg[1];

endmodule
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `verilog-systemverilog-design.js` | Primary Verilog/SV development |
| `testbench-development.js` | SV testbench generation |
| `rtl-module-architecture.js` | Module design |
| `uvm-testbench.js` | UVM environment development |

## Output Schema

```json
{
  "module": {
    "name": "sync_fifo",
    "language": "SystemVerilog",
    "standard": "IEEE 1800-2017",
    "parameters": [
      { "name": "DATA_WIDTH", "type": "int", "default": 8 },
      { "name": "DEPTH", "type": "int", "default": 16 }
    ],
    "ports": [
      { "name": "clk", "direction": "input", "type": "logic" },
      { "name": "rst_n", "direction": "input", "type": "logic" }
    ],
    "interfaces": []
  },
  "package": {
    "name": "fpga_pkg",
    "types": ["state_t", "axi_data_t"],
    "functions": ["clog2", "reverse_bits"],
    "constants": ["CLK_FREQ_HZ", "TIMEOUT_CYCLES"]
  },
  "compliance": {
    "synthesizable": true,
    "alwaysBlocksCorrect": true,
    "noInferredLatches": true,
    "noBlockingInSequential": true
  },
  "artifacts": [
    "src/sync_fifo.sv",
    "src/fpga_pkg.sv",
    "src/axis_if.sv",
    "tb/sync_fifo_tb.sv"
  ]
}
```

## Best Practices

### Always Block Selection
- Use `always_ff` for flip-flops (sequential logic)
- Use `always_comb` for combinational logic
- Use `always_latch` only for intentional latches (rare)
- Never use plain `always @*` in SystemVerilog

### Assignment Rules
- Non-blocking (`<=`) in `always_ff`
- Blocking (`=`) in `always_comb`
- Never mix assignment types in same block

### Parameterization
- Use `parameter` for configurable values
- Use `localparam` for derived/internal constants
- Use `$clog2()` for address width calculation
- Provide sensible defaults

### Style Guidelines
- One port per line for readability
- Use `logic` instead of `wire`/`reg`
- Use `'0` and `'1` for all-zeros/all-ones
- Use meaningful names (snake_case preferred)

## References

- IEEE Std 1800-2017 (SystemVerilog)
- IEEE Std 1364-2005 (Verilog)
- Verilator User Manual
- Xilinx UG901: Vivado Synthesis Guide
- Intel Quartus Prime Synthesis Guide

## See Also

- `verilog-systemverilog-design.js` - Verilog/SV development process
- `uvm-testbench.js` - UVM testbench development
- SK-001: VHDL Language skill
- SK-003: SystemVerilog Assertions (SVA) skill
- AG-001: RTL Design Expert agent
