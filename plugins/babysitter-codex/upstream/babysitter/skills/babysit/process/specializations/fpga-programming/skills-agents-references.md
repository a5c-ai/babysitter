# FPGA Programming - Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, MCP servers, and related tools that can support the FPGA Programming specialization processes. These resources align with the skills and agents identified in the backlog document.

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Servers for EDA/FPGA](#mcp-servers-for-edafpga)
3. [HDL Parsers and Language Tools](#hdl-parsers-and-language-tools)
4. [Simulation and Verification Tools](#simulation-and-verification-tools)
5. [Synthesis and Implementation Tools](#synthesis-and-implementation-tools)
6. [Formal Verification Tools](#formal-verification-tools)
7. [Build Systems and Package Managers](#build-systems-and-package-managers)
8. [IDE Extensions and Development Tools](#ide-extensions-and-development-tools)
9. [Hardware/PCB Design Tools](#hardwarepcb-design-tools)
10. [Resource Collections](#resource-collections)
11. [Skill/Agent Mapping to Resources](#skillagent-mapping-to-resources)
12. [Summary Statistics](#summary-statistics)

---

## Overview

### Search Scope
Resources were gathered from:
- GitHub topics: claude-skills, claude-code
- Curated lists: awesome-claude-skills, awesome-claude-code-plugins, awesome-mcp-servers
- Domain-specific searches for FPGA, Verilog, VHDL, SystemVerilog, Vivado, Quartus, HLS tools

### Key Findings
- **MCP servers for EDA tools exist** and are actively developed (MCP4EDA, fpga-mcp-servers, mcp4eda collection)
- **No dedicated Claude skills** currently exist for FPGA/HDL development
- **Strong open-source ecosystem** exists for HDL tools that can be integrated via MCP
- **Vendor-specific integrations** are limited; most tools target open-source synthesis (Yosys) and simulation (Icarus, Verilator, GHDL)

---

## MCP Servers for EDA/FPGA

### MCP4EDA (NellyW8)
**Repository**: https://github.com/NellyW8/MCP4EDA
**Status**: Active
**Description**: Comprehensive MCP server for EDA tools integration with Claude Desktop and Cursor IDE. Associated with the research paper "MCP4EDA: LLM-Powered Model Context Protocol RTL-to-GDSII Automation with Backend Aware Synthesis Optimization."

**Capabilities**:
- Verilog synthesis using Yosys (generic, ice40, xilinx targets)
- Verilog simulation using Icarus Verilog
- Waveform viewing with GTKWave
- ASIC design flow with OpenLane (Docker)
- Layout viewing with KLayout
- Report analysis for PPA metrics

**Relevant Skills**: SK-009 (Synthesis), SK-016 (Simulation), SK-002 (Verilog/SV)
**Relevant Agents**: AG-007 (Synthesis Expert), AG-003 (Verification Expert)

---

### mcp4eda Collection (ssql2014)
**Repository**: https://github.com/ssql2014/mcp4eda
**Status**: Active
**Description**: Collection of 8 MCP servers for EDA workflows with natural language interfaces.

**Included Servers**:
| Server | Purpose |
|--------|---------|
| yosys-mcp | RTL synthesis |
| verilator-mcp | RTL simulation with auto-testbench generation |
| verible-mcp | SystemVerilog linting and formatting |
| gtkwave-mcp | Waveform analysis |
| klayout-mcp | Layout viewing |
| openlane-mcp | ASIC flow |
| anysilicon | Silicon services |
| semiconductor-supply-chain-mcp | B2B platforms |

**Key Features**:
- Natural language queries ("Synthesize my design for Xilinx FPGA")
- Automatic testbench generation
- Smart simulation with dependency management

**Relevant Skills**: SK-002, SK-009, SK-016, SK-018
**Relevant Agents**: AG-007, AG-003, AG-001

---

### Verilator MCP Server (ssql2014)
**Repository**: https://github.com/ssql2014/verilator-mcp
**Status**: Active
**Description**: Intelligent MCP server for Verilator RTL simulation.

**Features**:
- Automatic testbench generation
- Smart simulation compilation
- Natural language queries about simulations
- Waveform analysis and generation

**Requirements**: Verilator 5.0+

**Relevant Skills**: SK-016 (HDL Simulation)
**Relevant Agents**: AG-003 (Verification Expert)

---

### fpga-mcp-servers (abbbe)
**Repository**: https://github.com/abbbe/fpga-mcp-servers
**Status**: Active
**Description**: MCP servers for Intel Quartus FPGA builds and DE10-Nano board management.

**Components**:
1. **Quartus MCP Server**
   - `quartus_build_async()` - Background build (20-45 min)
   - `quartus_task_status()` - Progress checking
   - `quartus_task_wait()` - Wait for completion

2. **DE10-Nano MCP Server**
   - `fpga_deploy` - Deploy bitstream to board
   - `sw_sync` - Sync software to board

**Target**: Intel/Altera Cyclone V SoC

**Relevant Skills**: SK-009 (Synthesis)
**Relevant Agents**: AG-012 (Intel/Altera Specialist), AG-009 (Debug Expert)

---

## HDL Parsers and Language Tools

### Verible
**Repository**: https://github.com/chipsalliance/verible
**Documentation**: https://chipsalliance.github.io/verible/
**License**: Apache-2.0
**Description**: Suite of SystemVerilog developer tools from CHIPS Alliance.

**Components**:
| Tool | Purpose |
|------|---------|
| verible-verilog-lint | Style linting |
| verible-verilog-format | Code formatting |
| verible-verilog-ls | Language server |
| verible-verilog-diff | Code comparison |
| verible-verilog-obfuscate | Identifier obfuscation |

**Supported Standard**: IEEE 1800-2017 (SystemVerilog)

**Relevant Skills**: SK-018 (RTL Linting), SK-002 (Verilog/SV)
**Relevant Agents**: AG-001 (RTL Design Expert)

---

### hdlConvertor
**Repository**: https://github.com/Nic30/hdlConvertor
**PyPI**: https://pypi.org/project/hdlConvertor/
**License**: MIT
**Description**: Fast Verilog/VHDL parser, preprocessor, and code generator using ANTLR4.

**Capabilities**:
- Parse VHDL (IEEE 1076-2008) and SystemVerilog (IEEE 1800-2017)
- Universal HDL AST conversion
- Export to SV/VHDL/JSON
- HdlAstVisitor for AST manipulation
- ID resolution and sensitivity detection

**Language Bindings**: C++, Python

**Relevant Skills**: SK-001 (VHDL), SK-002 (Verilog/SV)
**Relevant Agents**: AG-001 (RTL Design Expert)

---

### VS Code Verilog HDL Support
**Repository**: https://github.com/mshr-h/vscode-verilog-hdl-support
**Description**: HDL support extension for VS Code.

**Features**:
- Multiple language server support (Verilator, Icarus, etc.)
- Syntax highlighting
- Linting integration

**Relevant Skills**: SK-018 (RTL Linting)
**Relevant Agents**: AG-001 (RTL Design Expert)

---

## Simulation and Verification Tools

### Icarus Verilog
**Website**: http://iverilog.icarus.com/
**Description**: Open source Verilog analyzer, compiler, and simulator.

**Features**:
- Full Verilog HDL (IEEE-1364) support
- VPI support for co-simulation
- Testbench support for behavioral constructs

**Relevant Skills**: SK-016 (HDL Simulation)
**Relevant Agents**: AG-003 (Verification Expert)

---

### Verilator
**Repository**: https://github.com/verilator/verilator
**Documentation**: https://verilator.org/
**License**: LGPL-3.0
**Description**: Fastest Verilog/SystemVerilog simulator.

**Features**:
- Compiles HDL to multithreaded C++/SystemC
- Built-in lint checks
- High-performance for large synthesizable designs
- Assertion checks and coverage analysis

**Requirements**: Synthesizable subset of Verilog/SystemVerilog

**Relevant Skills**: SK-016 (Simulation), SK-018 (RTL Linting)
**Relevant Agents**: AG-003 (Verification Expert)

---

### GHDL
**Repository**: https://github.com/ghdl/ghdl
**Documentation**: https://ghdl.github.io/ghdl/
**License**: GPL-2.0
**Description**: Open source VHDL analyzer, compiler, and simulator.

**Features**:
- Full VHDL standard support (87, 93, 02, 08)
- Partial PSL support
- Multiple backends (GCC, LLVM, mcode)
- Waveform export (GHW, VCD, FST)
- Synthesis via ghdl-yosys-plugin

**Relevant Skills**: SK-001 (VHDL), SK-016 (Simulation)
**Relevant Agents**: AG-003 (Verification Expert)

---

### cocotb
**Repository**: https://github.com/cocotb/cocotb
**Website**: https://www.cocotb.org/
**Documentation**: https://docs.cocotb.org/
**License**: BSD
**Description**: Python-based RTL verification framework.

**Advantages**:
- Write testbenches in Python (not SV/VHDL)
- Supports all major simulators
- Large ecosystem of Python libraries
- No HDL recompilation for test changes
- Hardware-in-the-loop capable

**Simulator Support**: Icarus, Verilator, GHDL, ModelSim, Questa, VCS, Xcelium, Vivado

**Relevant Skills**: SK-016 (Simulation), SK-007 (UVM alternative)
**Relevant Agents**: AG-003 (Verification Expert)

---

### VUnit
**Repository**: https://github.com/VUnit/vunit
**Website**: https://vunit.github.io/
**Description**: Open source unit testing framework for VHDL/SystemVerilog.

**Features**:
- Continuous and automated HDL testing
- CI/CD integration
- Verification libraries
- Multiple simulator support

**Relevant Skills**: SK-016 (Simulation)
**Relevant Agents**: AG-003 (Verification Expert)

---

## Synthesis and Implementation Tools

### Yosys Open SYnthesis Suite
**Repository**: https://github.com/YosysHQ/yosys
**Website**: https://yosyshq.net/yosys/
**Documentation**: https://yosys.readthedocs.io/
**License**: ISC
**Description**: Framework for RTL synthesis tools.

**Features**:
- Extensive Verilog-2005 support
- Export to BLIF/EDIF/BTOR/SMT-LIB
- Built-in formal methods
- ASIC standard cell mapping (Liberty)
- FPGA support: Xilinx 7-Series, Lattice iCE40/ECP5, Gowin

**Relevant Skills**: SK-009 (Synthesis)
**Relevant Agents**: AG-007 (Synthesis Expert)

---

### nextpnr
**Repository**: https://github.com/YosysHQ/nextpnr
**Description**: Portable FPGA place and route tool.

**Supported Architectures**:
- iCE40 (Project Icestorm)
- ECP5 (Project Trellis)
- Nexus (Project Oxide)
- Gowin (Project Apicula)

**Relevant Skills**: SK-010 (Place and Route)
**Relevant Agents**: AG-007 (Synthesis Expert)

---

### OpenLane
**Repository**: https://github.com/The-OpenROAD-Project/OpenLane
**Description**: Automated RTL-to-GDSII flow for ASIC design.

**Flow Components**:
- Synthesis (Yosys)
- Floorplanning
- Placement
- Clock Tree Synthesis
- Routing
- GDSII generation

**Relevant Skills**: SK-009 (Synthesis), SK-010 (Place and Route)
**Relevant Agents**: AG-007 (Synthesis Expert)

---

## Formal Verification Tools

### SymbiYosys (sby)
**Repository**: https://github.com/YosysHQ/sby
**Documentation**: https://yosyshq.readthedocs.io/projects/sby/
**License**: ISC
**Description**: Front-end for Yosys-based formal hardware verification flows.

**Features**:
- Bounded model checking
- Property verification
- Equivalence checking
- Multiple solver support (Boolector, Yices2, Z3)

**Use Cases**:
- Assertion checking
- Cover statements
- Equivalence verification

**Relevant Skills**: SK-017 (Formal Verification), SK-003 (SVA)
**Relevant Agents**: AG-003 (Verification Expert), AG-004 (CDC Expert)

---

### RISC-V Formal
**Repository**: https://github.com/YosysHQ/riscv-formal
**Description**: Formal verification framework for RISC-V CPU designs.

**Features**:
- Reusable verification components
- SymbiYosys integration
- Immediate assertions/assumptions

**Relevant Skills**: SK-017 (Formal Verification)
**Relevant Agents**: AG-003 (Verification Expert)

---

## Build Systems and Package Managers

### FuseSoC
**Repository**: https://github.com/olofk/fusesoc
**Documentation**: https://fusesoc.readthedocs.io/
**License**: BSD-2-Clause
**Description**: Package manager and build abstraction tool for FPGA/ASIC development.

**Features**:
- IP core package management
- Multi-platform (Linux, Windows, macOS)
- Large ecosystem of available IP cores
- Simulation and synthesis flow orchestration

**Relevant Skills**: SK-015 (IP Core Management)
**Relevant Agents**: AG-006 (FPGA Architect)

---

### Edalize
**Repository**: https://github.com/olofk/edalize
**Description**: EDA tool abstraction library.

**Supported Tools**:
- Xilinx Vivado
- Intel Quartus
- Verilator
- ModelSim
- GHDL
- Icarus Verilog
- And many more

**Features**:
- Unified interface to multiple EDA tools
- Flow and tool APIs
- Synthesis and simulation support

**Relevant Skills**: SK-015 (IP Core Management), SK-016 (Simulation)
**Relevant Agents**: AG-011 (Xilinx Specialist), AG-012 (Intel Specialist)

---

### F4PGA
**Website**: https://f4pga.org/
**Description**: Open source FPGA toolchain (the "GCC of FPGAs").

**Features**:
- Complete open source FPGA flow
- Multi-vendor support
- Automated workflows

**Relevant Skills**: SK-009 (Synthesis), SK-010 (Place and Route)
**Relevant Agents**: AG-007 (Synthesis Expert)

---

## IDE Extensions and Development Tools

### TerosHDL
**Repository**: https://github.com/TerosTechnology/vscode-terosHDL
**Website**: https://terostechnology.github.io/terosHDLdoc/
**License**: GPL-3.0
**Description**: Open source IDE for FPGA/ASIC development.

**Features**:
| Feature | Description |
|---------|-------------|
| Syntax highlighting | VHDL, Verilog, SystemVerilog |
| Go to definition | Cross-file navigation |
| Hierarchy viewer | Design hierarchy visualization |
| Dependencies viewer | File dependency analysis |
| Template generator | Code scaffolding |
| Auto documentation | Generate docs from code |
| Schematic viewer | Verilog/SV schematic generation |
| Error linter | Real-time error detection |
| State machine viewer | FSM visualization |

**Supported Tools**:
Vivado, ModelSim, GHDL, Verilator, Icarus, VCS, Yosys, VUnit, cocotb, Quartus, Spyglass, Xcelium, and more.

**Relevant Skills**: SK-018 (RTL Linting), SK-013 (FSM Design)
**Relevant Agents**: AG-001 (RTL Design Expert)

---

## Hardware/PCB Design Tools

### KiCad MCP Servers
Multiple MCP server implementations for KiCad PCB design:

| Repository | Description |
|------------|-------------|
| [mixelpixx/KiCAD-MCP-Server](https://github.com/mixelpixx/KiCAD-MCP-Server) | 47 routed tools, JLCPCB integration |
| [lamaalrajih/kicad-mcp](https://github.com/lamaalrajih/kicad-mcp) | Cross-platform, DRC support |
| [Finerestaurant/kicad-mcp-python](https://github.com/Finerestaurant/kicad-mcp-python) | Official KiCad IPC-API |

**Features**:
- Project management
- PCB design analysis
- Netlist extraction
- BOM management
- Design rule checking

**Relevance**: Integration with FPGA development boards and hardware co-design

---

### awesome-mcp-hardware
**Repository**: https://github.com/beriberikix/awesome-mcp-hardware
**Description**: Curated list of MCP servers for hardware interaction.

**Notable Servers**:
| Server | Purpose |
|--------|---------|
| tinymcp | LLM control of embedded devices |
| embedded-debugger-mcp | Embedded debugging with probe-rs |
| mcp2serial | Hardware control via serial/MCP |
| kicad-sch-api | KiCAD schematic file access |
| IoT-Edge-MCP-Server | Industrial IoT/SCADA/PLC |

**Relevance**: Hardware-in-the-loop testing, embedded FPGA systems

---

## Resource Collections

### Awesome Open Source Hardware
**Repository**: https://github.com/aolofsson/awesome-opensource-hardware
**Description**: Curated list of open source hardware tools, generators, and designs.

**Categories**:
- Analog/mixed-signal
- FPGA tools
- HDL tools
- Verification

---

### Open Source FPGA Resource
**Repository**: https://github.com/os-fpga/open-source-fpga-resource
**Description**: Resources from The Open-Source FPGA Foundation.

**Includes**:
- VTR (Verilog-to-Routing)
- SymbiFlow toolchain
- FPGA architecture research tools

---

### Awesome HDL
**Website**: https://hdl.github.io/awesome/
**Description**: Comprehensive HDL tools and resources list.

**Categories**:
- Editors and IDEs
- Linters
- Simulators
- Synthesis
- Verification
- Documentation

---

### Awesome Open Hardware Verification
**Repository**: https://github.com/ben-marshall/awesome-open-hardware-verification
**Description**: Free and open source hardware verification tools and frameworks.

---

## Skill/Agent Mapping to Resources

### Skills to Resource Mapping

| Skill ID | Skill Name | Primary Resources |
|----------|------------|-------------------|
| SK-001 | VHDL Language | GHDL, hdlConvertor, TerosHDL |
| SK-002 | Verilog/SystemVerilog | Verible, hdlConvertor, mcp4eda |
| SK-003 | SVA Assertions | SymbiYosys, Verilator |
| SK-004 | Timing Constraints | Vivado TCL scripts, Edalize |
| SK-005 | CDC Analysis | SymbiYosys |
| SK-006 | HLS C/C++ to RTL | (Limited open-source support) |
| SK-007 | UVM Methodology | cocotb (Python alternative) |
| SK-008 | AXI Protocol | FuseSoC IP cores |
| SK-009 | Synthesis Optimization | Yosys, MCP4EDA, mcp4eda |
| SK-010 | Place and Route | nextpnr, OpenLane |
| SK-011 | FPGA Debugging | (Vendor tools via Edalize) |
| SK-012 | Memory Interfaces | FuseSoC IP cores |
| SK-013 | FSM Design | TerosHDL (FSM viewer) |
| SK-014 | Power Analysis | (Limited open-source) |
| SK-015 | IP Core Management | FuseSoC, Edalize |
| SK-016 | HDL Simulation | Verilator MCP, cocotb, VUnit, MCP4EDA |
| SK-017 | Formal Verification | SymbiYosys, riscv-formal |
| SK-018 | RTL Linting | Verible MCP, TerosHDL |

### Agents to Resource Mapping

| Agent ID | Agent Name | Primary Resources |
|----------|------------|-------------------|
| AG-001 | RTL Design Expert | Verible, hdlConvertor, TerosHDL |
| AG-002 | FPGA Timing Expert | Vivado TCL, Edalize |
| AG-003 | Verification Expert | cocotb, VUnit, Verilator MCP, SymbiYosys |
| AG-004 | CDC Expert | SymbiYosys |
| AG-005 | HLS Expert | (Limited - Vitis HLS CLI) |
| AG-006 | FPGA Architect | FuseSoC, Awesome HDL resources |
| AG-007 | Synthesis Expert | Yosys, MCP4EDA, OpenLane |
| AG-008 | AXI Protocol Expert | FuseSoC cores |
| AG-009 | FPGA Debug Expert | fpga-mcp-servers (DE10-Nano) |
| AG-010 | Embedded FPGA Expert | fpga-mcp-servers, awesome-mcp-hardware |
| AG-011 | Xilinx/AMD Specialist | Edalize (Vivado backend), Vivado TCL |
| AG-012 | Intel/Altera Specialist | fpga-mcp-servers (Quartus MCP) |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| MCP Servers (EDA-specific) | 4 |
| MCP Servers (Hardware/PCB) | 5 |
| HDL Parsers/Language Tools | 3 |
| Simulation Tools | 5 |
| Synthesis Tools | 3 |
| Formal Verification Tools | 2 |
| Build Systems | 3 |
| IDE Extensions | 2 |
| Resource Collections | 4 |
| **Total References Found** | **31** |

### Coverage Analysis

| Area | Coverage | Notes |
|------|----------|-------|
| Open-source synthesis | Strong | Yosys, MCP4EDA well-supported |
| Open-source simulation | Strong | Multiple tools with MCP support |
| Formal verification | Good | SymbiYosys ecosystem |
| Intel/Quartus | Good | fpga-mcp-servers exists |
| Xilinx/Vivado | Limited | TCL scripts, no dedicated MCP |
| UVM | Poor | No MCP; cocotb as alternative |
| HLS | Poor | No open-source MCP servers |
| Commercial tools | Limited | Most MCP servers target open-source |

### Gaps Identified

1. **No dedicated Vivado MCP server** - Opportunity for community development
2. **No UVM-specific MCP server** - cocotb serves as Python alternative
3. **No HLS MCP server** - High-Level Synthesis lacks MCP integration
4. **No Claude skills for FPGA** - All references are MCP servers or standalone tools
5. **Limited commercial tool support** - Focus on open-source ecosystem

---

## Recommendations

### High Priority Integrations
1. **MCP4EDA** - Most comprehensive EDA MCP server
2. **mcp4eda (verilator-mcp, verible-mcp)** - Essential for simulation/linting
3. **fpga-mcp-servers** - Only Intel Quartus MCP available
4. **cocotb** - Python verification alternative to UVM

### Future Development Opportunities
1. Create Vivado-specific MCP server
2. Develop UVM workflow integration
3. Build HLS (Vitis HLS) MCP server
4. Integrate SymbiYosys formal verification MCP

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - References Compiled
**Next Step**: Integrate recommended MCP servers and tools into processes
