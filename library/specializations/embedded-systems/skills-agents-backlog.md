# Embedded Systems Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Embedded Systems Engineering processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, hardware interaction capabilities, and integration with specialized embedded development tooling.

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
All 26 implemented processes in this specialization currently use generic agent names for task execution (e.g., `embedded-engineer`, `test-engineer`, `technical-writer`). While functional, this approach lacks domain-specific optimizations that specialized skills and agents with deep embedded systems knowledge could provide.

### Goals
- Provide deep expertise in specific embedded development tools, MCUs, and platforms
- Enable automated validation with real hardware debugging tools (JTAG/SWD)
- Reduce context-switching overhead for low-level hardware-software integration tasks
- Improve accuracy and efficiency of firmware development and debugging operations
- Support communication protocol analysis and validation (I2C, SPI, UART, CAN)

---

## Skills Backlog

### SK-001: JTAG/SWD Debug Skill
**Slug**: `jtag-swd-debug`
**Category**: Hardware Debugging

**Description**: Deep integration with JTAG/SWD debug probes for hardware-level debugging and flash programming.

**Capabilities**:
- Execute OpenOCD, J-Link, and ST-LINK commands
- Read/write memory-mapped registers
- Set hardware breakpoints and watchpoints
- Flash programming and verification
- Core state inspection (registers, stack)
- Semihosting and SWO trace output
- Real-time memory watch and modification
- Fault handler analysis and debugging

**Process Integration**:
- hardware-bring-up.js
- bootloader-implementation.js
- device-driver-development.js
- field-diagnostics.js

**Dependencies**: OpenOCD, J-Link software, ST-LINK utilities, probe hardware

---

### SK-002: FreeRTOS Integration Skill
**Slug**: `freertos-integration`
**Category**: RTOS

**Description**: Expert skill for FreeRTOS configuration, debugging, and optimization.

**Capabilities**:
- Generate FreeRTOSConfig.h with optimal settings
- Task creation and priority analysis
- Queue, semaphore, and mutex configuration
- Stack usage analysis and optimization
- Kernel-aware debugging interpretation
- Tickless idle mode configuration
- Task timing analysis and WCET estimation
- Memory pool configuration (heap schemes)

**Process Integration**:
- rtos-integration.js
- real-time-performance-validation.js
- low-power-design.js
- execution-speed-profiling.js

**Dependencies**: FreeRTOS source, kernel-aware debugger plugins

---

### SK-003: Zephyr RTOS Skill
**Slug**: `zephyr-rtos`
**Category**: RTOS

**Description**: Specialized skill for Zephyr RTOS development and configuration.

**Capabilities**:
- Device tree overlay generation
- Kconfig configuration management
- West build system operation
- Zephyr networking stack configuration
- Bluetooth stack configuration
- Zephyr logging and shell setup
- Power management framework configuration
- MCUboot integration for secure boot

**Process Integration**:
- rtos-integration.js
- secure-boot-implementation.js
- ota-firmware-update.js
- low-power-design.js

**Dependencies**: Zephyr SDK, West tool, device trees

---

### SK-004: Protocol Analyzer Skill (I2C/SPI/UART)
**Slug**: `protocol-analyzer`
**Category**: Communication Protocols

**Description**: Serial protocol analysis and debugging for common embedded interfaces.

**Capabilities**:
- I2C bus analysis (address detection, NACK handling)
- SPI transaction decoding (mode, clock, polarity)
- UART frame analysis and baud rate detection
- Generate protocol transaction sequences
- Timing analysis and setup/hold verification
- Multi-master I2C arbitration analysis
- Error detection and protocol violation identification
- Integration with Saleae Logic and similar analyzers

**Process Integration**:
- device-driver-development.js
- hardware-bring-up.js
- signal-integrity-testing.js
- bsp-development.js

**Dependencies**: Logic analyzer software, protocol decoder libraries

---

### SK-005: CAN Bus Skill
**Slug**: `can-bus`
**Category**: Communication Protocols

**Description**: CAN/CAN-FD bus analysis and development expertise.

