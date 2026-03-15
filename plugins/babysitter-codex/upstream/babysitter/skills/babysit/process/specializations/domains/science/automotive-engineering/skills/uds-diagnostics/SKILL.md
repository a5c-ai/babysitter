---
name: uds-diagnostics
description: Unified Diagnostic Services implementation and validation expertise
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
    - automotive-software
    - diagnostics
    - uds
    - obd
---

# UDS Diagnostics Skill

## Purpose
Provide Unified Diagnostic Services implementation and validation expertise for automotive ECU diagnostics and OBD compliance.

## Capabilities
- UDS service implementation (ISO 14229)
- DTC configuration and memory management
- ODX/PDX file generation
- Security access implementation
- Routine control design
- Data identifier (DID) configuration
- OBD-II legislated service implementation
- Diagnostic session management

## Usage Guidelines
- Implement UDS services per ISO 14229 specifications
- Configure DTCs with appropriate detection and storage
- Generate ODX files for diagnostic tool compatibility
- Implement security access for protected functions
- Design routine controls for manufacturing and service
- Validate OBD compliance for emissions certification

## Dependencies
- Vector CANoe/CANdela
- ODX Studio
- Diagnostic testers

## Process Integration
- ASD-003: Diagnostic Implementation (UDS/OBD)
- ASD-001: AUTOSAR Architecture Implementation
- TVL-003: Homologation and Type Approval
