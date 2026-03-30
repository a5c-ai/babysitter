# FPGA Programming and Hardware Description - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the FPGA Programming processes beyond general-purpose capabilities. These tools would provide domain-specific expertise in hardware description languages, synthesis tools, timing analysis, and verification methodologies.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 25 implemented processes in this specialization currently use general-purpose agents for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for hardware design workflows.

### Goals
- Provide deep expertise in VHDL, Verilog, and SystemVerilog languages
- Enable automated RTL analysis, linting, and synthesis quality checks
- Reduce context-switching overhead for domain-specific FPGA tasks
- Improve accuracy of timing analysis, CDC verification, and resource estimation
- Support multiple FPGA vendors (Xilinx/AMD, Intel/Altera, Lattice, Microchip)

---

## Skills Backlog

### SK-001: VHDL Language Skill
**Slug**: `vhdl-language`
**Category**: Hardware Description Languages

**Description**: Deep expertise in VHDL language constructs, IEEE 1076 standard compliance, and synthesis coding guidelines.

**Capabilities**:
- Generate synthesizable VHDL code following IEEE 1076-2019
- Validate VHDL syntax and semantic correctness
- Apply numeric_std library best practices (avoid std_logic_arith)
- Generate entity, architecture, package, and component declarations
- Implement synchronous processes with proper reset handling
- Apply vendor-specific synthesis attributes (Xilinx, Intel)
- Detect and fix common VHDL coding anti-patterns
- Generate VHDL testbenches with assert statements

**Process Integration**:
- vhdl-module-development.js
- testbench-development.js
- rtl-module-architecture.js

**Dependencies**: VHDL parser/analyzer

---

### SK-002: Verilog/SystemVerilog Language Skill
**Slug**: `verilog-sv-language`
**Category**: Hardware Description Languages

**Description**: Expert-level Verilog and SystemVerilog knowledge following IEEE 1800 standards.

**Capabilities**:
- Generate synthesizable Verilog/SystemVerilog code
- Use always_ff, always_comb, always_latch correctly
- Implement SystemVerilog interfaces and modports
- Apply proper blocking vs non-blocking assignments
- Generate parameterized modules with localparam
- Implement packed/unpacked arrays correctly
- Generate SystemVerilog packages and imports
- Support both Verilog-2005 and SystemVerilog-2017

**Process Integration**:
- verilog-systemverilog-design.js
- testbench-development.js
- rtl-module-architecture.js

**Dependencies**: Verilog/SV parser

---

### SK-003: SystemVerilog Assertions (SVA) Skill
**Slug**: `sva-assertions`
**Category**: Verification

**Description**: Specialized skill for creating and debugging SystemVerilog assertions.

**Capabilities**:
- Write concurrent and immediate assertions
- Create property specifications and sequences
- Implement coverage properties (cover property)
- Create assume properties for formal verification
- Debug assertion failures with cause analysis
- Generate assertion bind files
- Optimize assertion performance
- Integrate assertions with formal tools

**Process Integration**:
- sva-development.js
- constrained-random-verification.js
- uvm-testbench.js
- verilog-systemverilog-design.js

**Dependencies**: SVA parser, formal verification tool awareness

---

### SK-004: Timing Constraints (SDC/XDC) Skill
**Slug**: `timing-constraints`
**Category**: Synthesis and Implementation

**Description**: Expert skill for developing and validating timing constraints.

**Capabilities**:
- Write SDC (Synopsys Design Constraints) files
- Generate Xilinx XDC constraint files
- Define create_clock and create_generated_clock
- Specify input_delay and output_delay constraints
- Identify and constrain false paths correctly
- Define multicycle path constraints with setup/hold
- Set clock groups and clock relationships
- Validate constraint coverage and correctness

**Process Integration**:
- timing-constraints.js
- timing-closure.js
- synthesis-optimization.js
- cdc-design.js

**Dependencies**: SDC parser, timing analyzer integration

---

### SK-005: Clock Domain Crossing (CDC) Skill
**Slug**: `cdc-analysis`
**Category**: Design Verification

**Description**: Specialized skill for CDC analysis and synchronizer design.

**Capabilities**:
- Identify all clock domain crossings in RTL
- Design 2FF and 3FF synchronizers with ASYNC_REG
- Implement Gray code counters for async FIFOs
- Design handshake protocols (req-ack, valid-ready)
- Calculate MTBF for synchronizers
- Generate CDC constraints (set_false_path, set_max_delay)
- Detect CDC violations (reconvergence, data stability)
- Support Xilinx CDC-aware design flows