**Capabilities**:
- CAN message frame generation and analysis
- DBC file parsing and signal decoding
- CAN bus arbitration and error analysis
- J1939 and CANopen protocol support
- CAN-FD configuration and validation
- Bus load calculation and optimization
- Error frame analysis and bus-off recovery
- Gateway and routing configuration

**Process Integration**:
- device-driver-development.js
- signal-integrity-testing.js
- hw-sw-interface-specification.js
- functional-safety-certification.js

**Dependencies**: CAN interface tools, DBC files, PEAK/Vector/Kvaser tools

---

### SK-006: ARM Cortex-M Skill
**Slug**: `arm-cortex-m`
**Category**: Microcontroller Architecture

**Description**: Deep expertise in ARM Cortex-M architecture and peripherals.

**Capabilities**:
- CMSIS configuration and usage
- NVIC interrupt priority configuration
- MPU region setup and protection
- SysTick and DWT timer configuration
- Fault handler analysis (HardFault, BusFault, etc.)
- ARM assembly optimization for critical sections
- Low-power mode configuration (WFI/WFE)
- Bit-banding and atomic operations

**Process Integration**:
- bsp-development.js
- isr-design.js
- memory-architecture-planning.js
- real-time-architecture-design.js
- bootloader-implementation.js

**Dependencies**: ARM CMSIS, Cortex-M documentation

---

### SK-007: STM32 HAL/LL Skill
**Slug**: `stm32-hal`
**Category**: Vendor-Specific

**Description**: STMicroelectronics STM32 HAL and Low-Level driver expertise.

**Capabilities**:
- STM32CubeMX configuration interpretation
- HAL driver usage and customization
- Low-Level (LL) driver optimization
- STM32 clock tree configuration
- DMA stream/channel configuration
- Peripheral interrupt configuration
- USB device/host stack integration
- STM32 power mode configuration

**Process Integration**:
- bsp-development.js
- device-driver-development.js
- dma-optimization.js
- low-power-design.js
- hardware-bring-up.js

**Dependencies**: STM32CubeMX, STM32 HAL, STM32CubeIDE

---

### SK-008: Nordic nRF Skill
**Slug**: `nordic-nrf`
**Category**: Vendor-Specific

**Description**: Nordic Semiconductor nRF5x/nRF Connect SDK expertise.

**Capabilities**:
- nRF Connect SDK configuration
- Bluetooth Low Energy stack configuration
- Bluetooth Mesh implementation
- Nordic power profiling tools integration
- Soft device configuration
- nRF logging and RTT debugging
- GATT service generation
- Thread/Matter protocol support

**Process Integration**:
- bsp-development.js
- low-power-design.js
- power-consumption-profiling.js
- ota-firmware-update.js

**Dependencies**: nRF Connect SDK, nRF Command Line Tools, Segger RTT

---

### SK-009: Power Profiler Skill
**Slug**: `power-profiler`
**Category**: Power Analysis

**Description**: Power consumption measurement and analysis expertise.

**Capabilities**:
- Power analyzer tool integration (Otii, PPK2, Joulescope)
- Current measurement configuration and calibration
- Power mode transition analysis
- Battery life estimation calculations
- Power profile comparison and trending
- Peripheral power contribution analysis
- Sleep mode leakage identification
- Energy-per-operation measurements

**Process Integration**:
- power-consumption-profiling.js
- low-power-design.js
- real-time-performance-validation.js

**Dependencies**: Power analyzer hardware and software (Otii Arc, Nordic PPK2, Joulescope)

---

### SK-010: Memory Analysis Skill
**Slug**: `memory-analysis`
**Category**: Resource Optimization

**Description**: Embedded memory analysis, optimization, and leak detection.

**Capabilities**:
- Linker map file analysis
- Stack usage analysis (static and dynamic)
- Heap fragmentation analysis
- Memory region allocation optimization
- Section placement and alignment
- Flash vs RAM trade-off analysis
- Memory protection unit configuration
- Buffer overflow detection strategies

**Process Integration**:
- memory-architecture-planning.js
- code-size-optimization.js
- execution-speed-profiling.js
- bootloader-implementation.js

**Dependencies**: Linker map parsers, stack analyzers, Puncover

---

### SK-011: MISRA C Static Analysis Skill
**Slug**: `misra-c-analysis`
**Category**: Code Quality

