---
name: iso-26262-compliance
description: Functional safety process and analysis support per ISO 26262
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
    - functional-safety
    - iso-26262
    - asil
    - hazard-analysis
---

# ISO 26262 Compliance Skill

## Purpose
Provide functional safety process and analysis support for automotive systems development following ISO 26262 requirements.

## Capabilities
- Hazard Analysis and Risk Assessment (HARA) templates
- ASIL determination and decomposition
- Safety goal and requirement derivation
- Functional Safety Concept (FSC) development
- Technical Safety Concept (TSC) templates
- FMEA and FTA analysis support
- DFA (Dependent Failure Analysis) guidance
- Safety case structure generation

## Usage Guidelines
- Conduct HARA at item definition phase
- Determine ASIL based on severity, exposure, controllability
- Derive safety goals from identified hazardous events
- Develop FSC and TSC with complete traceability
- Perform FMEA and FTA for safety mechanisms
- Document safety case with clear evidence

## Dependencies
- Medini Analyze
- Enterprise Architect
- DOORS
- PTC Integrity

## Process Integration
- SAF-001: Functional Safety Development (ISO 26262)
- SAF-002: SOTIF Analysis and Validation
- SAF-004: Cybersecurity Engineering (ISO/SAE 21434)
- ASD-002: ECU Software Development and Testing
