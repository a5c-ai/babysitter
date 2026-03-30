---
name: protocol-analyzer
description: Serial protocol analysis and debugging for common embedded interfaces (I2C, SPI, UART)
category: Communication Protocols
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Protocol Analyzer Skill

## Overview

This skill provides serial protocol analysis and debugging capabilities for common embedded communication interfaces including I2C, SPI, and UART.

## Capabilities

### I2C Analysis
- Bus address detection and scanning
- Transaction decoding and timing
- NACK handling and error detection
- Multi-master arbitration analysis
- Clock stretching detection
- 7-bit and 10-bit addressing
- Fast mode and fast mode plus support

### SPI Analysis
- Transaction decoding
- Mode configuration (CPOL/CPHA)
- Clock frequency analysis
- Chip select timing verification
- Full-duplex data capture
- Multi-slave configurations

### UART Analysis
- Frame analysis and decoding
- Baud rate auto-detection
- Parity and stop bit verification
- Flow control analysis (RTS/CTS)
- Break condition detection
- Error frame identification

### Timing Analysis
- Setup and hold time verification
- Clock frequency measurement
- Inter-frame timing analysis
- Protocol timing compliance
- Glitch and noise detection

### Integration
- Saleae Logic analyzer integration
- Sigrok/PulseView support
- Protocol decoder libraries
- Export to standard formats

## Target Processes

- `device-driver-development.js` - Driver debugging and validation
- `hardware-bring-up.js` - Initial communication verification
- `signal-integrity-testing.js` - Protocol signal analysis
- `bsp-development.js` - BSP communication testing

## Dependencies

- Logic analyzer software (Saleae Logic, Sigrok)
- Protocol decoder libraries
- Logic analyzer hardware

## Usage Context

This skill is invoked when tasks require:
- Serial protocol debugging
- Communication timing verification
- Bus error diagnosis
- Protocol compliance testing
- Multi-device communication analysis

## Protocol Configurations

### I2C Standard Settings
```yaml
i2c:
  mode: standard | fast | fast_plus | high_speed
  addressing: 7bit | 10bit
  clock_stretching: enabled | disabled
```

### SPI Mode Settings
```yaml
spi:
  mode: 0 | 1 | 2 | 3  # CPOL/CPHA combinations
  bit_order: msb_first | lsb_first
  word_size: 8 | 16 | 32
```

### UART Settings
```yaml
uart:
  baud_rate: 9600 | 115200 | etc.
  data_bits: 7 | 8 | 9
  parity: none | even | odd
  stop_bits: 1 | 2
```
