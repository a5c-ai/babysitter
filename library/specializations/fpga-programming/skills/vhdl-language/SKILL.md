---
name: vhdl-language
description: Deep expertise in VHDL language constructs, IEEE 1076 standard compliance, and synthesis coding guidelines. Expert skill for generating synthesizable VHDL code.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob
---

# VHDL Language Skill

Expert skill for VHDL (VHSIC Hardware Description Language) development following IEEE 1076 standards. Provides deep expertise in synthesizable VHDL code generation, coding guidelines, and best practices for FPGA design.

## Overview

The VHDL Language skill enables comprehensive VHDL development for FPGA and ASIC designs, supporting:
- IEEE 1076-2019 standard compliance
- Synthesizable code generation
- Entity, architecture, package, and component declarations
- Synchronous process design with proper reset handling
- Vendor-specific synthesis attributes
- Testbench generation with assert statements
- Detection and fix of common coding anti-patterns

## Capabilities

### 1. Entity and Architecture Definition

Generate proper entity and architecture structures:

```vhdl
-- Example: Parameterized FIFO Entity
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity sync_fifo is
  generic (
    DATA_WIDTH : positive := 8;
    DEPTH      : positive := 16;
    ALMOST_FULL_THRESHOLD  : natural := 14;
    ALMOST_EMPTY_THRESHOLD : natural := 2
  );
  port (
    clk           : in  std_logic;
    rst_n         : in  std_logic;
    -- Write interface
    wr_en         : in  std_logic;
    wr_data       : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    full          : out std_logic;
    almost_full   : out std_logic;
    -- Read interface
    rd_en         : in  std_logic;
    rd_data       : out std_logic_vector(DATA_WIDTH-1 downto 0);
    empty         : out std_logic;
    almost_empty  : out std_logic;
    -- Status
    fill_level    : out unsigned(clog2(DEPTH) downto 0)
  );
end entity sync_fifo;

architecture rtl of sync_fifo is
  -- Type declarations
  type ram_type is array (0 to DEPTH-1) of std_logic_vector(DATA_WIDTH-1 downto 0);

  -- Signal declarations
  signal ram       : ram_type := (others => (others => '0'));
  signal wr_ptr    : unsigned(clog2(DEPTH)-1 downto 0) := (others => '0');
  signal rd_ptr    : unsigned(clog2(DEPTH)-1 downto 0) := (others => '0');
  signal count     : unsigned(clog2(DEPTH) downto 0) := (others => '0');

  -- Function for ceiling log2
  function clog2(n : positive) return natural is
    variable result : natural := 0;
    variable value  : natural := n - 1;
  begin
    while value > 0 loop
      result := result + 1;
      value := value / 2;
    end loop;
    return result;
  end function clog2;

begin
  -- Architecture implementation
end architecture rtl;
```

### 2. Synchronous Process Design

Implement synchronous processes with proper reset handling:

```vhdl
-- Synchronous process with asynchronous reset
process(clk, rst_n)
begin
  if rst_n = '0' then
    -- Asynchronous reset - initialize all registers
    wr_ptr <= (others => '0');
    rd_ptr <= (others => '0');
    count  <= (others => '0');
  elsif rising_edge(clk) then
    -- Synchronous logic
    if wr_en = '1' and full_i = '0' then
      ram(to_integer(wr_ptr)) <= wr_data;
      wr_ptr <= wr_ptr + 1;
    end if;

    if rd_en = '1' and empty_i = '0' then
      rd_ptr <= rd_ptr + 1;
    end if;

    -- Update count
    if (wr_en = '1' and full_i = '0') and not (rd_en = '1' and empty_i = '0') then
      count <= count + 1;
    elsif not (wr_en = '1' and full_i = '0') and (rd_en = '1' and empty_i = '0') then
      count <= count - 1;
    end if;
  end if;
end process;

-- Synchronous process with synchronous reset
process(clk)
begin
  if rising_edge(clk) then
    if sync_rst = '1' then
      -- Synchronous reset
      state <= IDLE;
      counter <= (others => '0');
    else
      -- Normal operation
      state <= next_state;
      counter <= counter + 1;
    end if;
  end if;
end process;
```

### 3. Package and Component Declarations

