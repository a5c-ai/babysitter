---
name: rtl-linting
description: RTL code quality checking and linting. Runs lint rules, identifies synthesis issues, detects inferred latches, and generates lint reports with waivers.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob
---

# RTL Linting Skill

Expert skill for RTL code quality checking and linting using Verible, SpyGlass, and vendor tools. Provides comprehensive code analysis for synthesis issues, coding style, CDC violations, and best practice enforcement.

## Overview

The RTL Linting skill enables comprehensive RTL code quality checking, supporting:
- SpyGlass/Ascent lint rule execution
- Verible SystemVerilog linting and formatting
- Vivado and Quartus lint checks
- Synthesis coding issue detection
- Inferred latch identification
- Clock domain violation checking
- Reset handling verification
- Naming convention enforcement
- Lint report generation and waiver management

## Capabilities

### 1. Verible Linting

Run Verible SystemVerilog lint checks:

```bash
# Run all default lint rules
verible-verilog-lint src/*.sv

# Run with specific rules
verible-verilog-lint --rules=no-trailing-spaces,line-length src/*.sv

# Generate machine-readable output
verible-verilog-lint --format=json src/*.sv > lint_report.json

# Use rules configuration file
verible-verilog-lint --rules_config=.verible.rules src/*.sv

# Autofix where possible
verible-verilog-lint --autofix=yes src/*.sv
```

### 2. Verible Rules Configuration

Configure Verible lint rules:

```
# .verible.rules

# Enable rules
+line-length
+no-trailing-spaces
+no-tabs
+posix-eof

# Disable rules
-endif-comment
-explicit-begin

# Configure rule parameters
line-length=length:120

# Waiver syntax
# waive:rule_name:reason
```

### 3. Common Lint Checks

Detect common RTL issues:

```systemverilog
// ISSUE: Inferred latch (incomplete if-else)
always_comb begin
  if (sel)
    output = a;
  // Missing else - LATCH INFERRED
end

// FIX: Complete all branches
always_comb begin
  if (sel)
    output = a;
  else
    output = b;
end

// ISSUE: Blocking assignment in sequential block
always_ff @(posedge clk) begin
  temp = data;     // WRONG: blocking in always_ff
  result <= temp;
end

// FIX: Use non-blocking
always_ff @(posedge clk) begin
  temp <= data;    // CORRECT
  result <= temp;
end

// ISSUE: Missing sensitivity list item
always @(a or b) begin  // c missing!
  result = a & b | c;
end

// FIX: Use always_comb or @(*)
always_comb begin
  result = a & b | c;
end

// ISSUE: Case without default
always_comb begin
  case (sel)
    2'b00: out = a;
    2'b01: out = b;
    2'b10: out = c;
    // Missing default - potential latch
  endcase
end

// FIX: Add default case
always_comb begin
  case (sel)
    2'b00: out = a;
    2'b01: out = b;
    2'b10: out = c;
    default: out = '0;
  endcase
end
```

### 4. Clock Domain Crossing Checks

Detect CDC violations:

```systemverilog
// ISSUE: Unsynchronized CDC
always_ff @(posedge clk_b) begin
  data_b <= data_a;  // Direct crossing - CDC VIOLATION
end

// FIX: Add synchronizer
logic [1:0] sync_reg;
(* ASYNC_REG = "TRUE" *)
always_ff @(posedge clk_b) begin
  sync_reg <= {sync_reg[0], signal_a};
end
assign signal_b = sync_reg[1];

// ISSUE: Multi-bit CDC without gray coding
always_ff @(posedge clk_b) begin
  ptr_b <= ptr_a;  // Multi-bit direct - DATA COHERENCY ISSUE
end

// FIX: Gray code for multi-bit CDC
logic [3:0] ptr_gray_a;
assign ptr_gray_a = ptr_a ^ (ptr_a >> 1);  // Binary to Gray

(* ASYNC_REG = "TRUE" *)
logic [3:0] ptr_gray_sync [2];
always_ff @(posedge clk_b) begin
  ptr_gray_sync[0] <= ptr_gray_a;
  ptr_gray_sync[1] <= ptr_gray_sync[0];
end
```

### 5. Reset Handling Checks

Verify proper reset usage:

```systemverilog
// ISSUE: Missing reset
always_ff @(posedge clk) begin
  counter <= counter + 1;  // No reset - INITIALIZATION ISSUE
end

// FIX: Add reset
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    counter <= '0;
  else
    counter <= counter + 1;
end

// ISSUE: Async reset on BRAM (won't synthesize)
(* RAM_STYLE = "block" *)
logic [7:0] mem [256];

always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    mem <= '{default: '0};  // Can't reset BRAM!
  else if (wr_en)
    mem[addr] <= data;
end

// FIX: Remove async reset from BRAM
always_ff @(posedge clk) begin
  if (wr_en)
    mem[addr] <= data;
end
```

### 6. Naming Convention Checks

Enforce coding standards:

```systemverilog
// Recommended naming conventions

// Signals
logic data_valid;        // snake_case for signals
logic [7:0] byte_count;  // descriptive names

// Parameters
parameter int DATA_WIDTH = 8;   // UPPER_CASE for parameters
localparam int ADDR_BITS = 4;   // UPPER_CASE for localparams

// Types
typedef enum logic [1:0] {
  STATE_IDLE,    // UPPER_CASE for enum values
  STATE_RUN,
  STATE_DONE
} state_t;       // _t suffix for types

// Modules
module data_processor (  // snake_case for modules
  // ...
);

// Interfaces
interface axi_stream_if;  // _if suffix for interfaces

// Clock and reset naming
input logic clk,          // clk for clocks
input logic clk_200mhz,   // clk_ prefix with frequency
input logic rst_n,        // rst_n for active-low reset
input logic areset_n,     // areset_n for async reset
```

### 7. Vivado Lint Messages

Handle Vivado synthesis warnings:

```tcl
# Run synthesis with warning report
synth_design -top top_module -part xc7a200t-2-fbg484

# Check for critical warnings
report_drc -file drc_report.txt
report_methodology -file methodology_report.txt

# Common Vivado warnings to address:
# [Synth 8-327] - Inferring latch
# [Synth 8-3332] - Sequential element unused
# [Synth 8-6014] - Unused sequential element removed
# [Synth 8-3919] - Null assignment to signal
# [Synth 8-5534] - Missing connection to port
```

### 8. Lint Report Generation

Generate comprehensive lint reports:

```python
# lint_report.py
import json
from dataclasses import dataclass
from typing import List

@dataclass
class LintViolation:
    file: str
    line: int
    rule: str
    severity: str  # error, warning, info
    message: str
    waived: bool = False
    waiver_reason: str = ""

def generate_lint_report(violations: List[LintViolation]) -> dict:
    """Generate structured lint report."""
    report = {
        "summary": {
            "total": len(violations),
            "errors": sum(1 for v in violations if v.severity == "error"),
            "warnings": sum(1 for v in violations if v.severity == "warning"),
            "waived": sum(1 for v in violations if v.waived)
        },
        "by_rule": {},
        "by_file": {},
        "violations": []
    }

    for v in violations:
        # Group by rule
        if v.rule not in report["by_rule"]:
            report["by_rule"][v.rule] = []
        report["by_rule"][v.rule].append(v.__dict__)

        # Group by file
        if v.file not in report["by_file"]:
            report["by_file"][v.file] = []
        report["by_file"][v.file].append(v.__dict__)

        # Full list
        report["violations"].append(v.__dict__)

    return report
```

### 9. Waiver Management

Create and manage lint waivers:

```tcl
# waivers.tcl - SpyGlass waiver format

# Waive specific instance
waive -rule STARC05-2.1.1.3 \
  -msg "Unregistered async input" \
  -instance "top/async_input_sync" \
  -reason "Synchronizer follows this register"

# Waive by file pattern
waive -rule W116 \
  -file "*/tb/*" \
  -reason "Testbench code - not synthesized"

# Waive with comment
waive -rule STARC-2.1.3.1 \
  -msg "Latch inferred" \
  -instance "debug_module/state_latch" \
  -reason "Intentional latch for debug state capture"
```

