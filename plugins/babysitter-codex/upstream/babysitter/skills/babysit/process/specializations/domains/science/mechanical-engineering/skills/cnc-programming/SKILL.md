---
name: cnc-programming
description: Expert skill for CNC programming and toolpath optimization using CAM software
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
  priority: high
  phase: 3
  tools-libraries:
    - Mastercam
    - Siemens NX CAM
    - Fusion 360 Manufacturing
    - GibbsCAM
---

# CNC Programming Skill

## Purpose

The CNC Programming skill provides expert capabilities for CNC programming and toolpath optimization using CAM software, enabling efficient and accurate machining of mechanical components.

## Capabilities

- Mastercam, NX CAM, Fusion 360 workflow automation
- Toolpath strategy selection (roughing, finishing)
- Cutting parameter optimization (feeds, speeds)
- Tool selection and library management
- Work holding and fixture consideration
- Toolpath simulation and verification
- G-code generation and post-processing
- Cycle time estimation and optimization

## Usage Guidelines

### Machining Strategy

#### Roughing Operations

1. **Material Removal Strategies**
   | Strategy | Application | Advantages |
   |----------|-------------|------------|
   | Adaptive/Dynamic | General roughing | Constant chip load |
   | Pocket | Enclosed areas | Efficient material removal |
   | Facing | Flat surfaces | Surface prep |
   | Plunge rough | Deep pockets | Axial chip evacuation |

2. **Stock Allowance**
   ```
   Finishing allowance = 0.25-0.5 mm (typical)
   Semi-finish allowance = 0.5-1.0 mm
   Rough allowance = Stock - finish - semi-finish
   ```

3. **Step-Over Guidelines**
   ```
   Adaptive roughing: 10-25% tool diameter
   Pocket roughing: 50-75% tool diameter
   Depth of cut: 1-2x tool diameter (end mills)
   ```

#### Finishing Operations

1. **Surface Finish Strategies**
   | Strategy | Application | Surface Finish |
   |----------|-------------|----------------|
   | Parallel | Flat surfaces | Ra 0.8-1.6 um |
   | Contour | Walls, profiles | Ra 0.8-1.6 um |
   | Scallop | 3D surfaces | Ra 1.6-3.2 um |
   | Pencil | Corners, fillets | Clean-up |

2. **Step-Over for Finish**
   ```
   Cusp height = r - sqrt(r^2 - (s/2)^2)

   For cusp height = 0.01 mm, r = 5 mm:
   Step-over s = 0.89 mm
   ```

### Cutting Parameters

#### Speed and Feed Calculation

```
Cutting Speed (SFM): V = pi * D * N / 12 (imperial)
                     V = pi * D * N / 1000 (metric)

Feed Rate: F = f * z * N

Where:
V = cutting speed (SFM or m/min)
D = tool diameter
N = spindle speed (RPM)
f = feed per tooth
z = number of teeth
F = feed rate (IPM or mm/min)
```

#### Material-Specific Parameters

| Material | Speed (SFM) | Feed/Tooth (in) | Notes |
|----------|-------------|-----------------|-------|
| Aluminum | 500-1000 | 0.004-0.008 | High spindle, coolant |
| Steel (mild) | 80-120 | 0.003-0.006 | Flood coolant |
| Steel (hard) | 50-80 | 0.002-0.004 | Reduce speed |
| Stainless | 60-100 | 0.002-0.005 | Rigid setup |
| Titanium | 40-60 | 0.002-0.004 | High pressure coolant |

### Tool Selection

#### End Mill Selection

| Application | Tool Type | Coating |
|-------------|-----------|---------|
| Aluminum roughing | 2-3 flute, polished | Uncoated/ZrN |
| Aluminum finishing | 2-3 flute, high helix | Uncoated |
| Steel roughing | 4+ flute, variable helix | AlTiN/TiAlN |
| Steel finishing | 4+ flute | AlTiN |
| Hardened steel | Ball nose, solid carbide | AlCrN |

#### Tool Life Management

```
Tool life tracking:
- Material removed (cm3)
- Cutting time (minutes)
- Parts produced

Replace at:
- Wear land > 0.3 mm
- Surface finish degradation
- Dimension out of tolerance
```

### Work Holding

#### Fixture Considerations

1. **Clamping Force**
   - Calculate cutting forces
   - Apply safety factor (2-3x)
   - Distribute clamp forces
   - Avoid part distortion

2. **Accessibility**
   - Clear all tool paths
   - Consider tool length
   - Allow chip evacuation
   - Enable coolant flow

### Program Verification

1. **Simulation Checks**
   - Tool collision detection
   - Fixture interference
   - Rapid traverse clearance
   - Stock remaining verification

2. **First Article**
   - Reduced feed rate (50%)
   - Single block mode
   - Verify dimensions
   - Adjust offsets as needed

## Process Integration

- ME-018: CNC Programming and Verification

## Input Schema

```json
{
  "part_model": "CAD file reference",
  "material": {
    "name": "string",
    "hardness": "string (e.g., HRC 30)"
  },
  "machine": {
    "type": "3-axis|4-axis|5-axis|lathe",
    "controller": "Fanuc|Siemens|Haas|other",
    "spindle_max": "number (RPM)",
    "rapids": "number (mm/min)"
  },
  "tolerances": {
    "dimensional": "number (mm)",
    "surface_finish": "number (Ra um)"
  },
  "production_volume": "prototype|low|medium|high"
}
```

## Output Schema

```json
{
  "program_info": {
    "program_number": "string",
    "operations": "number",
    "total_tools": "number"
  },
  "cycle_time": {
    "machining": "number (min)",
    "non-cutting": "number (min)",
    "total": "number (min)"
  },
  "tool_list": [
    {
      "tool_number": "number",
      "description": "string",
      "diameter": "number (mm)",
      "length": "number (mm)"
    }
  ],
  "setup_sheet": {
    "work_offset": "string",
    "fixture": "string",
    "stock_size": "array [L, W, H]"
  },
  "nc_file": "file reference"
}
```

## Best Practices

1. Verify model accuracy before programming
2. Use consistent tool numbering conventions
3. Include adequate clearance planes
4. Optimize tool paths for minimum air cutting
5. Simulate complete program before machining
6. Document setup requirements clearly

## Integration Points

- Connects with CAD Modeling for geometry
- Feeds into Process Planning for operations
- Supports FAI Inspection for first article
- Integrates with DFM Review for manufacturability
