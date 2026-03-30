# Embedded Systems Engineering - Skills and Agents References

This document provides references to community-created Claude skills, agents, plugins, and MCP servers that can enhance the Embedded Systems Engineering processes. These resources were identified through research of public repositories and marketplaces.

---

## Table of Contents

1. [Overview](#overview)
2. [Claude Skills](#claude-skills)
3. [Claude Subagents](#claude-subagents)
4. [MCP Servers - Hardware & Debugging](#mcp-servers---hardware--debugging)
5. [MCP Servers - Serial Communication](#mcp-servers---serial-communication)
6. [MCP Servers - IoT Platforms](#mcp-servers---iot-platforms)
7. [MCP Servers - Industrial Protocols](#mcp-servers---industrial-protocols)
8. [MCP Servers - Design & CAD Tools](#mcp-servers---design--cad-tools)
9. [Curated Collections](#curated-collections)
10. [Skill-to-Backlog Mapping](#skill-to-backlog-mapping)

---

## Overview

### Research Sources
- GitHub Topics: claude-skills, mcp-server, embedded-systems
- Curated Lists: awesome-mcp-servers, awesome-claude-skills, awesome-mcp-hardware
- Marketplaces: MCPMarket, Claude-Plugins.dev, PRPM.dev

### Coverage Summary
| Category | References Found |
|----------|-----------------|
| Claude Skills | 5 |
| Claude Subagents | 3 |
| MCP Servers - Hardware/Debug | 6 |
| MCP Servers - Serial Comm | 5 |
| MCP Servers - IoT Platforms | 8 |
| MCP Servers - Industrial | 3 |
| MCP Servers - Design/CAD | 3 |
| Curated Collections | 6 |
| **Total** | **39** |

---

## Claude Skills

### SK-REF-001: Embedded Systems Engineer Skill
**Source**: MCPMarket
**URL**: https://mcpmarket.com/tools/skills/embedded-systems-engineer

**Description**: Transforms Claude into a senior embedded systems expert capable of designing reliable firmware for ARM Cortex-M, ESP32, and STM32 platforms.

**Capabilities**:
- Real-time operating systems (FreeRTOS, Zephyr)
- Power consumption optimization
- Hardware-software integration
- Low-level communication protocols
- Timing constraints and memory limits
- Hardware safety standards

**Backlog Mapping**: SK-002, SK-003, SK-006, SK-007, AG-001

---

### SK-REF-002: ESP32 Firmware Debugger Skill
**Source**: MCPMarket
**URL**: https://mcpmarket.com/tools/skills/esp32-firmware-debugger

**Description**: Provides domain-specific expertise for identifying and resolving complex issues in ESP32 embedded projects within the ESP-IDF framework.

**Capabilities**:
- Interpreting 'Guru Meditation Error' logs
- Fixing FreeRTOS stack overflows
- Diagnosing I2C/SPI/UART communication issues
- Runtime panic analysis
- Memory corruption debugging
- Hardware communication failure troubleshooting

**Backlog Mapping**: SK-002, SK-004, SK-008, AG-003

---

### SK-REF-003: Embedded Systems Skill (@zenobi-us/dotfiles)
**Source**: Claude-Plugins.dev
**URL**: https://claude-plugins.dev/skills/@zenobi-us/dotfiles/embedded-systems

**Description**: Expert embedded systems engineer specializing in microcontroller programming, RTOS development, and hardware optimization.

**Capabilities**:
- **Microcontroller Programming**: Bare metal, register manipulation, DMA, interrupts
- **RTOS**: FreeRTOS, Zephyr, RT-Thread, Mbed OS
- **Hardware**: ARM Cortex-M, ESP32/ESP8266, STM32, Nordic nRF, PIC, AVR/Arduino
- **Protocols**: I2C, SPI, UART, CAN bus, Modbus, MQTT, LoRaWAN, BLE, Zigbee
- **Power Management**: Sleep modes, clock gating, battery management

**MCP Tools**: gcc-arm, platformio, arduino, esp-idf, stm32cube

**Installation**: Download ZIP from source, upload to Claude Skills settings

**Backlog Mapping**: SK-002, SK-004, SK-005, SK-006, SK-007, SK-008, AG-001, AG-004

---

### SK-REF-004: ESP-IDF Skill
**Source**: Claude-Plugins.dev
**URL**: https://claude-plugins.dev/skills/@synqing/K1.node2/ESP-IDF

**Description**: ESP32 Integrated Development Framework documentation covering I2S, GPIO, FreeRTOS, peripherals, and ESP32S3-specific APIs.

**Capabilities**:
- ESP-IDF framework development
- Feature and API queries
- Implementation creation
- Troubleshooting code issues
- Best practices adoption

**Backlog Mapping**: SK-002, SK-008, AG-004

---

### SK-REF-005: ESP32 Embedded Dev Package
**Source**: PRPM.dev
**URL**: https://prpm.dev/packages/rghamilton3/dotfiles-dot-claude-esp32-embedded-dev

**Description**: Expert ESP32 development with ESP-IDF 5.3.x, covering FreeRTOS patterns, peripheral drivers, WiFi/BLE networking, power management, and hardware optimization.

**Use Cases**:
- Developing ESP32 firmware
- Implementing FreeRTOS tasks
- Configuring WiFi/BLE
- Optimizing memory and power
- Working with ESP32-S3 hardware

**Installation**: `prpm install @rghamilton3/dotfiles-dot-claude-esp32-embedded-dev`

**Backlog Mapping**: SK-002, SK-008, SK-009, SK-018, AG-006

---

## Claude Subagents

### AG-REF-001: Embedded Systems Subagent (VoltAgent)
**Source**: VoltAgent/awesome-claude-code-subagents
**URL**: https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/07-specialized-domains/embedded-systems.md

**Description**: Senior embedded systems engineer with expertise in developing firmware for resource-constrained devices.

**Expertise Areas**:
- **Microcontroller Programming**: Bare metal, registers, DMA, timers, power modes
- **RTOS Implementation**: Task scheduling, synchronization, memory management
- **Hardware Abstraction**: HAL development, driver interfaces, BSP, bootloaders
- **Communication Protocols**: I2C, SPI, UART, CAN, Modbus, MQTT, LoRaWAN, BLE
- **Power Management**: Sleep modes, clock gating, energy profiling, battery management

**Supported Platforms**: ARM Cortex-M, ESP32/ESP8266, STM32, Nordic nRF, PIC, AVR/Arduino

**Example Output**: "Firmware using 47KB flash and 12KB RAM on STM32F4, achieving 3.2mA average power consumption with 15% real-time margin, FreeRTOS with 5 tasks"

**Installation**: Place subagent files in `.claude/agents/` within your project

**Backlog Mapping**: SK-002, SK-004, SK-006, SK-007, SK-009, AG-001, AG-002, AG-004, AG-006

---

### AG-REF-002: Embedded Systems Expert (rshah515)
**Source**: rshah515/claude-code-subagents
**URL**: https://github.com/rshah515/claude-code-subagents

**Description**: Collection of 133+ specialized AI subagents including embedded-systems-expert for microcontroller programming in the advanced-computing category.

**Backlog Mapping**: AG-001, AG-004

---

### AG-REF-003: Claude Code Sub-Agents Collection (lst97)
**Source**: lst97/claude-code-sub-agents
**URL**: https://github.com/lst97/claude-code-sub-agents

**Description**: Collection of specialized AI subagents for Claude Code designed to enhance development workflows with domain-specific expertise.

**Backlog Mapping**: AG-001, AG-004, AG-012

---

## MCP Servers - Hardware & Debugging

### MCP-REF-001: Embedded Debugger MCP (probe-rs)
**Source**: Adancurusul
**URL**: https://github.com/Adancurusul/embedded-debugger-mcp

**Description**: Model Context Protocol server for embedded debugging with probe-rs. Supports ARM Cortex-M, RISC-V debugging via J-Link, ST-Link, and more.

**Capabilities** (22 tools):
- Probe management
- Memory operations (read/write)
- Debug control (step, continue, halt)
- Breakpoint management
- Flash operations
- RTT (Real-Time Transfer) communication
- Session management

**Validation**: 100% success rate (22/22 tools) tested with real STM32 hardware

**Supported Probes**: J-Link, ST-Link, CMSIS-DAP, ESP32 USB JTAG

**Installation**:
```bash
git clone https://github.com/Adancurusul/embedded-debugger-mcp
cargo build --release
```

**Backlog Mapping**: SK-001, SK-006, AG-003

---

### MCP-REF-002: TinyMCP
**Source**: Golioth
**URL**: https://github.com/golioth/tinymcp

**Description**: Let LLMs control embedded devices via the Model Context Protocol. Enables any connected device to expose remote functionality to LLMs.

**Architecture**: MCP Client (Claude) -> TinyMCP Server -> Golioth Cloud -> Device

**Features**:
- Remote Procedure Call (RPC) support
- LightDB State integration
- Tool calling capabilities
- Zephyr RTOS example (blinky)

**Supported Clients**: Claude Code, Cursor, Gemini CLI

**Installation**:
```bash
go build -o tinymcp ./server
# Set: TINYMCP_PROJECT, TINYMCP_DEVICE, TINYMCP_API_KEY
```

**Backlog Mapping**: SK-003, SK-015, AG-003

---

### MCP-REF-003: XDS110 MCP Server
**Source**: shanemmattner
**URL**: https://github.com/shanemmattner/xds110_mcp_server

**Description**: Generic Debugging Interface for ANY Texas Instruments CCS Project.

**Backlog Mapping**: SK-001, AG-003

---

### MCP-REF-004: UnitApi MCP
**Source**: UnitApi
**URL**: https://github.com/UnitApi/mcp

**Description**: Comprehensive library for secure hardware control through MCP, enabling AI agents and automated systems to interact with physical devices.

**Backlog Mapping**: SK-004, AG-003

---

### MCP-REF-005: KiCad MCP
**Source**: lamaalrajih
**URL**: https://github.com/lamaalrajih/kicad-mcp

**Description**: KiCad PCB design project integration for AI-assisted hardware design.

**Backlog Mapping**: AG-003 (PCB/schematic review during bring-up)

---

### MCP-REF-006: Altium MCP
**Source**: coffeenmusic
**URL**: https://github.com/coffeenmusic/altium-mcp

**Description**: Altium Designer PCB manipulation capabilities through MCP.

**Backlog Mapping**: AG-003 (PCB design integration)

---

## MCP Servers - Serial Communication

### MCP-REF-007: Serial MCP Server (Adancurusul)
**Source**: Adancurusul
**URL**: https://github.com/Adancurusul/serial-mcp-server

**Description**: Comprehensive MCP server for serial port communication providing AI assistants with serial communication capabilities for embedded systems, IoT devices, and hardware debugging.

**Features**:
- Real hardware integration
- STM32/Arduino communication tested
- 100% success rate (5/5 tools) validated

**Installation**:
```bash
git clone https://github.com/adancurusul/serial-mcp-server.git
cargo build --release
```

**Backlog Mapping**: SK-004, SK-013, AG-003, AG-010

---

### MCP-REF-008: Serial MCP (bmdragos)
**Source**: bmdragos
**URL**: https://github.com/bmdragos/serial-mcp

**Description**: Minimal MCP server for non-blocking serial communication. Built for Claude Code to interact with Arduino, ESP32, and other serial devices without hanging.

**Features**:
- Non-blocking reads (data buffers in background)
- Persistent connections across tool calls
- Real-time debugging

**Backlog Mapping**: SK-004, AG-003, AG-010

---

### MCP-REF-009: Serial MCP (PaDev1)
**Source**: PaDev1
**URL**: https://github.com/PaDev1/serial-mcp

**Description**: MCP server allowing Agents to talk to devices connected to serial port. Built with FastMCP framework.

**Features**:
- Asynchronous serial communication (asyncio)
- Message buffering with timestamps
- Connection management
- Error detection and reporting

**Backlog Mapping**: SK-004, AG-010

---

### MCP-REF-010: MCP2Serial
**Source**: mcp2everything
**URL**: https://github.com/mcp2everything/mcp2serial

**Description**: Enables AI models to manage hardware devices through serial connections with initial Raspberry Pi Pico support.

**Backlog Mapping**: SK-004, AG-003

---

### MCP-REF-011: MCP2TCP
**Source**: mcp2everything
**URL**: https://github.com/mcp2everything/mcp2tcp

**Description**: Bridges TCP devices to language models using MCP protocol.

**Backlog Mapping**: SK-004, AG-010

---

## MCP Servers - IoT Platforms

### MCP-REF-012: ESP32 MCP Server
**Source**: MCPMarket
**URL**: https://mcpmarket.com/server/esp32

**Description**: Enables AI models to connect to ESP32 exposed interfaces using WebSocket-based MCP implementation.

**Features**:
- Resource discovery and monitoring
- Real-time updates
- WiFi configuration via web interface
- Thread-safe request handling
- LittleFS configuration storage

**Backlog Mapping**: SK-008, SK-018, AG-003

---

### MCP-REF-013: MCP Arduino Server
**Source**: Volt23
**URL**: https://github.com/Volt23/mcp-arduino-server

**Description**: Facilitates Arduino development workflows by bridging MCP with Arduino CLI for sketch, board, library, and file management.

**Backlog Mapping**: SK-012, AG-003

---

### MCP-REF-014: ESP RainMaker MCP
**Source**: dhavalgujar
**URL**: https://github.com/dhavalgujar/esp-rainmaker-mcp

**Description**: Facilitates interaction with ESP RainMaker devices through MCP-compatible clients.

**Backlog Mapping**: SK-008, SK-015, SK-018

---

### MCP-REF-015: NodeMCU MCP Server
**Source**: amanasmuei
**URL**: https://github.com/amanasmuei/mcp-server-nodemcu

**Description**: NodeMCU IoT device management through MCP.

**Backlog Mapping**: SK-008, AG-003

---

### MCP-REF-016: Home Assistant MCP
**Source**: liorfranko
**URL**: https://github.com/liorfranko/home-assistant-mcp

**Description**: Integrate Claude with Home Assistant for natural language control and monitoring of home automation systems.

**Backlog Mapping**: SK-018 (smart home protocols)

---

### MCP-REF-017: ThingsBoard MCP Server
**Source**: ThingsBoard
**URL**: (Community contribution to awesome-mcp-servers)

**Description**: Natural language interface for LLMs and AI agents to interact with ThingsBoard IoT platform.

**Backlog Mapping**: SK-015, SK-018

---

### MCP-REF-018: AWS IoT SiteWise MCP Server
**Source**: AWS
**URL**: (Community contribution to awesome-mcp-servers)

**Description**: MCP server exposing AWS IoT SiteWise capabilities for industrial IoT asset management, data ingestion, monitoring, and analytics.

**Backlog Mapping**: SK-015, SK-018, AG-010

---

### MCP-REF-019: IoT Edge MCP Server
**Source**: llm-use
**URL**: https://github.com/llm-use/IoT-Edge-MCP-Server

**Description**: MCP server for Industrial IoT, SCADA and PLC systems.

**Backlog Mapping**: SK-005, SK-018, AG-010

---

## MCP Servers - Industrial Protocols

### MCP-REF-020: Modbus MCP
**Source**: kukapay
**URL**: https://github.com/kukapay/modbus-mcp

**Description**: Standardizes and contextualizes Modbus data for seamless AI agent integration with industrial IoT systems.

**Backlog Mapping**: SK-004, SK-005, AG-010

---

### MCP-REF-021: OPC-UA MCP
**Source**: kukapay
**URL**: (Repository on GitHub)

**Description**: Connects AI to OPC UA industrial systems for monitoring and control.

**Backlog Mapping**: SK-005, AG-010

---

### MCP-REF-022: MCP2MQTT
**Source**: mcp2everything
**URL**: https://github.com/mcp2everything/mcp2mqtt

**Description**: Serial communication server based on MCP service interface protocol for MQTT integration.

**Backlog Mapping**: SK-018, AG-010

---

## MCP Servers - Design & CAD Tools

### MCP-REF-023: SolidWorks MCP Server
**Source**: hussam0is
**URL**: https://github.com/hussam0is/solidworks-mcp-server

**Description**: SolidWorks CAD operations via natural language for mechanical design integration.

**Backlog Mapping**: AG-003 (hardware codesign)

---

### MCP-REF-024: Isaac Sim MCP
**Source**: omni-mcp
**URL**: https://github.com/omni-mcp/isaac-sim-mcp

**Description**: Natural language control of NVIDIA Isaac Sim for dynamic robot simulations and scene manipulation.

**Backlog Mapping**: SK-019 (motor control simulation)

---

### MCP-REF-025: 3D Printer MCP Server
**Source**: DMontgomery40
**URL**: https://github.com/DMontgomery40/mcp-3D-printer-server

**Description**: 3D printer STL operations for rapid prototyping workflows.

**Backlog Mapping**: AG-003 (hardware prototyping)

---

## Curated Collections

### COL-REF-001: Awesome MCP Hardware
**Source**: beriberikix
**URL**: https://github.com/beriberikix/awesome-mcp-hardware

**Description**: Awesome list of MCP servers for interacting with hardware and the physical world.

**Notable Entries**:
- tinymcp, embedded-debugger-mcp, mcp2serial, mcp2tcp
- IoT-Edge-MCP-Server, UnitApi, xds110_mcp_server

---

### COL-REF-002: Awesome MCP Servers - Hardware & IoT
**Source**: TensorBlock
**URL**: https://github.com/TensorBlock/awesome-mcp-servers/blob/main/docs/hardware--iot.md

**Description**: Comprehensive collection with 51 MCP servers for hardware/IoT control covering industrial systems, smart home automation, embedded devices, and hardware design tools.

---

### COL-REF-003: Awesome Claude Code Subagents
**Source**: VoltAgent
**URL**: https://github.com/VoltAgent/awesome-claude-code-subagents

**Description**: Collection of 100+ specialized Claude Code subagents including embedded systems domain expertise.

---

### COL-REF-004: Awesome Claude Skills
**Source**: travisvn
**URL**: https://github.com/travisvn/awesome-claude-skills

**Description**: Curated list of Claude Skills, resources, and tools for customizing Claude AI workflows.

---

### COL-REF-005: Awesome Claude Code Plugins
**Source**: ccplugins
**URL**: https://github.com/ccplugins/awesome-claude-code-plugins

**Description**: Curated list of slash commands, subagents, MCP servers, and hooks for Claude Code.

---

### COL-REF-006: PRPM - Package Registry
**Source**: PRPM.dev
**URL**: https://prpm.dev/

**Description**: Largest collection of Cursor rules, Claude agents, and slash commands with 7,000+ packages.

---

## Skill-to-Backlog Mapping

This section maps the found references to the skills and agents identified in the backlog.

### Skills Coverage

| Backlog ID | Backlog Name | References Found |
|------------|--------------|------------------|
| SK-001 | JTAG/SWD Debug | MCP-REF-001, MCP-REF-003 |
| SK-002 | FreeRTOS Integration | SK-REF-001, SK-REF-002, SK-REF-003, SK-REF-004, SK-REF-005, AG-REF-001 |
| SK-003 | Zephyr RTOS | SK-REF-001, MCP-REF-002 |
| SK-004 | Protocol Analyzer (I2C/SPI/UART) | SK-REF-002, SK-REF-003, AG-REF-001, MCP-REF-007 to MCP-REF-011 |
| SK-005 | CAN Bus | SK-REF-003, MCP-REF-019, MCP-REF-020, MCP-REF-021 |
| SK-006 | ARM Cortex-M | SK-REF-001, SK-REF-003, AG-REF-001, MCP-REF-001 |
| SK-007 | STM32 HAL/LL | SK-REF-001, SK-REF-003, AG-REF-001 |
| SK-008 | Nordic nRF | SK-REF-003, SK-REF-004, SK-REF-005, MCP-REF-012, MCP-REF-014, MCP-REF-015 |
| SK-009 | Power Profiler | SK-REF-005, AG-REF-001 |
| SK-010 | Memory Analysis | (No direct reference - gap) |
| SK-011 | MISRA C Static Analysis | (No direct reference - gap) |
| SK-012 | Unity/Ceedling Test | MCP-REF-013 |
| SK-013 | Oscilloscope/Logic Analyzer | MCP-REF-007 |
| SK-014 | Linker Script | (No direct reference - gap) |
| SK-015 | OTA Update | MCP-REF-002, MCP-REF-014, MCP-REF-017, MCP-REF-018 |
| SK-016 | Cryptographic Operations | (No direct reference - gap) |
| SK-017 | USB Stack | (No direct reference - gap) |
| SK-018 | Wireless Protocols | SK-REF-005, MCP-REF-012, MCP-REF-014 to MCP-REF-019, MCP-REF-022 |
| SK-019 | Motor Control | MCP-REF-024 |
| SK-020 | Doxygen Documentation | (No direct reference - gap) |

### Agents Coverage

| Backlog ID | Backlog Name | References Found |
|------------|--------------|------------------|
| AG-001 | Firmware Architect | SK-REF-001, SK-REF-003, AG-REF-001, AG-REF-002, AG-REF-003 |
| AG-002 | RTOS Expert | AG-REF-001 |
| AG-003 | Hardware Bring-Up Specialist | SK-REF-002, AG-REF-001, MCP-REF-001 to MCP-REF-006, MCP-REF-007, MCP-REF-010, MCP-REF-012 to MCP-REF-015 |
| AG-004 | Device Driver Expert | SK-REF-003, SK-REF-004, AG-REF-001, AG-REF-002, AG-REF-003 |
| AG-005 | Embedded Security Expert | (No direct reference - gap) |
| AG-006 | Power Optimization Expert | SK-REF-005, AG-REF-001 |
| AG-007 | Safety Compliance Expert | (No direct reference - gap) |
| AG-008 | Embedded Test Engineer | (No direct reference - gap) |
| AG-009 | Bootloader Expert | (No direct reference - gap) |
| AG-010 | Communication Protocol Expert | MCP-REF-007 to MCP-REF-011, MCP-REF-018 to MCP-REF-022 |
| AG-011 | Performance Optimization Agent | (No direct reference - gap) |
| AG-012 | Technical Documentation Agent | AG-REF-003 |

### Gap Analysis

**Skills with no direct community references**:
- SK-010: Memory Analysis (linker map parsing, stack analysis)
- SK-011: MISRA C Static Analysis
- SK-014: Linker Script generation
- SK-016: Cryptographic Operations (embedded crypto, TrustZone)
- SK-017: USB Stack
- SK-020: Doxygen Documentation

**Agents with no direct community references**:
- AG-005: Embedded Security Expert
- AG-007: Safety Compliance Expert (ISO 26262, IEC 61508)
- AG-008: Embedded Test Engineer
- AG-009: Bootloader Expert
- AG-011: Performance Optimization Agent

---

## Additional Resources

### Training & Documentation
- **Claude Code for Embedded Systems Development**: https://do.institute/training/ai/claude-code-embedded/
- **Why Claude Code for Firmware Development Matters**: https://www.beningo.com/why-claude-code-for-firmware-development-matters/
- **Building Gopher Client for Zephyr with Claude**: https://interrupt.memfault.com/blog/gophyr-gopher-for-zephyr

### Community Discussions
- **Arduino Forum - Using Claude Code AI to program ESP32**: https://forum.arduino.cc/t/using-claude-code-ai-to-program-an-esp32/1366620
- **Hacker News - TinyMCP Discussion**: https://news.ycombinator.com/item?id=44491460

### Development Tools
- **probe-rs**: https://github.com/probe-rs/probe-rs - Debugging toolset for ARM and RISC-V
- **PlatformIO**: https://platformio.org/ - Professional embedded development platform
- **Zephyr Project**: https://zephyrproject.org/ - Scalable RTOS for IoT

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Claude Skills Found | 5 |
| Claude Subagents Found | 3 |
| MCP Servers - Hardware/Debug | 6 |
| MCP Servers - Serial Comm | 5 |
| MCP Servers - IoT Platforms | 8 |
| MCP Servers - Industrial | 3 |
| MCP Servers - Design/CAD | 3 |
| Curated Collections | 6 |
| **Total References** | **39** |
| Backlog Skills Covered | 14/20 (70%) |
| Backlog Agents Covered | 7/12 (58%) |
| Identified Gaps | 11 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Community References Documented
**Next Step**: Phase 6 - Implement specialized skills and agents (prioritize gap areas)
