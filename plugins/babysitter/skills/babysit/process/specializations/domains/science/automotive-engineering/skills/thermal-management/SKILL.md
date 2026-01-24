---
name: thermal-management
description: Vehicle and powertrain thermal management system design
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
    - systems-engineering
    - thermal
    - hvac
    - cooling
---

# Thermal Management Skill

## Purpose
Enable vehicle and powertrain thermal management system design for optimal component temperatures and cabin comfort.

## Capabilities
- 1D thermal system modeling (GT-SUITE, Amesim)
- Heat exchanger sizing
- Coolant circuit design
- HVAC system integration
- Battery thermal management
- Waste heat recovery analysis
- Thermal preconditioning strategy
- Cabin comfort optimization

## Usage Guidelines
- Model thermal system with appropriate fidelity
- Size components for worst-case thermal conditions
- Design coolant circuits for efficient heat transfer
- Integrate HVAC for cabin comfort and battery cooling
- Implement preconditioning for cold climate performance
- Validate thermal performance through testing

## Dependencies
- GT-SUITE
- Amesim
- STAR-CCM+
- CFD tools

## Process Integration
- PTE-001: Battery System Design and Validation
- PTE-002: Electric Drive Unit Development
- PTE-003: Hybrid Powertrain Integration
