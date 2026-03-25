# JTAG/SWD Debug Skill

Hardware-level debugging skill for embedded systems using JTAG and SWD debug interfaces.

## Purpose

Provides deep integration with debug probes (J-Link, ST-LINK, OpenOCD) for:
- Flash programming and verification
- Real-time memory and register inspection
- Hardware breakpoints and watchpoints
- Fault analysis and crash debugging
- Semihosting and trace output

## Key Features

- Multi-probe support (J-Link, ST-LINK, CMSIS-DAP, OpenOCD)
- Memory-mapped register access
- Core state inspection and control
- SWO/ITM trace output
- Fault handler debugging

## Integration

Used by processes requiring direct hardware interaction:
- Hardware bring-up validation
- Bootloader development and debugging
- Device driver debugging
- Field diagnostics

## Dependencies

- OpenOCD, J-Link software, or ST-LINK utilities
- Compatible debug probe hardware
- Target device support files
