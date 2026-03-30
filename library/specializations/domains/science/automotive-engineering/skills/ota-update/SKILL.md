---
name: ota-update
description: Over-the-air software update system design and implementation
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
    - ota
    - update
    - connectivity
---

# OTA Update Skill

## Purpose
Enable over-the-air software update system design and implementation for secure and reliable vehicle software management.

## Capabilities
- SOTA/FOTA architecture design
- Delta update generation
- Update orchestration logic
- Rollback mechanism implementation
- Vehicle state management during update
- Update campaign management
- Multi-ECU update sequencing
- Secure download implementation

## Usage Guidelines
- Design OTA architecture for security and reliability
- Implement delta updates for bandwidth efficiency
- Ensure robust rollback for failed updates
- Manage vehicle state during update process
- Sequence multi-ECU updates correctly
- Document update procedures and safety considerations

## Dependencies
- Uptane framework
- AWS IoT
- Azure IoT
- OEM backend systems

## Process Integration
- ASD-004: Over-the-Air (OTA) Update Implementation
- SAF-004: Cybersecurity Engineering (ISO/SAE 21434)
- ASD-001: AUTOSAR Architecture Implementation
