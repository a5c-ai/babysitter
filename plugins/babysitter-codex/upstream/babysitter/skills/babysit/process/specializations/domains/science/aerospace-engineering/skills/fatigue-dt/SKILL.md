---
name: fatigue-dt
description: Specialized skill for fatigue life prediction and damage tolerance assessment
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
    - structural-analysis
    - fatigue
    - damage-tolerance
    - certification
---

# Fatigue and Damage Tolerance Skill

## Purpose
Provide specialized fatigue life prediction and damage tolerance assessment capabilities for airworthiness certification and structural integrity management.

## Capabilities
- S-N and strain-life analysis
- Crack growth analysis (NASGRO, AFGROW)
- Inspection interval determination
- Damage tolerance substantiation
- Spectrum loading analysis
- Mean stress correction methods
- Multi-site damage assessment
- Certification evidence generation

## Usage Guidelines
- Use appropriate fatigue methodology based on structural criticality
- Select material data from qualified sources (MMPDS, ESDU)
- Apply appropriate scatter factors per regulatory requirements
- Consider environmental effects on fatigue and crack growth
- Define inspection intervals with adequate safety margins
- Document all assumptions and conservatisms in certification reports

## Dependencies
- NASGRO
- AFGROW
- Fe-Safe
- nCode DesignLife

## Process Integration
- AE-008: Fatigue and Damage Tolerance
- AE-021: Certification Planning