**Process Integration**:
- cdc-design.js
- reset-strategy.js
- clock-network-design.js
- timing-constraints.js

**Dependencies**: CDC analysis tool integration

---

### SK-006: High-Level Synthesis (HLS) Skill
**Slug**: `hls-cpp-to-rtl`
**Category**: Hardware Acceleration

**Description**: Expert skill for C/C++ to RTL conversion using HLS tools.

**Capabilities**:
- Write HLS-synthesizable C/C++ code
- Apply Vitis HLS pragmas (PIPELINE, UNROLL, ARRAY_PARTITION)
- Optimize loop initiation interval (II)
- Configure HLS interface synthesis (AXI-MM, AXI-Stream, AXI-Lite)
- Analyze HLS reports and iterate on design
- Apply dataflow optimization
- Handle fixed-point arithmetic (ap_fixed, ap_int)
- Integrate HLS IP into Vivado block designs

**Process Integration**:
- hls-development.js
- hardware-software-codesign.js
- ip-core-integration.js

**Dependencies**: Vitis HLS CLI awareness

---

### SK-007: UVM Methodology Skill
**Slug**: `uvm-methodology`
**Category**: Verification

**Description**: Deep expertise in Universal Verification Methodology (IEEE 1800.2).

**Capabilities**:
- Generate UVM agent architecture (driver, monitor, sequencer)
- Create UVM environments and scoreboards
- Implement uvm_sequence and virtual sequences
- Configure UVM factory and config_db
- Implement functional coverage with covergroups
- Design UVM register models (RAL)
- Apply UVM phasing and objections correctly
- Debug UVM testbenches effectively

**Process Integration**:
- uvm-testbench.js
- constrained-random-verification.js
- testbench-development.js

**Dependencies**: UVM library knowledge

---

### SK-008: AXI Protocol Skill
**Slug**: `axi-protocol`
**Category**: Interface Design

**Description**: Expert skill for AMBA AXI protocol implementation and verification.

**Capabilities**:
- Implement AXI4, AXI4-Lite, and AXI4-Stream interfaces
- Design AXI masters, slaves, and interconnects
- Handle burst transactions (INCR, WRAP, FIXED)
- Implement proper valid/ready handshaking
- Design AXI address decoding and routing
- Create AXI VIP-based verification
- Optimize AXI performance and throughput
- Generate AXI protocol checkers

**Process Integration**:
- axi-interface-design.js
- ip-core-integration.js
- memory-interface-design.js
- hls-development.js

**Dependencies**: ARM AMBA specification knowledge

---

### SK-009: Synthesis Optimization Skill
**Slug**: `synthesis-optimization`
**Category**: Synthesis and Implementation

**Description**: Expertise in RTL optimization for synthesis tools.

**Capabilities**:
- Analyze synthesis reports and resource utilization
- Apply synthesis attributes (keep, max_fanout, ram_style)
- Guide DSP and BRAM inference
- Optimize FSM encoding (one-hot, binary, Gray)
- Apply retiming and register balancing
- Configure logic optimization strategies
- Reduce high-fanout nets
- Support Vivado and Quartus synthesis flows

**Process Integration**:
- synthesis-optimization.js
- timing-closure.js
- place-and-route.js
- pipeline-architecture.js

**Dependencies**: Synthesis tool CLI integration

---

### SK-010: Place and Route Skill
**Slug**: `place-and-route`
**Category**: Implementation

**Description**: Expert skill for FPGA place and route optimization.

**Capabilities**:
- Create floorplans for large designs
- Define Pblocks and placement constraints
- Analyze and resolve routing congestion
- Apply physical optimization directives
- Use incremental implementation flows
- Optimize for timing closure
- Analyze and fix timing violations
- Generate utilization and timing reports

**Process Integration**:
- place-and-route.js
- timing-closure.js
- clock-network-design.js

**Dependencies**: P&R tool awareness (Vivado, Quartus)

---

### SK-011: FPGA Debugging Skill
**Slug**: `fpga-debugging`
**Category**: Debug and Verification

**Description**: On-chip debugging with ILA, VIO, and related tools.

**Capabilities**:
- Insert Integrated Logic Analyzer (ILA) probes
- Configure trigger conditions and capture depth
- Design Virtual I/O (VIO) debug interfaces
- Analyze captured waveforms
- Use ChipScope/SignalTap for debugging
- Debug timing and functional issues in hardware
- Remove debug logic for production builds
- Configure JTAG and debug hub

