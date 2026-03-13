---
name: jtag-swd-debug
description: Deep integration with JTAG/SWD debug probes for hardware-level debugging and flash programming
category: Hardware Debugging
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# JTAG/SWD Debug Skill

## Overview

This skill provides deep integration with JTAG/SWD debug probes for hardware-level debugging, flash programming, and real-time firmware analysis. It enables direct hardware interaction through industry-standard debug interfaces.

## Capabilities

### Debug Probe Operations
- Execute OpenOCD, J-Link, and ST-LINK commands
- Configure debug probe connections and interfaces
- Manage multiple debug probe types and adapters
- Handle transport protocols (JTAG, SWD, cJTAG)

### Memory Operations
- Read/write memory-mapped registers
- Direct memory inspection and modification
- Real-time memory watch and modification
- Flash programming and verification
- Memory dump and analysis

### Debugging Features
- Set hardware breakpoints and watchpoints
- Core state inspection (registers, stack, PC)
- Single-step execution control
- Fault handler analysis and debugging
- Call stack unwinding

### Trace and Output
- Semihosting input/output support
- SWO trace output configuration
- ITM stimulus port configuration
- Real-time trace buffer analysis

## Target Processes

- `hardware-bring-up.js` - Initial board validation and debug setup
- `bootloader-implementation.js` - Bootloader debugging and flash operations
- `device-driver-development.js` - Driver debugging with hardware access
- `field-diagnostics.js` - Field debugging and analysis

## Dependencies

- OpenOCD (Open On-Chip Debugger)
- J-Link software (Segger)
- ST-LINK utilities (STMicroelectronics)
- Debug probe hardware (J-Link, ST-LINK, CMSIS-DAP)

## Usage Context

This skill is invoked when tasks require:
- Direct hardware debugging through JTAG/SWD
- Flash memory programming operations
- Low-level register and memory inspection
- Fault analysis and crash debugging
- Hardware breakpoint management

## Configuration

```yaml
debug_probe:
  type: jlink | stlink | openocd | cmsis-dap
  interface: swd | jtag
  speed: 4000  # kHz
  target: cortex-m4 | cortex-m7 | etc.
```

## Example Operations

### Flash Programming
```bash
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
  -c "program firmware.elf verify reset exit"
```

### Memory Read
```bash
JLinkExe -device STM32F407VG -if SWD -speed 4000 \
  -CommanderScript read_memory.jlink
```

### Register Inspection
```bash
openocd -f board/stm32f4discovery.cfg \
  -c "init; halt; reg; resume; exit"
```