Create reusable packages and components:

```vhdl
-- Package declaration
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

package fpga_utils_pkg is
  -- Constants
  constant CLK_FREQ_HZ : natural := 100_000_000;

  -- Type definitions
  type axi_lite_master_t is record
    awaddr  : std_logic_vector(31 downto 0);
    awvalid : std_logic;
    wdata   : std_logic_vector(31 downto 0);
    wstrb   : std_logic_vector(3 downto 0);
    wvalid  : std_logic;
    bready  : std_logic;
    araddr  : std_logic_vector(31 downto 0);
    arvalid : std_logic;
    rready  : std_logic;
  end record axi_lite_master_t;

  constant AXI_LITE_MASTER_INIT : axi_lite_master_t := (
    awaddr  => (others => '0'),
    awvalid => '0',
    wdata   => (others => '0'),
    wstrb   => (others => '0'),
    wvalid  => '0',
    bready  => '0',
    araddr  => (others => '0'),
    arvalid => '0',
    rready  => '0'
  );

  -- Function declarations
  function clog2(n : positive) return natural;
  function max(a, b : integer) return integer;
  function min(a, b : integer) return integer;

  -- Component declarations
  component sync_fifo is
    generic (
      DATA_WIDTH : positive := 8;
      DEPTH      : positive := 16
    );
    port (
      clk     : in  std_logic;
      rst_n   : in  std_logic;
      wr_en   : in  std_logic;
      wr_data : in  std_logic_vector(DATA_WIDTH-1 downto 0);
      full    : out std_logic;
      rd_en   : in  std_logic;
      rd_data : out std_logic_vector(DATA_WIDTH-1 downto 0);
      empty   : out std_logic
    );
  end component sync_fifo;

end package fpga_utils_pkg;

-- Package body
package body fpga_utils_pkg is

  function clog2(n : positive) return natural is
    variable result : natural := 0;
    variable value  : natural := n - 1;
  begin
    while value > 0 loop
      result := result + 1;
      value := value / 2;
    end loop;
    return result;
  end function clog2;

  function max(a, b : integer) return integer is
  begin
    if a > b then return a; else return b; end if;
  end function max;

  function min(a, b : integer) return integer is
  begin
    if a < b then return a; else return b; end if;
  end function min;

end package body fpga_utils_pkg;
```

### 4. Vendor-Specific Synthesis Attributes

Apply synthesis directives for Xilinx and Intel:

```vhdl
-- Xilinx synthesis attributes
architecture rtl of my_design is
  -- ASYNC_REG for synchronizers
  signal sync_reg : std_logic_vector(1 downto 0);
  attribute ASYNC_REG : string;
  attribute ASYNC_REG of sync_reg : signal is "TRUE";

  -- Keep hierarchy for debugging
  attribute KEEP_HIERARCHY : string;
  attribute KEEP_HIERARCHY of rtl : architecture is "YES";

  -- RAM style control
  signal block_ram : ram_type;
  attribute RAM_STYLE : string;
  attribute RAM_STYLE of block_ram : signal is "block";

  signal dist_ram : small_ram_type;
  attribute RAM_STYLE of dist_ram : signal is "distributed";

  -- Register duplication for fanout
  signal high_fanout_reg : std_logic;
  attribute MAX_FANOUT : integer;
  attribute MAX_FANOUT of high_fanout_reg : signal is 50;

  -- FSM encoding
  type state_type is (IDLE, RUNNING, DONE);
  signal state : state_type;
  attribute FSM_ENCODING : string;
  attribute FSM_ENCODING of state : signal is "one_hot";

begin
  -- Implementation
end architecture rtl;

-- Intel/Altera synthesis attributes
architecture rtl of my_design is
  -- RAM inference control
  signal ram : ram_type;
  attribute ramstyle : string;
  attribute ramstyle of ram : signal is "M20K";

  -- Preserve signal
  signal debug_sig : std_logic;
  attribute preserve : boolean;
  attribute preserve of debug_sig : signal is true;

begin
  -- Implementation
end architecture rtl;
```

### 5. Numeric_std Best Practices

Use numeric_std library correctly (avoid std_logic_arith):