**Process Integration**:
- fpga-on-chip-debugging.js
- functional-simulation.js
- design-for-testability.js

**Dependencies**: Debug tool CLI (hw_server, etc.)

---

### SK-012: Memory Interface Skill
**Slug**: `memory-interfaces`
**Category**: Interface Design

**Description**: Expert skill for on-chip and external memory interfaces.

**Capabilities**:
- Infer Block RAM correctly (read-first, write-first)
- Design distributed RAM and LUT RAM
- Configure ECC for memory protection
- Implement memory access controllers
- Interface with DDR memory controllers
- Optimize memory bandwidth utilization
- Design memory arbitration logic
- Handle memory initialization

**Process Integration**:
- memory-interface-design.js
- ip-core-integration.js
- hardware-software-codesign.js

**Dependencies**: Memory controller IP knowledge

---

### SK-013: FSM Design Skill
**Slug**: `fsm-design`
**Category**: RTL Design

**Description**: Specialized skill for finite state machine design and optimization.

**Capabilities**:
- Design Moore and Mealy state machines
- Apply state encoding (one-hot, binary, Gray)
- Implement illegal state recovery
- Generate state diagrams and transition tables
- Optimize FSM for area or speed
- Apply safe FSM coding patterns
- Debug FSM behavior with assertions
- Handle FSM with multiple clock domains

**Process Integration**:
- fsm-design.js
- rtl-module-architecture.js
- vhdl-module-development.js
- verilog-systemverilog-design.js

**Dependencies**: FSM analysis tools

---

### SK-014: Power Analysis Skill
**Slug**: `power-analysis`
**Category**: Design Optimization

**Description**: FPGA power estimation and optimization techniques.

**Capabilities**:
- Run power estimation tools (Vivado Power Estimator)
- Analyze static and dynamic power
- Identify high-power consumption areas
- Apply clock gating and enable strategies
- Optimize switching activity
- Configure power domains
- Estimate power from simulation activity
- Generate power reports

**Process Integration**:
- power-analysis-optimization.js
- synthesis-optimization.js
- clock-network-design.js

**Dependencies**: Power analysis tool integration

---

### SK-015: IP Core Management Skill
**Slug**: `ip-core-management`
**Category**: IP Integration

**Description**: Vendor IP core configuration and integration expertise.

**Capabilities**:
- Configure Xilinx/AMD IP cores
- Configure Intel/Altera IP cores
- Generate IP output products
- Connect IP interfaces correctly
- Handle IP versioning and updates
- Configure IP parameters via TCL
- Integrate third-party IP cores
- Document IP configurations

**Process Integration**:
- ip-core-integration.js
- clock-network-design.js
- memory-interface-design.js
- axi-interface-design.js

**Dependencies**: Vendor IP catalog access

---

### SK-016: Simulation Tool Skill
**Slug**: `hdl-simulation`
**Category**: Verification

**Description**: Multi-simulator expertise for functional verification.

**Capabilities**:
- Generate simulation scripts (do files, tcl)
- Configure ModelSim/Questa simulations
- Configure Vivado Simulator (xsim)
- Configure VCS and Xcelium simulations
- Analyze waveforms for debugging
- Generate VCD and FSDB dumps
- Configure code coverage collection
- Support mixed-language simulation

**Process Integration**:
- functional-simulation.js
- testbench-development.js
- uvm-testbench.js
- constrained-random-verification.js

**Dependencies**: Simulator CLI integration

---

### SK-017: Formal Verification Skill
**Slug**: `formal-verification`
**Category**: Verification

**Description**: Formal property verification and model checking.

**Capabilities**:
- Write properties for formal verification
- Configure formal tool constraints
- Analyze formal counterexamples
- Apply bounded model checking
- Configure cover and assume directives
- Debug formal failures
- Integrate formal with simulation flows
- Support JasperGold and VC Formal flows

**Process Integration**:
- sva-development.js
- cdc-design.js
- constrained-random-verification.js

**Dependencies**: Formal tool awareness

---

### SK-018: RTL Linting Skill
**Slug**: `rtl-linting`
**Category**: Code Quality

**Description**: RTL code quality checking and linting.

**Capabilities**:
- Run SpyGlass/Ascent lint rules
- Configure Vivado lint checks
- Identify synthesis coding issues
- Detect inferred latches
- Check clock domain violations
- Verify reset handling
- Check naming conventions
- Generate lint reports and waivers

**Process Integration**:
- vhdl-module-development.js
- verilog-systemverilog-design.js
- synthesis-optimization.js
- cdc-design.js

