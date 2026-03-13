---
name: can-bus
description: CAN/CAN-FD bus analysis and development expertise
category: Communication Protocols
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# CAN Bus Skill

## Overview

This skill provides comprehensive CAN and CAN-FD bus analysis, development, and debugging capabilities for automotive and industrial embedded systems.

## Capabilities

### Message Frame Operations
- CAN message frame generation
- Frame analysis and decoding
- Identifier filtering and masking
- Standard (11-bit) and extended (29-bit) IDs
- Remote frame handling

### DBC File Support
- DBC file parsing and generation
- Signal decoding and encoding
- Message definition management
- Physical value scaling
- Multiplexed signal support

### Protocol Support
- CAN 2.0A/B compliance
- CAN-FD configuration and validation
- J1939 transport protocol
- CANopen communication
- UDS (ISO 14229) diagnostics
- ISO-TP (ISO 15765-2)

### Bus Analysis
- Bus arbitration analysis
- Error frame detection and analysis
- Bus-off recovery monitoring
- Bus load calculation
- Bit timing verification
- Network topology analysis

### Gateway Operations
- Message routing configuration
- Gateway bridge setup
- Protocol translation
- Filtering and forwarding rules

## Target Processes

- `device-driver-development.js` - CAN driver implementation
- `signal-integrity-testing.js` - CAN bus signal validation
- `hw-sw-interface-specification.js` - CAN interface definition
- `functional-safety-certification.js` - CAN safety requirements

## Dependencies

- CAN interface tools (PEAK, Vector, Kvaser)
- DBC files for signal decoding
- CAN analyzer hardware
- SocketCAN (Linux)

## Usage Context

This skill is invoked when tasks require:
- CAN driver development
- Bus communication debugging
- DBC-based signal analysis
- Protocol stack implementation
- Automotive networking

## Configuration Examples

### CAN Bit Timing
```yaml
can:
  bitrate: 500000  # 500 kbps
  sample_point: 87.5
  sjw: 1
  seg1: 13
  seg2: 2
  prescaler: 4
```

### CAN-FD Configuration
```yaml
can_fd:
  nominal_bitrate: 500000
  data_bitrate: 2000000
  brs: enabled  # Bit Rate Switch
  esi: enabled  # Error State Indicator
```

### DBC Signal Definition
```dbc
BO_ 0x123 EngineData: 8 ECU
 SG_ EngineRPM : 0|16@1+ (0.25,0) [0|16383.75] "rpm" Vector__XXX
 SG_ EngineTemp : 16|8@1+ (1,-40) [-40|215] "C" Vector__XXX
```
