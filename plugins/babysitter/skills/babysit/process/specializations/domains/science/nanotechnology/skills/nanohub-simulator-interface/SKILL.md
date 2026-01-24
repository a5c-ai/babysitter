---
name: nanohub-simulator-interface
description: NanoHUB tool interface skill for accessing educational and research nanoscience simulations
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: computational
  priority: low
  phase: 6
  tools-libraries:
    - NanoHUB API
    - Rappture toolkit
---

# NanoHUB Simulator Interface

## Purpose

The NanoHUB Simulator Interface skill provides access to online nanoscience simulation tools from NanoHUB, enabling quick calculations and educational exploration of nanoscale phenomena.

## Capabilities

- Quantum dot simulations (NEMO)
- CNT property calculators
- Nanowire transport modeling
- Band structure visualization
- Interactive simulation execution
- Result extraction and analysis

## Usage Guidelines

### NanoHUB Integration

1. **Tool Selection**
   - Identify appropriate simulator
   - Understand input requirements
   - Check computational limits

2. **Simulation Execution**
   - Submit jobs via API
   - Monitor progress
   - Retrieve results

3. **Analysis**
   - Parse output files
   - Extract key parameters
   - Visualize results

## Process Integration

- Multiscale Modeling Integration
- DFT Calculation Pipeline for Nanomaterials

## Input Schema

```json
{
  "tool_name": "string",
  "input_parameters": {},
  "execution_mode": "batch|interactive"
}
```

## Output Schema

```json
{
  "job_id": "string",
  "status": "completed|running|failed",
  "results": {},
  "output_files": ["string"],
  "execution_time": "number (seconds)"
}
```
