---
name: process-planning
description: Skill for manufacturing process planning including operation sequencing and work instructions
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: manufacturing
  priority: medium
  phase: 8
  tools-libraries:
    - PLM systems
    - MES interfaces
    - Process planning tools
---

# Manufacturing Process Planning Skill

## Purpose

The Manufacturing Process Planning skill provides capabilities for developing comprehensive manufacturing process plans including operation sequencing, work instructions, and quality controls for mechanical component production.

## Capabilities

- Operation sequence development
- Machine and tooling selection
- Cycle time estimation
- Inspection point specification
- Work instruction creation
- Process FMEA development
- Control plan generation
- Cost estimation and optimization

## Usage Guidelines

### Process Planning Framework

#### Information Gathering

1. **Design Requirements**
   - Part drawing and model
   - Material specification
   - Tolerance requirements
   - Surface finish requirements
   - Special requirements (certifications, traceability)

2. **Production Requirements**
   - Annual volume
   - Lot sizes
   - Lead time requirements
   - Budget constraints

3. **Available Resources**
   - Machine capabilities
   - Tooling inventory
   - Skilled labor
   - Quality equipment

### Operation Sequencing

#### Sequence Development Principles

```
General sequence:
1. Raw material preparation
2. Primary forming/roughing
3. Secondary operations
4. Finishing operations
5. Heat treatment (if required)
6. Final machining (post-heat treat)
7. Surface treatment/coating
8. Final inspection
9. Packaging
```

#### Operation Selection Matrix

| Feature | Possible Operations | Selection Criteria |
|---------|--------------------|--------------------|
| External cylinder | Turning, grinding | Tolerance, finish |
| Internal cylinder | Boring, drilling, reaming | Diameter, depth |
| Flat surface | Milling, grinding, lapping | Flatness, finish |
| Gear teeth | Hobbing, shaping, grinding | Accuracy, volume |
| Thread | Tapping, thread milling, rolling | Size, accuracy |
| Heat treat | Quench/temper, carburize, nitride | Hardness, depth |

### Machine Selection

#### Capability Assessment

```
Selection criteria:
- Workpiece size vs machine envelope
- Required tolerances vs machine capability
- Surface finish capability
- Spindle power vs material removal
- Tool capacity
- Automation potential
```

#### Process Capability

```
Typical capabilities:
Turning: IT7-IT9, Ra 0.8-3.2 um
Milling: IT7-IT10, Ra 0.8-6.3 um
Grinding: IT5-IT7, Ra 0.1-0.8 um
EDM: IT6-IT8, Ra 0.2-6.3 um
Honing: IT4-IT6, Ra 0.05-0.4 um
```

### Cycle Time Estimation

#### Time Components

```
Total cycle time = Setup time + Processing time + Non-productive time

Processing time per operation:
T_process = (L + A) / (f * N) + tool change time

Where:
L = length of cut
A = approach distance
f = feed rate
N = spindle speed
```

#### Standard Times

| Activity | Typical Time |
|----------|--------------|
| Load/unload (manual) | 15-60 seconds |
| Tool change (CNC) | 3-10 seconds |
| Index (turret) | 1-3 seconds |
| Probe cycle | 5-15 seconds |
| Deburr (manual) | 30-120 seconds |

### Work Instructions

#### Content Requirements

1. **Header Information**
   - Part number and revision
   - Operation number and description
   - Work center/machine
   - Standard time

2. **Setup Instructions**
   - Fixture identification
   - Tool list
   - Work offset procedures
   - Program number

3. **Operating Instructions**
   - Step-by-step procedures
   - Critical parameters
   - Safety requirements
   - Quality checks

4. **Visual Aids**
   - Photos of setup
   - Diagrams of critical dimensions
   - Defect examples (visual standards)

### Process FMEA

#### FMEA Structure

```
Process Step -> Potential Failure Mode -> Effect -> Cause

Severity (S): 1-10 scale
Occurrence (O): 1-10 scale
Detection (D): 1-10 scale

RPN = S x O x D

Actions required for RPN > 100 (typically)
```

#### Common Process Failure Modes

| Process | Failure Mode | Cause | Detection |
|---------|--------------|-------|-----------|
| Machining | Dimension out of tolerance | Tool wear | In-process gage |
| Heat treat | Incorrect hardness | Temperature error | Hardness test |
| Welding | Porosity | Contamination | NDT |
| Assembly | Missing component | Operator error | Check sheet |

### Control Plan

#### Control Plan Elements

```
For each operation:
- Process step
- Machine/device
- Characteristic (dimension, property)
- Specification/tolerance
- Measurement method
- Sample size and frequency
- Control method
- Reaction plan
```

## Process Integration

- ME-017: Manufacturing Process Planning

## Input Schema

```json
{
  "part_info": {
    "part_number": "string",
    "revision": "string",
    "material": "string"
  },
  "design_requirements": {
    "drawing_reference": "string",
    "critical_dimensions": "array",
    "surface_finish_requirements": "array"
  },
  "production_requirements": {
    "annual_volume": "number",
    "lot_size": "number",
    "lead_time": "number (weeks)"
  },
  "available_equipment": "array of machine types"
}
```

## Output Schema

```json
{
  "process_plan": {
    "routing_number": "string",
    "operations": [
      {
        "op_number": "number",
        "description": "string",
        "work_center": "string",
        "setup_time": "number (min)",
        "cycle_time": "number (min)",
        "tooling": "array",
        "inspection_points": "array"
      }
    ],
    "total_lead_time": "number (days)"
  },
  "work_instructions": "array of document references",
  "process_fmea": "document reference",
  "control_plan": "document reference",
  "cost_estimate": {
    "material": "number",
    "labor": "number",
    "overhead": "number",
    "total": "number"
  }
}
```

## Best Practices

1. Consider all design requirements before sequencing
2. Minimize setups and part handling
3. Group operations by work center when possible
4. Include quality gates at critical operations
5. Document all assumptions and alternatives
6. Review with production team before release

## Integration Points

- Connects with GD&T Drawing for requirements
- Feeds into CNC Programming for machining ops
- Supports FAI Inspection for verification
- Integrates with Quality for control plans
