---
name: spacecraft-power
description: Skill for spacecraft power system sizing and analysis
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
    - space-systems
    - power-systems
    - solar-arrays
    - batteries
---

# Spacecraft Power Analysis Skill

## Purpose
Enable comprehensive spacecraft power system sizing and analysis including solar array design, battery selection, and power budget management.

## Capabilities
- Power budget development
- Solar array sizing and configuration
- Battery sizing and selection
- Eclipse and sunlight power analysis
- Power regulation topology selection
- Worst-case power analysis
- End-of-life degradation modeling
- Load scheduling optimization

## Usage Guidelines
- Define power requirements for all mission phases and modes
- Account for solar array degradation over mission life
- Size batteries for worst-case eclipse duration
- Include power system losses in budget calculations
- Consider thermal effects on power generation and storage
- Document power budget margins and assumptions

## Dependencies
- MATLAB
- Power system modeling tools
- Spacecraft design software

## Process Integration
- AE-016: Spacecraft Power Budget Analysis