**Description**: MISRA C compliance checking and static analysis integration.

**Capabilities**:
- MISRA C:2012 rule checking
- PC-lint/Cppcheck/Coverity integration
- Violation categorization and reporting
- Deviation record generation
- Coding standard enforcement
- Polyspace integration
- CERT C guideline checking
- Custom rule configuration

**Process Integration**:
- misra-c-compliance.js
- functional-safety-certification.js
- device-driver-development.js

**Dependencies**: Static analysis tools (PC-lint, Cppcheck, Coverity, Polyspace)

---

### SK-012: Unity/Ceedling Test Skill
**Slug**: `unity-ceedling-test`
**Category**: Testing

**Description**: Embedded unit testing with Unity framework and CMock.

**Capabilities**:
- Unity test case generation
- CMock mock generation for HAL/drivers
- Test runner configuration
- Hardware register mocking strategies
- Test coverage analysis (gcov)
- Ceedling project configuration
- Test fixture design for embedded
- Off-target testing setup

**Process Integration**:
- embedded-unit-testing.js
- device-driver-development.js
- bsp-development.js

**Dependencies**: Unity, CMock, Ceedling, gcov

---

### SK-013: Oscilloscope/Logic Analyzer Skill
**Slug**: `scope-logic-analyzer`
**Category**: Hardware Debugging

**Description**: Test equipment integration for signal analysis.

**Capabilities**:
- Oscilloscope measurement automation
- Logic analyzer capture configuration
- Protocol decoding setup
- Timing measurement and verification
- Signal integrity analysis (rise/fall times)
- FFT and frequency analysis
- Trigger configuration for events
- Measurement export and reporting

**Process Integration**:
- signal-integrity-testing.js
- hardware-bring-up.js
- real-time-performance-validation.js

**Dependencies**: Oscilloscope/logic analyzer software APIs (Keysight, Tektronix, Rigol, Saleae)

---

### SK-014: Linker Script Skill
**Slug**: `linker-script`
**Category**: Build System

**Description**: GNU linker script generation and optimization.

**Capabilities**:
- Memory region definition
- Section placement configuration
- Symbol generation for bootloader/app interfaces
- Multi-image linking (bootloader + app)
- Overlay and bank switching support
- Custom section creation
- Fill pattern and checksum placement
- MPU-aligned region configuration

**Process Integration**:
- memory-architecture-planning.js
- bootloader-implementation.js
- bsp-development.js
- code-size-optimization.js

**Dependencies**: GNU linker documentation, MCU memory maps

---

### SK-015: OTA Update Skill
**Slug**: `ota-firmware-update`
**Category**: Deployment

**Description**: Over-the-air firmware update implementation expertise.

**Capabilities**:
- Delta update generation (diff algorithms)
- Image signing and encryption
- Update manifest generation
- MCUboot configuration
- A/B partition management
- Rollback mechanism implementation
- Cloud integration (AWS IoT, Azure IoT Hub)
- Update progress and status reporting

**Process Integration**:
- ota-firmware-update.js
- secure-boot-implementation.js
- bootloader-implementation.js

**Dependencies**: MCUboot, image signing tools, compression libraries

---

### SK-016: Cryptographic Operations Skill
**Slug**: `embedded-crypto`
**Category**: Security

**Description**: Embedded cryptographic operations and secure element integration.

**Capabilities**:
- Hardware crypto accelerator usage
- AES/SHA/ECC implementation
- Secure key storage configuration
- TrustZone configuration (Cortex-M33/M55)
- Secure boot chain implementation
- Certificate management
- Random number generation (TRNG)
- Side-channel attack mitigation

**Process Integration**:
- secure-boot-implementation.js
- functional-safety-certification.js
- ota-firmware-update.js
- secrets-management.js

**Dependencies**: mbedTLS, wolfSSL, hardware crypto documentation

---

### SK-017: USB Stack Skill
**Slug**: `usb-stack`
**Category**: Communication Protocols

**Description**: USB device and host stack implementation expertise.

**Capabilities**:
- USB descriptor generation
- Device class implementation (CDC, HID, MSC, DFU)
- USB enumeration debugging
- TinyUSB/STM32 USB stack configuration
- USB protocol analysis
- DFU bootloader implementation
- USB power delivery configuration
- Composite device configuration