**Dependencies**: Lint tool integration

---

---

## Agents Backlog

### AG-001: RTL Design Expert Agent
**Slug**: `rtl-design-expert`
**Category**: Design

**Description**: Senior RTL designer with deep expertise in synthesizable HDL code.

**Expertise Areas**:
- VHDL and Verilog/SystemVerilog best practices
- Synchronous design methodology
- Pipeline design and optimization
- Resource sharing and area optimization
- Clock and reset design patterns
- Parameterizable and reusable RTL

**Persona**:
- Role: Senior RTL Design Engineer
- Experience: 10+ years digital design
- Background: ASIC and FPGA design expertise

**Process Integration**:
- rtl-module-architecture.js (all phases)
- vhdl-module-development.js (all phases)
- verilog-systemverilog-design.js (all phases)
- pipeline-architecture.js (all phases)

---

### AG-002: FPGA Timing Expert Agent
**Slug**: `fpga-timing-expert`
**Category**: Implementation

**Description**: Specialist in timing closure and constraint development.

**Expertise Areas**:
- SDC/XDC constraint methodology
- Critical path analysis and optimization
- Clock architecture and distribution
- Multi-cycle and false path identification
- Setup and hold violation debugging
- Physical constraint application

**Persona**:
- Role: Senior Timing Engineer
- Experience: 8+ years timing closure
- Background: High-speed FPGA and ASIC timing

**Process Integration**:
- timing-constraints.js (all phases)
- timing-closure.js (all phases)
- place-and-route.js (timing optimization)
- synthesis-optimization.js (timing review)

---

### AG-003: Verification Expert Agent
**Slug**: `verification-expert`
**Category**: Verification

**Description**: Senior verification engineer with UVM and formal verification expertise.

**Expertise Areas**:
- UVM testbench architecture
- Constrained random verification
- Functional coverage closure
- Formal verification methodology
- SVA and property checking
- Code and functional coverage

**Persona**:
- Role: Principal Verification Engineer
- Experience: 12+ years verification
- Background: UVM, formal, emulation experience

**Process Integration**:
- uvm-testbench.js (all phases)
- constrained-random-verification.js (all phases)
- sva-development.js (all phases)
- testbench-development.js (all phases)

---

### AG-004: CDC Expert Agent
**Slug**: `cdc-expert`
**Category**: Design Verification

**Description**: Clock domain crossing specialist with metastability expertise.

**Expertise Areas**:
- CDC analysis and verification
- Synchronizer design and MTBF
- Async FIFO design (Gray code)
- Handshake protocol design
- Reset domain crossing
- CDC constraint development

**Persona**:
- Role: CDC Design Specialist
- Experience: 8+ years multi-clock design
- Background: High-reliability systems

**Process Integration**:
- cdc-design.js (all phases)
- reset-strategy.js (all phases)
- clock-network-design.js (CDC aspects)
- timing-constraints.js (CDC constraints)

---

### AG-005: HLS Expert Agent
**Slug**: `hls-expert`
**Category**: Hardware Acceleration

**Description**: High-Level Synthesis specialist for algorithm acceleration.

**Expertise Areas**:
- C/C++ to RTL optimization
- HLS pragma application
- Dataflow and pipeline optimization
- Interface synthesis
- Performance/resource tradeoffs
- Algorithm-hardware co-optimization

**Persona**:
- Role: Senior HLS Engineer
- Experience: 6+ years HLS development
- Background: Algorithm optimization, accelerator design

**Process Integration**:
- hls-development.js (all phases)
- hardware-software-codesign.js (HLS portions)
- ip-core-integration.js (HLS IP)

---

### AG-006: FPGA Architect Agent
**Slug**: `fpga-architect`
**Category**: Architecture

**Description**: Senior FPGA architect for system-level design decisions.

**Expertise Areas**:
- FPGA architecture selection
- System partitioning
- Clock architecture planning
- Resource budgeting
- Interface architecture
- Performance estimation

**Persona**:
- Role: Principal FPGA Architect
- Experience: 15+ years FPGA design
- Background: Complex SoC and system design

**Process Integration**:
- rtl-module-architecture.js (architecture phases)
- hardware-software-codesign.js (partitioning)
- ip-core-integration.js (system architecture)
- clock-network-design.js (clock architecture)

---

### AG-007: Synthesis Expert Agent
**Slug**: `synthesis-expert`
**Category**: Implementation

**Description**: Expert in FPGA synthesis optimization and tool mastery.

