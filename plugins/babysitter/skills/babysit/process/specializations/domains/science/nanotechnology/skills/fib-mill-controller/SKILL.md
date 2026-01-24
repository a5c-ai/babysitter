---
name: fib-mill-controller
description: Focused Ion Beam milling skill for site-specific nanofabrication and cross-section preparation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: fabrication
  priority: medium
  phase: 6
  tools-libraries:
    - FIB pattern generators
    - Dual-beam workflow automation
---

# FIB Mill Controller

## Purpose

The FIB Mill Controller skill provides focused ion beam process control for site-specific nanofabrication and sample preparation, enabling precise material removal and deposition at the nanoscale.

## Capabilities

- TEM lamella preparation
- Nanoscale milling and deposition
- Pattern writing and editing
- Cross-section imaging
- Gas-assisted etching/deposition
- Damage minimization protocols

## Usage Guidelines

### FIB Processing

1. **TEM Lamella Preparation**
   - Deposit protective cap
   - Rough mill with high current
   - Fine polish to target thickness

2. **Nanofabrication**
   - Define pattern geometry
   - Optimize beam parameters
   - Minimize gallium implantation

3. **Circuit Editing**
   - Navigate to target location
   - Selective material removal
   - Metal deposition for reconnection

## Process Integration

- Nanodevice Integration Process Flow
- Multi-Modal Nanomaterial Characterization Pipeline

## Input Schema

```json
{
  "operation": "lamella|milling|deposition|cross_section",
  "material": "string",
  "target_thickness": "number (nm, for lamella)",
  "pattern_file": "string (for milling)",
  "beam_voltage": "number (kV)"
}
```

## Output Schema

```json
{
  "process_parameters": {
    "beam_current": "number (pA)",
    "dwell_time": "number (us)",
    "overlap": "number (%)"
  },
  "milling_depth": "number (nm)",
  "lamella_thickness": "number (nm)",
  "damage_layer": "number (nm)",
  "processing_time": "number (minutes)"
}
```