**Process Integration**:
- device-driver-development.js
- bootloader-implementation.js
- hw-sw-interface-specification.js

**Dependencies**: TinyUSB, STM32 USB stack, USB analyzer tools

---

### SK-018: Wireless Protocol Skill
**Slug**: `wireless-protocols`
**Category**: Communication Protocols

**Description**: Embedded wireless protocol implementation (LoRa, Zigbee, Thread, Matter).

**Capabilities**:
- LoRaWAN stack configuration
- Zigbee coordinator/router/end device setup
- Thread network configuration
- Matter device implementation
- RF testing and certification preparation
- Antenna matching network analysis
- Power amplifier configuration
- Frequency hopping implementation

**Process Integration**:
- device-driver-development.js
- low-power-design.js
- functional-safety-certification.js

**Dependencies**: LoRaWAN stack, Zigbee SDK, OpenThread, Matter SDK

---

### SK-019: Motor Control Skill
**Slug**: `motor-control`
**Category**: Application-Specific

**Description**: Motor control algorithms and driver implementation.

**Capabilities**:
- PWM generation for motor control
- FOC (Field-Oriented Control) implementation
- Encoder/Hall sensor interface
- Current sensing configuration
- Speed and position control loops
- Motor parameter identification
- Gate driver configuration
- Sensorless control algorithms

**Process Integration**:
- device-driver-development.js
- real-time-architecture-design.js
- isr-design.js

**Dependencies**: Motor control libraries, current sensing hardware

---

### SK-020: Doxygen/Documentation Skill
**Slug**: `embedded-docs`
**Category**: Documentation

**Description**: Embedded firmware documentation generation and maintenance.

**Capabilities**:
- Doxygen comment generation
- API documentation structure
- Hardware interface documentation
- Memory map documentation
- Call graph and dependency visualization
- Version changelog management
- Register documentation formatting
- Integration with Sphinx/MkDocs

**Process Integration**:
- firmware-api-documentation.js
- hw-sw-interface-specification.js
- version-control-config-management.js

**Dependencies**: Doxygen, Graphviz, Sphinx

---

---

## Agents Backlog

### AG-001: Firmware Architect Agent
**Slug**: `firmware-architect`
**Category**: Architecture

**Description**: Senior architect for embedded system firmware architecture decisions.

**Expertise Areas**:
- Layered firmware architecture design
- HAL/driver/application separation
- State machine design patterns
- Memory partitioning strategies
- Bootloader/application interface design
- Multi-core firmware architecture
- Firmware modularity and reusability
- Performance vs resource trade-offs

**Persona**:
- Role: Principal Firmware Architect
- Experience: 12+ years embedded systems
- Background: Automotive, medical, industrial automation

**Process Integration**:
- real-time-architecture-design.js (all phases)
- memory-architecture-planning.js (all phases)
- hardware-software-codesign.js (architecture phases)
- isr-design.js (design phases)

---

### AG-002: RTOS Expert Agent
**Slug**: `rtos-expert`
**Category**: Real-Time Systems

**Description**: Specialized agent with deep RTOS knowledge across multiple platforms.

**Expertise Areas**:
- FreeRTOS, Zephyr, ThreadX internals
- Real-time scheduling theory (RMS, EDF)
- Priority inversion and deadlock prevention
- Task synchronization patterns
- RTOS performance tuning
- Deterministic timing analysis
- WCET analysis methodology
- Real-time Linux (PREEMPT_RT)

**Persona**:
- Role: Senior RTOS Engineer
- Experience: 10+ years real-time systems
- Background: Aerospace, automotive RTOS development

**Process Integration**:
- rtos-integration.js (all phases)
- real-time-performance-validation.js (all phases)
- isr-design.js (priority analysis)
- real-time-architecture-design.js (scheduling design)

---

### AG-003: Hardware Bring-Up Specialist Agent
**Slug**: `hw-bringup-specialist`
**Category**: Hardware Integration

**Description**: Expert in new hardware platform bring-up and validation.