**Expertise Areas**:
- Vivado synthesis strategies
- Quartus synthesis optimization
- Resource inference control
- Synthesis attribute application
- QoR analysis and improvement
- Tool-specific optimizations

**Persona**:
- Role: Senior Synthesis Engineer
- Experience: 10+ years synthesis optimization
- Background: Multi-vendor FPGA experience

**Process Integration**:
- synthesis-optimization.js (all phases)
- place-and-route.js (synthesis aspects)
- timing-closure.js (synthesis iteration)
- power-analysis-optimization.js (synthesis optimization)

---

### AG-008: AXI Protocol Expert Agent
**Slug**: `axi-expert`
**Category**: Interface Design

**Description**: AMBA AXI protocol specialist for interface design.

**Expertise Areas**:
- AXI4/AXI4-Lite/AXI4-Stream protocols
- Interconnect design
- Protocol compliance
- Performance optimization
- Debug and verification
- IP integration

**Persona**:
- Role: AXI Protocol Engineer
- Experience: 8+ years SoC interconnect
- Background: ARM ecosystem, IP development

**Process Integration**:
- axi-interface-design.js (all phases)
- ip-core-integration.js (AXI interfaces)
- memory-interface-design.js (AXI memory)
- hls-development.js (interface synthesis)

---

### AG-009: FPGA Debug Expert Agent
**Slug**: `fpga-debug-expert`
**Category**: Debug

**Description**: On-chip debug and bring-up specialist.

**Expertise Areas**:
- ILA/VIO insertion and analysis
- Hardware debugging methodology
- Signal integrity issues
- Functional debug in silicon
- Debug infrastructure design
- Production test strategies

**Persona**:
- Role: Senior Debug Engineer
- Experience: 8+ years hardware debug
- Background: Lab bring-up and production test

**Process Integration**:
- fpga-on-chip-debugging.js (all phases)
- design-for-testability.js (debug infrastructure)
- functional-simulation.js (debug correlation)

---

### AG-010: Embedded FPGA Expert Agent
**Slug**: `embedded-fpga-expert`
**Category**: Hardware-Software

**Description**: Expert in FPGA-based embedded systems (Zynq, SoC FPGAs).

**Expertise Areas**:
- Zynq PS/PL integration
- Embedded Linux on FPGA
- Device driver development
- DMA and interrupt handling
- Hardware-software partitioning
- Boot and configuration

**Persona**:
- Role: Embedded FPGA Engineer
- Experience: 8+ years SoC FPGA
- Background: Embedded systems, Linux kernel

**Process Integration**:
- hardware-software-codesign.js (all phases)
- ip-core-integration.js (PS integration)
- memory-interface-design.js (embedded memory)
- fpga-on-chip-debugging.js (embedded debug)

---

### AG-011: Xilinx/AMD Specialist Agent
**Slug**: `xilinx-specialist`
**Category**: Vendor-Specific

**Description**: Deep expertise in Xilinx/AMD FPGA ecosystem.

**Expertise Areas**:
- Vivado Design Suite mastery
- Vitis development platform
- Xilinx IP catalog
- UltraScale+ architecture
- Versal adaptive SoCs
- Xilinx-specific optimizations

**Persona**:
- Role: Xilinx Applications Engineer
- Experience: 10+ years Xilinx platforms
- Background: Certified Xilinx expert

**Process Integration**:
- All processes when targeting Xilinx/AMD devices
- Particularly: synthesis-optimization.js, timing-closure.js, ip-core-integration.js

---

### AG-012: Intel/Altera Specialist Agent
**Slug**: `intel-specialist`
**Category**: Vendor-Specific

**Description**: Deep expertise in Intel/Altera FPGA ecosystem.

**Expertise Areas**:
- Quartus Prime mastery
- Platform Designer (Qsys)
- Intel IP catalog
- Stratix/Agilex architecture
- Intel HLS compiler
- Intel-specific optimizations

**Persona**:
- Role: Intel Applications Engineer
- Experience: 10+ years Intel/Altera platforms
- Background: Certified Intel expert