```yaml
# waivers.yaml - Alternative format
waivers:
  - rule: "inferred-latch"
    file: "src/debug_capture.sv"
    line: 42
    reason: "Intentional latch for edge detection"
    author: "jdoe"
    date: "2026-01-24"

  - rule: "multi-bit-cdc"
    instance: "fifo_inst/wr_ptr_sync"
    reason: "Gray-coded pointer, safe CDC pattern"
    author: "jdoe"
    date: "2026-01-24"
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `vhdl-module-development.js` | VHDL code quality |
| `verilog-systemverilog-design.js` | Verilog/SV lint |
| `synthesis-optimization.js` | Pre-synthesis checks |
| `cdc-design.js` | CDC lint rules |

## Workflow

### 1. Configure Lint Rules

```bash
# Create Verible rules file
cat > .verible.rules << 'EOF'
+line-length=length:120
+no-trailing-spaces
+no-tabs
+posix-eof
+explicit-parameter-storage-type
+proper-parameter-type
-endif-comment
EOF
```

### 2. Run Lint Checks

```bash
# Run Verible lint
verible-verilog-lint --rules_config=.verible.rules src/*.sv

# Run with JSON output
verible-verilog-lint --rules_config=.verible.rules --format=json src/*.sv > lint.json
```

### 3. Review and Fix

```bash
# Auto-format code
verible-verilog-format --inplace src/*.sv

# Review remaining issues
cat lint.json | jq '.[] | select(.severity == "error")'
```

### 4. Apply Waivers

```bash
# Add waivers for known issues
# Document waiver reason in waivers.yaml
```

## Output Schema

```json
{
  "lintResults": {
    "summary": {
      "totalFiles": 25,
      "filesWithIssues": 8,
      "totalViolations": 42,
      "errors": 3,
      "warnings": 35,
      "info": 4,
      "waived": 5
    },
    "byRule": {
      "inferred-latch": {
        "count": 3,
        "severity": "error",
        "violations": [
          { "file": "src/fsm.sv", "line": 45, "message": "..." }
        ]
      },
      "line-length": {
        "count": 20,
        "severity": "warning",
        "violations": [...]
      }
    },
    "byFile": {
      "src/fsm.sv": {
        "errors": 2,
        "warnings": 5,
        "violations": [...]
      }
    }
  },
  "waivers": [
    { "rule": "multi-bit-cdc", "instance": "fifo/ptr", "reason": "Gray coded" }
  ],
  "recommendations": [
    "Fix 3 errors before synthesis",
    "Review 35 warnings for code quality",
    "Consider enabling additional rules for CDC"
  ],
  "artifacts": [
    "reports/lint_summary.txt",
    "reports/lint_details.json",
    "waivers/approved_waivers.yaml"
  ]
}
```

## Common Lint Rules

### Critical (Must Fix)

| Rule | Description |
|------|-------------|
| inferred-latch | Incomplete combinational assignment |
| blocking-in-ff | Blocking assignment in always_ff |
| multi-bit-cdc | Unprotected multi-bit CDC |
| missing-reset | Register without reset |
| sensitivity-list | Incomplete sensitivity list |

### Warning (Should Fix)

| Rule | Description |
|------|-------------|
| line-length | Line exceeds maximum length |
| trailing-spaces | Trailing whitespace |
| no-tabs | Tab characters in source |
| unused-signal | Declared but unused signal |
| duplicate-condition | Same condition in if/case |

### Style (Recommended)

| Rule | Description |
|------|-------------|
| naming-convention | Signal/module naming |
| explicit-width | Explicit bit widths |
| port-order | Port declaration order |
| comment-style | Comment formatting |

## Best Practices

### Lint Integration
- Run lint in CI/CD pipeline
- Block merge on errors
- Track warning trends
- Review waivers periodically

### Code Quality
- Fix errors immediately
- Address warnings systematically
- Use autoformat for style
- Document intentional deviations

### Waiver Management
- Require waiver justification
- Review waivers in code review
- Audit waivers quarterly
- Remove stale waivers

## References

- Verible Documentation: https://chipsalliance.github.io/verible/
- SpyGlass User Guide
- Xilinx UG901: Vivado Synthesis (DRC)
- Intel Quartus Prime Lint Guidelines

## See Also

- `verilog-systemverilog-design.js` - Verilog/SV development
- `synthesis-optimization.js` - Synthesis preparation
- SK-005: CDC Analysis skill
- AG-001: RTL Design Expert agent