**Expertise Areas**:
- Power supply sequencing validation
- Clock tree configuration and verification
- Debug interface setup (JTAG/SWD)
- Peripheral functional validation
- Oscilloscope/logic analyzer usage
- First-light firmware development
- PCB debugging techniques
- Schematic review and validation

**Persona**:
- Role: Senior Hardware Bring-Up Engineer
- Experience: 8+ years hardware-software integration
- Background: PCB design awareness, lab equipment expertise

**Process Integration**:
- hardware-bring-up.js (all phases)
- bsp-development.js (initial development)
- signal-integrity-testing.js (validation phases)

---

### AG-004: Device Driver Expert Agent
**Slug**: `device-driver-expert`
**Category**: Low-Level Software

**Description**: Specialist in device driver development for embedded systems.

**Expertise Areas**:
- Register-level peripheral programming
- DMA configuration and optimization
- Interrupt handling best practices
- Hardware abstraction layer design
- Driver state machine patterns
- Power management in drivers
- Driver testing with mocks
- Cross-platform driver portability

**Persona**:
- Role: Senior Device Driver Engineer
- Experience: 8+ years driver development
- Background: Linux kernel drivers, bare-metal drivers

**Process Integration**:
- device-driver-development.js (all phases)
- bsp-development.js (driver phases)
- dma-optimization.js (all phases)
- isr-design.js (interrupt handling)

---

### AG-005: Embedded Security Expert Agent
**Slug**: `embedded-security-expert`
**Category**: Security

**Description**: Security specialist for embedded and IoT systems.

**Expertise Areas**:
- Secure boot implementation
- Chain of trust design
- Hardware security modules (HSM)
- TrustZone configuration
- Cryptographic best practices
- Secure firmware updates
- Side-channel attack mitigation
- Security certifications (PSA, SESIP)

**Persona**:
- Role: Embedded Security Architect
- Experience: 8+ years embedded security
- Background: Cryptography, penetration testing, IoT security

**Process Integration**:
- secure-boot-implementation.js (all phases)
- functional-safety-certification.js (security aspects)
- ota-firmware-update.js (security phases)

---

### AG-006: Power Optimization Expert Agent
**Slug**: `power-optimization-expert`
**Category**: Low-Power Design

**Description**: Expert in ultra-low-power embedded system design.

**Expertise Areas**:
- Sleep mode optimization
- Power state machines
- Peripheral power gating
- Clock gating strategies
- Wake-up source optimization
- Battery life estimation
- Power measurement techniques
- Dynamic voltage/frequency scaling

**Persona**:
- Role: Low-Power Design Engineer
- Experience: 7+ years battery-powered devices
- Background: Wearables, IoT sensors, medical devices

**Process Integration**:
- power-consumption-profiling.js (all phases)
- low-power-design.js (all phases)
- dma-optimization.js (power aspects)

---

### AG-007: Safety Compliance Expert Agent
**Slug**: `safety-compliance-expert`
**Category**: Functional Safety

**Description**: Functional safety and compliance specialist for safety-critical systems.

**Expertise Areas**:
- ISO 26262 (automotive) compliance
- IEC 61508 (industrial) requirements
- DO-178C (aerospace) guidelines
- IEC 62304 (medical) standards
- FMEA and FTA analysis
- Safety requirements traceability
- MISRA C compliance
- Safety case documentation

**Persona**:
- Role: Functional Safety Engineer
- Experience: 10+ years safety-critical systems
- Background: Automotive ASIL-D, medical Class III

**Process Integration**:
- functional-safety-certification.js (all phases)
- misra-c-compliance.js (all phases)
- real-time-performance-validation.js (safety validation)

---

### AG-008: Embedded Test Engineer Agent
**Slug**: `embedded-test-engineer`
**Category**: Testing

**Description**: Specialist in embedded software testing methodologies.

**Expertise Areas**:
- Unit testing with hardware mocks
- Integration testing strategies
- HIL test environment setup
- Code coverage analysis
- Boundary value testing
- Stress and endurance testing
- Regression test automation
- Test-driven development for embedded

**Persona**:
- Role: Senior Embedded Test Engineer
- Experience: 7+ years embedded testing
- Background: Automotive validation, medical device testing