**Process Integration**:
- All processes when targeting Intel/Altera devices
- Particularly: synthesis-optimization.js, timing-closure.js, ip-core-integration.js

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| rtl-module-architecture.js | SK-001, SK-002, SK-013 | AG-001, AG-006 |
| vhdl-module-development.js | SK-001, SK-018 | AG-001 |
| verilog-systemverilog-design.js | SK-002, SK-018 | AG-001 |
| fsm-design.js | SK-013, SK-001, SK-002 | AG-001 |
| pipeline-architecture.js | SK-009, SK-001, SK-002 | AG-001, AG-002 |
| testbench-development.js | SK-001, SK-002, SK-016 | AG-003 |
| functional-simulation.js | SK-016, SK-018 | AG-003, AG-009 |
| sva-development.js | SK-003, SK-017 | AG-003 |
| constrained-random-verification.js | SK-007, SK-003 | AG-003 |
| uvm-testbench.js | SK-007, SK-003, SK-016 | AG-003 |
| synthesis-optimization.js | SK-009, SK-018 | AG-007, AG-011/AG-012 |
| timing-constraints.js | SK-004, SK-005 | AG-002 |
| timing-closure.js | SK-004, SK-009, SK-010 | AG-002, AG-007 |
| place-and-route.js | SK-010, SK-004 | AG-002, AG-007 |
| cdc-design.js | SK-005, SK-004 | AG-004 |
| reset-strategy.js | SK-005, SK-001, SK-002 | AG-004, AG-001 |
| clock-network-design.js | SK-004, SK-005, SK-015 | AG-002, AG-004 |
| ip-core-integration.js | SK-015, SK-008 | AG-008, AG-006 |
| axi-interface-design.js | SK-008, SK-002 | AG-008 |
| memory-interface-design.js | SK-012, SK-008 | AG-008, AG-001 |
| hls-development.js | SK-006, SK-008 | AG-005 |
| hardware-software-codesign.js | SK-006, SK-015 | AG-005, AG-010 |
| fpga-on-chip-debugging.js | SK-011, SK-016 | AG-009 |
| power-analysis-optimization.js | SK-014, SK-009 | AG-007, AG-006 |
| design-for-testability.js | SK-011, SK-018 | AG-009, AG-001 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-006 | HLS C/C++ | Embedded Development, Algorithm Development |
| SK-007 | UVM Methodology | ASIC Design (if added), Verification specializations |
| SK-008 | AXI Protocol | Embedded Development, SoC Design |
| SK-016 | HDL Simulation | Verification Engineering, Hardware Testing |
| SK-017 | Formal Verification | Security Engineering (hardware), ASIC Design |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-003 | Verification Expert | ASIC Design, Hardware Testing |
| AG-005 | HLS Expert | Embedded Development, Algorithm Acceleration |
| AG-008 | AXI Protocol Expert | Embedded Development, SoC Integration |
| AG-010 | Embedded FPGA Expert | Embedded Development |

---

## Implementation Priority

### Phase 1: Core HDL Skills (High Impact)
1. **SK-001**: VHDL Language - Foundation for VHDL development
2. **SK-002**: Verilog/SystemVerilog Language - Most common HDL
3. **SK-004**: Timing Constraints - Critical for all implementations
4. **SK-009**: Synthesis Optimization - Core to FPGA workflow

### Phase 2: Core Agents (High Impact)
1. **AG-001**: RTL Design Expert - Highest process coverage
2. **AG-002**: FPGA Timing Expert - Critical for closure
3. **AG-003**: Verification Expert - Quality assurance
4. **AG-007**: Synthesis Expert - Implementation quality

### Phase 3: Verification Tools
1. **SK-003**: SVA Assertions
2. **SK-007**: UVM Methodology
3. **SK-016**: HDL Simulation
4. **SK-017**: Formal Verification
5. **AG-004**: CDC Expert

### Phase 4: Specialized Design
1. **SK-005**: CDC Analysis
2. **SK-008**: AXI Protocol
3. **SK-012**: Memory Interfaces
4. **SK-013**: FSM Design
5. **AG-005**: HLS Expert
6. **AG-008**: AXI Protocol Expert

### Phase 5: Advanced Tools
1. **SK-006**: HLS C/C++ to RTL
2. **SK-010**: Place and Route
3. **SK-011**: FPGA Debugging
4. **SK-014**: Power Analysis
5. **SK-015**: IP Core Management
6. **AG-009**: FPGA Debug Expert
7. **AG-010**: Embedded FPGA Expert

### Phase 6: Vendor-Specific
1. **SK-018**: RTL Linting
2. **AG-011**: Xilinx/AMD Specialist
3. **AG-012**: Intel/Altera Specialist
4. **AG-006**: FPGA Architect

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 18 |
| Agents Identified | 12 |
| Shared Skill Candidates | 5 |
| Shared Agent Candidates | 4 |
| Total Processes Covered | 25 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
