---
name: safety-assessment
description: Skill for structured safety assessment following ARP4761 guidelines
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
  category: aerospace-engineering
  tags:
    - certification
    - safety
    - arp4761
    - hazard-analysis
---

# Safety Assessment (ARP4761) Skill

## Purpose
Enable structured safety assessment following ARP4761 guidelines including functional hazard assessment, fault tree analysis, and safety case development.

## Capabilities
- Functional Hazard Assessment (FHA)
- Preliminary System Safety Assessment (PSSA)
- System Safety Assessment (SSA)
- Fault Tree Analysis (FTA) construction
- FMEA/FMECA development
- Common Cause Analysis (CCA)
- Particular risk analysis
- Safety case documentation

## Usage Guidelines
- Conduct FHA early in development to establish safety requirements
- Develop PSSA to allocate safety requirements to system architecture
- Perform detailed FMEA and FTA for critical systems
- Identify and mitigate common cause failures
- Document safety case with clear evidence linkage
- Update safety assessment as design evolves

## Dependencies
- Isograph
- ReliaSoft
- Safety assessment tools

## Process Integration
- AE-022: Safety Assessment (ARP4761)
- AE-021: Certification Planning