**Process Integration**:
- embedded-unit-testing.js (all phases)
- hil-testing.js (all phases)
- real-time-performance-validation.js (test phases)

---

### AG-009: Bootloader Expert Agent
**Slug**: `bootloader-expert`
**Category**: System Software

**Description**: Specialist in bootloader design and firmware update mechanisms.

**Expertise Areas**:
- Bootloader architecture patterns
- Secure boot chain implementation
- Firmware update protocols
- A/B partition management
- Rollback and recovery mechanisms
- Memory layout optimization
- Boot time optimization
- Multi-stage bootloaders

**Persona**:
- Role: Bootloader/System Software Engineer
- Experience: 8+ years bootloader development
- Background: Automotive ECU, IoT devices, secure systems

**Process Integration**:
- bootloader-implementation.js (all phases)
- ota-firmware-update.js (bootloader integration)
- secure-boot-implementation.js (boot phases)

---

### AG-010: Communication Protocol Expert Agent
**Slug**: `comm-protocol-expert`
**Category**: Connectivity

**Description**: Expert in embedded communication protocols and interfaces.

**Expertise Areas**:
- Serial protocols (UART, SPI, I2C)
- CAN/CAN-FD/LIN automotive buses
- USB device/host stacks
- Ethernet for embedded (lwIP, TCP/IP)
- Wireless protocols (BLE, WiFi, LoRa)
- Protocol state machines
- Timing and synchronization
- Error handling and recovery

**Persona**:
- Role: Senior Protocol Engineer
- Experience: 9+ years protocol implementation
- Background: Automotive networking, industrial protocols

**Process Integration**:
- device-driver-development.js (protocol drivers)
- signal-integrity-testing.js (protocol validation)
- hw-sw-interface-specification.js (interface definition)

---

### AG-011: Performance Optimization Agent
**Slug**: `perf-optimization-expert`
**Category**: Optimization

**Description**: Expert in embedded performance analysis and optimization.

**Expertise Areas**:
- Code profiling and bottleneck identification
- Assembly-level optimization
- Cache and memory optimization
- DMA utilization strategies
- Compiler optimization flags
- Algorithm optimization for embedded
- Interrupt latency optimization
- WCET analysis

**Persona**:
- Role: Performance Engineer
- Experience: 8+ years embedded optimization
- Background: DSP, high-performance embedded, gaming

**Process Integration**:
- execution-speed-profiling.js (all phases)
- code-size-optimization.js (all phases)
- dma-optimization.js (all phases)

---

### AG-012: Technical Documentation Agent
**Slug**: `embedded-tech-writer`
**Category**: Documentation

**Description**: Technical writer specialized in embedded systems documentation.

**Expertise Areas**:
- API documentation standards
- Hardware interface documentation
- Memory map documentation
- Register description formats
- Timing diagram creation
- Integration guides
- Safety documentation requirements
- Doxygen/documentation tools

**Persona**:
- Role: Senior Technical Writer (Embedded)
- Experience: 6+ years embedded documentation
- Background: Semiconductor datasheets, SDK documentation