```vhdl
-- CORRECT: Using numeric_std
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;  -- Preferred library

architecture rtl of example is
  signal counter : unsigned(7 downto 0);
  signal signed_val : signed(15 downto 0);
begin
  -- Arithmetic with unsigned
  counter <= counter + 1;
  counter <= counter + to_unsigned(10, counter'length);

  -- Conversion from std_logic_vector
  counter <= unsigned(input_slv);

  -- Conversion to std_logic_vector
  output_slv <= std_logic_vector(counter);

  -- Resize operations
  wide_counter <= resize(counter, wide_counter'length);

  -- Comparison
  if counter > 100 then
    -- ...
  end if;
end architecture rtl;

-- INCORRECT: Avoid std_logic_arith (deprecated)
-- library IEEE;
-- use IEEE.std_logic_arith.all;  -- DO NOT USE
-- use IEEE.std_logic_unsigned.all;  -- DO NOT USE
```

### 6. Testbench Generation

Generate comprehensive testbenches:

```vhdl
-- Testbench example
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity sync_fifo_tb is
end entity sync_fifo_tb;

architecture sim of sync_fifo_tb is
  constant CLK_PERIOD : time := 10 ns;
  constant DATA_WIDTH : positive := 8;
  constant DEPTH      : positive := 16;

  signal clk     : std_logic := '0';
  signal rst_n   : std_logic := '0';
  signal wr_en   : std_logic := '0';
  signal wr_data : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal full    : std_logic;
  signal rd_en   : std_logic := '0';
  signal rd_data : std_logic_vector(DATA_WIDTH-1 downto 0);
  signal empty   : std_logic;

  signal sim_done : boolean := false;

begin
  -- Clock generation
  clk <= not clk after CLK_PERIOD/2 when not sim_done else '0';

  -- DUT instantiation
  dut : entity work.sync_fifo
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      DEPTH      => DEPTH
    )
    port map (
      clk     => clk,
      rst_n   => rst_n,
      wr_en   => wr_en,
      wr_data => wr_data,
      full    => full,
      rd_en   => rd_en,
      rd_data => rd_data,
      empty   => empty
    );

  -- Stimulus process
  stim_proc : process
    variable expected_data : std_logic_vector(DATA_WIDTH-1 downto 0);
  begin
    -- Reset
    rst_n <= '0';
    wait for CLK_PERIOD * 5;
    rst_n <= '1';
    wait for CLK_PERIOD * 2;

    -- Test 1: Write single word
    report "Test 1: Write single word";
    wr_data <= x"A5";
    wr_en <= '1';
    wait for CLK_PERIOD;
    wr_en <= '0';
    wait for CLK_PERIOD;

    assert empty = '0'
      report "FIFO should not be empty after write"
      severity error;

    -- Test 2: Read single word
    report "Test 2: Read single word";
    rd_en <= '1';
    wait for CLK_PERIOD;
    rd_en <= '0';

    assert rd_data = x"A5"
      report "Read data mismatch: expected 0xA5, got " &
             to_hstring(rd_data)
      severity error;

    wait for CLK_PERIOD;
    assert empty = '1'
      report "FIFO should be empty after read"
      severity error;

    -- Test 3: Fill FIFO to full
    report "Test 3: Fill FIFO to full";
    for i in 0 to DEPTH-1 loop
      wr_data <= std_logic_vector(to_unsigned(i, DATA_WIDTH));
      wr_en <= '1';
      wait for CLK_PERIOD;
    end loop;
    wr_en <= '0';

    assert full = '1'
      report "FIFO should be full"
      severity error;

    -- Test complete
    report "All tests passed!" severity note;
    sim_done <= true;
    wait;
  end process stim_proc;

end architecture sim;
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `vhdl-module-development.js` | Primary skill for VHDL coding |
| `testbench-development.js` | VHDL testbench generation |
| `rtl-module-architecture.js` | Architecture design in VHDL |
| `functional-simulation.js` | VHDL simulation support |

## Workflow

### 1. Analyze Requirements

```markdown
## Design Requirements Analysis

