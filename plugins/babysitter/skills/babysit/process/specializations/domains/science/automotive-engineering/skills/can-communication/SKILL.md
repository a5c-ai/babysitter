---
name: can-communication
description: CAN bus design, analysis, and diagnostics expertise
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: automotive-engineering
  tags:
    - vehicle-networks
    - can
    - can-fd
    - communication
---

# CAN/CAN-FD Communication Skill

## Purpose
Provide CAN bus design, analysis, and diagnostics expertise for automotive network development and troubleshooting.

## Capabilities
- DBC file creation and parsing
- CAN message scheduling and bus load analysis
- CAN-FD configuration and migration
- J1939 and CANopen protocol support
- Network topology design
- Gateway routing configuration
- Error frame analysis and bus-off handling
- XCP/CCP calibration protocol

## Usage Guidelines
- Design CAN networks with appropriate bus load margins
- Schedule messages to avoid collisions and ensure timing
- Configure CAN-FD for increased bandwidth applications
- Implement proper error handling and recovery
- Use appropriate termination and topology
- Document network design and message definitions

## Dependencies
- Vector CANoe
- CANalyzer
- PEAK PCAN tools
- DBC editors

## Process Integration
- ASD-001: AUTOSAR Architecture Implementation
- ASD-002: ECU Software Development and Testing
- ASD-003: Diagnostic Implementation (UDS/OBD)
- TVL-002: Hardware-in-the-Loop Testing