**Process Integration**:
- firmware-api-documentation.js (all phases)
- hw-sw-interface-specification.js (documentation)
- version-control-config-management.js (release docs)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| hardware-bring-up.js | SK-001, SK-004, SK-013 | AG-003 |
| bsp-development.js | SK-006, SK-007, SK-014 | AG-003, AG-004 |
| device-driver-development.js | SK-001, SK-004, SK-006 | AG-004, AG-010 |
| bootloader-implementation.js | SK-006, SK-010, SK-014, SK-015 | AG-009, AG-005 |
| rtos-integration.js | SK-002, SK-003 | AG-002 |
| hil-testing.js | SK-012, SK-013 | AG-008 |
| embedded-unit-testing.js | SK-012 | AG-008 |
| real-time-performance-validation.js | SK-002, SK-009 | AG-002, AG-008 |
| power-consumption-profiling.js | SK-009 | AG-006 |
| signal-integrity-testing.js | SK-004, SK-005, SK-013 | AG-003, AG-010 |
| hardware-software-codesign.js | SK-006, SK-014 | AG-001 |
| real-time-architecture-design.js | SK-002 | AG-001, AG-002 |
| memory-architecture-planning.js | SK-010, SK-014 | AG-001 |
| isr-design.js | SK-006 | AG-001, AG-004 |
| code-size-optimization.js | SK-010, SK-011 | AG-011 |
| execution-speed-profiling.js | SK-001, SK-010 | AG-011 |
| low-power-design.js | SK-009, SK-002, SK-003 | AG-006 |
| dma-optimization.js | SK-007 | AG-004, AG-011 |
| functional-safety-certification.js | SK-011, SK-016 | AG-007 |
| secure-boot-implementation.js | SK-015, SK-016 | AG-005, AG-009 |
| ota-firmware-update.js | SK-015, SK-016 | AG-009, AG-005 |
| field-diagnostics.js | SK-001, SK-004 | AG-010 |
| version-control-config-management.js | SK-020 | AG-012 |
| hw-sw-interface-specification.js | SK-004, SK-005, SK-017 | AG-004, AG-012 |
| firmware-api-documentation.js | SK-020 | AG-012 |
| misra-c-compliance.js | SK-011 | AG-007 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-004 | Protocol Analyzer (I2C/SPI/UART) | IoT Development, Hardware Testing |
| SK-005 | CAN Bus | Automotive Software, Industrial Automation |
| SK-011 | MISRA C Static Analysis | Safety-Critical Software, Automotive |
| SK-012 | Unity/Ceedling Test | C/C++ Development, Test Automation |
| SK-016 | Cryptographic Operations | Security Engineering, IoT Security |
| SK-017 | USB Stack | Desktop Development, IoT Devices |
| SK-018 | Wireless Protocols | IoT Development, Smart Home |
| SK-020 | Doxygen Documentation | C/C++ Development, API Development |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-005 | Embedded Security Expert | Security Engineering, IoT Security |
| AG-007 | Safety Compliance Expert | Automotive Software, Medical Devices |
| AG-008 | Embedded Test Engineer | QA Testing Automation, Hardware Testing |
| AG-012 | Technical Documentation Agent | Technical Documentation, API Development |

---

## Implementation Priority

### Phase 1: Critical Skills (High Impact)
1. **SK-001**: JTAG/SWD Debug - Core to hardware interaction
2. **SK-002**: FreeRTOS Integration - Most common RTOS
3. **SK-006**: ARM Cortex-M - Dominant architecture
4. **SK-010**: Memory Analysis - Universal need for optimization

### Phase 2: Critical Agents (High Impact)
1. **AG-001**: Firmware Architect - Highest architectural impact
2. **AG-002**: RTOS Expert - Critical for real-time systems
3. **AG-004**: Device Driver Expert - Core to all firmware
4. **AG-003**: Hardware Bring-Up Specialist - First step in all projects

### Phase 3: Testing & Validation
1. **SK-012**: Unity/Ceedling Test
2. **SK-011**: MISRA C Static Analysis
3. **SK-013**: Oscilloscope/Logic Analyzer
4. **AG-008**: Embedded Test Engineer
5. **AG-007**: Safety Compliance Expert

### Phase 4: Communication & Protocols
1. **SK-004**: Protocol Analyzer (I2C/SPI/UART)
2. **SK-005**: CAN Bus
3. **SK-017**: USB Stack
4. **AG-010**: Communication Protocol Expert

### Phase 5: Vendor-Specific & Specialized
1. **SK-007**: STM32 HAL/LL
2. **SK-008**: Nordic nRF
3. **SK-003**: Zephyr RTOS
4. **SK-015**: OTA Update
5. **SK-016**: Cryptographic Operations
6. **AG-005**: Embedded Security Expert
7. **AG-009**: Bootloader Expert

### Phase 6: Optimization & Documentation
1. **SK-009**: Power Profiler
2. **SK-014**: Linker Script
3. **SK-020**: Doxygen Documentation
4. **AG-006**: Power Optimization Expert
5. **AG-011**: Performance Optimization Agent
6. **AG-012**: Technical Documentation Agent

### Phase 7: Application-Specific
1. **SK-018**: Wireless Protocols
2. **SK-019**: Motor Control

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 12 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 4 |
| Total Processes Covered | 26 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