| Parameter | Value | Notes |
|-----------|-------|-------|
| Clock frequency | 100 MHz | Single clock domain |
| Data width | 32 bits | AXI-compatible |
| Latency | 2 cycles | Pipeline register |
| Reset type | Async active-low | Standard practice |
```

### 2. Generate Module Structure

```bash
# Output files generated:
# - src/<module_name>.vhd      - Main entity and architecture
# - src/<module_name>_pkg.vhd  - Package with types/constants
# - tb/<module_name>_tb.vhd    - Testbench
```

### 3. Validate Code

```bash
# Analyze with GHDL
ghdl -a --std=08 src/module.vhd
ghdl -a --std=08 tb/module_tb.vhd

# Run simulation
ghdl -e --std=08 module_tb
ghdl -r --std=08 module_tb --wave=wave.ghw

# Lint with Verible (if SystemVerilog) or vendor tools
```

## Output Schema

```json
{
  "vhdlModule": {
    "entity": "sync_fifo",
    "architecture": "rtl",
    "generics": [
      { "name": "DATA_WIDTH", "type": "positive", "default": 8 },
      { "name": "DEPTH", "type": "positive", "default": 16 }
    ],
    "ports": [
      { "name": "clk", "direction": "in", "type": "std_logic" },
      { "name": "rst_n", "direction": "in", "type": "std_logic" },
      { "name": "wr_en", "direction": "in", "type": "std_logic" },
      { "name": "wr_data", "direction": "in", "type": "std_logic_vector(DATA_WIDTH-1 downto 0)" }
    ]
  },
  "package": {
    "name": "fpga_utils_pkg",
    "types": ["axi_lite_master_t"],
    "constants": ["CLK_FREQ_HZ"],
    "functions": ["clog2", "max", "min"]
  },
  "testbench": {
    "entity": "sync_fifo_tb",
    "testCases": ["reset", "single_write", "single_read", "fill_full", "overflow"]
  },
  "compliance": {
    "standard": "IEEE 1076-2008",
    "synthesizable": true,
    "lintClean": true
  },
  "artifacts": [
    "src/sync_fifo.vhd",
    "src/fpga_utils_pkg.vhd",
    "tb/sync_fifo_tb.vhd"
  ]
}
```

## Common Anti-Patterns and Fixes

### Incomplete Sensitivity List

```vhdl
-- INCORRECT: Missing signals in sensitivity list
process(clk)  -- Missing rst_n
begin
  if rst_n = '0' then
    reg <= '0';
  elsif rising_edge(clk) then
    reg <= input;
  end if;
end process;

-- CORRECT: Complete sensitivity list
process(clk, rst_n)  -- Both clk and rst_n included
begin
  if rst_n = '0' then
    reg <= '0';
  elsif rising_edge(clk) then
    reg <= input;
  end if;
end process;
```

### Inferred Latch

```vhdl
-- INCORRECT: Latch inference (incomplete if-else)
process(sel, a, b)
begin
  if sel = '1' then
    output <= a;
  end if;  -- Missing else clause creates latch
end process;

-- CORRECT: Complete combinational logic
process(sel, a, b)
begin
  if sel = '1' then
    output <= a;
  else
    output <= b;  -- All paths covered
  end if;
end process;

-- ALTERNATIVE: Use selected signal assignment
output <= a when sel = '1' else b;
```

## Best Practices

### Coding Style
- Use lowercase for keywords, mixed case for identifiers
- One port/signal per line for readability
- Align port declarations vertically
- Use meaningful signal and process names
- Include comments for complex logic

### Synthesis Guidelines
- Always use numeric_std, never std_logic_arith
- Ensure all clocked processes have reset
- Use rising_edge() instead of clk'event and clk='1'
- Apply ASYNC_REG attribute to synchronizers
- Control RAM inference with attributes

### Safety
- Use ASSERT statements for design checking
- Initialize signals with default values
- Document all constraints and assumptions
- Review synthesis warnings carefully

## References

- IEEE Std 1076-2019 (VHDL Language Reference Manual)
- GHDL Documentation: https://ghdl.github.io/ghdl/
- Xilinx UG901: Vivado Synthesis Guide
- Intel Quartus Prime Synthesis Reference

## See Also

- `vhdl-module-development.js` - VHDL development process
- `testbench-development.js` - Testbench development
- SK-002: Verilog/SystemVerilog Language skill
- AG-001: RTL Design Expert agent
