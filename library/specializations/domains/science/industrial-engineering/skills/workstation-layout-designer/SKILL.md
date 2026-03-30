---
name: workstation-layout-designer
description: Workstation and workspace layout design skill with ergonomic optimization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: ergonomics
  backlog-id: SK-IE-023
---

# workstation-layout-designer

You are **workstation-layout-designer** - a specialized skill for designing ergonomic workstations and workspace layouts.

## Overview

This skill enables AI-powered workstation design including:
- Work zone layout (primary, secondary, tertiary)
- Tool and material placement optimization
- Visual field considerations
- Lighting and visibility analysis
- Work surface height recommendations
- Seated vs standing workstation design
- Adjustable workstation specification
- Layout drawing generation

## Capabilities

### 1. Work Zone Layout Design

```python
from dataclasses import dataclass
from typing import List, Dict
import math

@dataclass
class WorkItem:
    name: str
    frequency: str  # "continuous", "frequent", "occasional", "rare"
    size: tuple  # (width, depth, height) in inches
    weight: float  # lbs
    requires_precision: bool = False

def design_work_zones(forward_reach: float, shoulder_width: float):
    """
    Design work zone layout based on anthropometric data
    """
    zones = {
        "primary": {
            "description": "Most frequent use - within easy reach",
            "radius": forward_reach * 0.4,
            "arc": 30,  # degrees from centerline
            "height_optimal": "elbow height +/- 4 inches",
            "items": "Continuous and frequent use items"
        },
        "secondary": {
            "description": "Occasional use - within normal reach",
            "radius": forward_reach * 0.65,
            "arc": 60,
            "height_optimal": "shoulder to elbow height",
            "items": "Occasional use items"
        },
        "tertiary": {
            "description": "Infrequent use - maximum reach",
            "radius": forward_reach * 0.9,
            "arc": 90,
            "height_optimal": "any comfortable height",
            "items": "Rarely used items"
        },
        "storage": {
            "description": "Storage only - outside normal work",
            "radius": forward_reach * 1.2,
            "arc": 180,
            "height_optimal": "not critical",
            "items": "Storage, rarely accessed"
        }
    }

    return zones

def assign_items_to_zones(items: List[WorkItem], zones: dict):
    """
    Assign work items to appropriate zones
    """
    assignments = {zone: [] for zone in zones}

    for item in items:
        if item.frequency == "continuous":
            assignments["primary"].append(item)
        elif item.frequency == "frequent":
            assignments["primary"].append(item) if item.requires_precision else \
                assignments["secondary"].append(item)
        elif item.frequency == "occasional":
            assignments["secondary"].append(item)
        else:
            assignments["tertiary"].append(item)

    return assignments
```

### 2. Tool and Material Placement

```python
def optimize_tool_placement(tools: List[WorkItem], work_area_width: float,
                           work_area_depth: float, dominant_hand: str = "right"):
    """
    Optimize placement of tools in work area
    """
    placements = []

    # Sort by frequency
    sorted_tools = sorted(tools,
                         key=lambda t: ["continuous", "frequent", "occasional", "rare"].index(t.frequency))

    # Primary zone dimensions
    primary_width = work_area_width * 0.4
    primary_depth = work_area_depth * 0.3

    x_position = 0 if dominant_hand == "right" else work_area_width
    direction = 1 if dominant_hand == "right" else -1

    current_x = work_area_width / 2
    current_y = work_area_depth * 0.2  # Near front edge

    for tool in sorted_tools:
        if tool.frequency in ["continuous", "frequent"]:
            # Place in primary zone
            zone = "primary"
            y = current_y
            x = current_x
            current_x += (tool.size[0] + 2) * direction  # Add spacing
        elif tool.frequency == "occasional":
            # Place in secondary zone
            zone = "secondary"
            y = work_area_depth * 0.5
            x = current_x
        else:
            # Place in tertiary zone
            zone = "tertiary"
            y = work_area_depth * 0.8
            x = current_x

        placements.append({
            "item": tool.name,
            "x": round(x, 1),
            "y": round(y, 1),
            "zone": zone,
            "orientation": "handle toward user" if tool.weight > 2 else "any"
        })

    return placements
```

### 3. Visual Field Design

```python
def design_visual_layout(viewing_distance: float, task_type: str):
    """
    Design layout considering visual requirements

    task_type: "precision", "inspection", "monitoring", "general"
    """
    visual_specs = {
        "precision": {
            "viewing_distance_inches": (10, 16),
            "viewing_angle_down": (15, 35),
            "illumination_lux": (500, 1000),
            "display_tilt": "15-20 degrees toward user",
            "notes": "May require task lighting and magnification"
        },
        "inspection": {
            "viewing_distance_inches": (14, 20),
            "viewing_angle_down": (15, 30),
            "illumination_lux": (750, 1500),
            "display_tilt": "Perpendicular to line of sight",
            "notes": "Avoid glare on inspected surfaces"
        },
        "monitoring": {
            "viewing_distance_inches": (20, 28),
            "viewing_angle_down": (0, 20),
            "illumination_lux": (300, 500),
            "display_tilt": "Top tilted slightly away",
            "notes": "Displays within 30 degrees of center"
        },
        "general": {
            "viewing_distance_inches": (16, 24),
            "viewing_angle_down": (0, 30),
            "illumination_lux": (300, 500),
            "display_tilt": "Adjustable",
            "notes": "Standard office requirements"
        }
    }

    specs = visual_specs.get(task_type, visual_specs["general"])

    # Visual cone calculations
    visual_cone = {
        "optimal_cone": 15,  # degrees - best visual acuity
        "comfortable_cone": 30,  # degrees - comfortable viewing
        "maximum_cone": 60  # degrees - peripheral detection only
    }

    return {
        "specifications": specs,
        "visual_cone": visual_cone,
        "layout_guidance": generate_visual_layout_guidance(specs, visual_cone)
    }

def generate_visual_layout_guidance(specs, cone):
    """Generate specific layout guidance"""
    return [
        f"Primary displays within {cone['optimal_cone']}° of centerline",
        f"Secondary displays within {cone['comfortable_cone']}° of centerline",
        f"Viewing distance: {specs['viewing_distance_inches'][0]}-{specs['viewing_distance_inches'][1]} inches",
        f"Display tilt: {specs['display_tilt']}",
        f"Illumination: {specs['illumination_lux'][0]}-{specs['illumination_lux'][1]} lux"
    ]
```

### 4. Seated vs Standing Workstation

```python
def design_workstation(task_characteristics: dict, duration_hours: float):
    """
    Design workstation based on task and duration

    task_characteristics:
    - precision_required: bool
    - force_required: bool
    - mobility_required: bool
    - visual_demands: str ("high", "medium", "low")
    """
    recommendations = {
        "posture": None,
        "work_surface_height": None,
        "chair_specifications": None,
        "standing_mat": False,
        "sit_stand_option": False
    }

    # Determine posture
    if task_characteristics.get('precision_required') and duration_hours > 2:
        recommendations["posture"] = "seated"
        recommendations["reason"] = "Precision work benefits from stable seated posture"
    elif task_characteristics.get('force_required'):
        recommendations["posture"] = "standing"
        recommendations["reason"] = "Force tasks benefit from standing to use body weight"
    elif task_characteristics.get('mobility_required'):
        recommendations["posture"] = "standing"
        recommendations["reason"] = "Mobility needs favor standing"
    elif duration_hours > 4:
        recommendations["sit_stand_option"] = True
        recommendations["posture"] = "sit-stand"
        recommendations["reason"] = "Extended duration benefits from posture variety"
    else:
        recommendations["posture"] = "seated"
        recommendations["reason"] = "Default for moderate duration tasks"

    # Work surface height
    if recommendations["posture"] == "seated":
        recommendations["work_surface_height"] = {
            "fixed": 29,  # inches, standard desk
            "adjustable_range": (24, 32),
            "keyboard_tray": "Recommended for computer work"
        }
        recommendations["chair_specifications"] = {
            "seat_height_range": (16, 21),
            "seat_depth_range": (15, 18),
            "lumbar_support": "Required",
            "armrests": "Adjustable, removable preferred"
        }
    elif recommendations["posture"] == "standing":
        recommendations["work_surface_height"] = {
            "fixed": 42,  # inches
            "adjustable_range": (38, 48)
        }
        recommendations["standing_mat"] = True
        recommendations["footrest"] = "Provide for weight shifting"
    else:  # sit-stand
        recommendations["work_surface_height"] = {
            "adjustable_range": (24, 48),
            "adjustment_type": "Electric preferred for frequent changes"
        }
        recommendations["chair_specifications"] = {
            "type": "Height-adjustable stool with back support",
            "seat_height_range": (20, 32)
        }
        recommendations["standing_mat"] = True

    return recommendations
```

### 5. Adjustable Workstation Specification

```python
def specify_adjustable_workstation(user_population: str, task_type: str):
    """
    Create specification for adjustable workstation

    user_population: "single_user", "multi_user", "general"
    """
    specifications = {
        "work_surface": {
            "width_inches": 60,
            "depth_inches": 30,
            "height_range_inches": (24, 48) if user_population != "single_user" else (26, 32),
            "adjustment_mechanism": "Electric" if user_population == "multi_user" else "Manual crank",
            "memory_positions": 3 if user_population == "multi_user" else 0,
            "load_capacity_lbs": 150
        },
        "monitor_arm": {
            "height_range_inches": (4, 16),
            "depth_range_inches": (4, 20),
            "tilt_range_degrees": (-90, 90),
            "swivel_range_degrees": 360,
            "weight_capacity_lbs": 25
        },
        "keyboard_tray": {
            "width_inches": 26,
            "height_adjustment_inches": (-4, 2),
            "tilt_range_degrees": (-15, 15),
            "swivel_range_degrees": (-15, 15)
        },
        "chair": {
            "seat_height_range_inches": (16, 21),
            "seat_depth_adjustment_inches": 3,
            "lumbar_height_adjustment_inches": 4,
            "armrest_height_adjustment_inches": 4,
            "armrest_width_adjustment_inches": 2
        }
    }

    # Task-specific modifications
    if task_type == "precision":
        specifications["work_surface"]["depth_inches"] = 24  # Bring work closer
        specifications["task_light"] = {
            "type": "Adjustable arm",
            "lux": 1000,
            "color_temperature_kelvin": 5000
        }
    elif task_type == "assembly":
        specifications["work_surface"]["load_capacity_lbs"] = 300
        specifications["anti_fatigue_mat"] = True

    return specifications
```

### 6. Layout Drawing Generation

```python
def generate_layout_specification(workstation_design: dict, items: List[WorkItem]):
    """
    Generate textual layout specification for CAD or drawing
    """
    layout = {
        "drawing_title": "Workstation Layout",
        "dimensions": {
            "overall_width": workstation_design.get("width", 60),
            "overall_depth": workstation_design.get("depth", 30),
            "work_surface_height": workstation_design.get("height", 29)
        },
        "zones": [],
        "item_placements": [],
        "annotations": []
    }

    # Add zone boundaries
    zones = design_work_zones(24, 18)  # Default reach dimensions
    for zone_name, zone_data in zones.items():
        layout["zones"].append({
            "name": zone_name,
            "type": "arc",
            "radius": zone_data["radius"],
            "angle": zone_data["arc"],
            "style": "dashed"
        })

    # Add item placements
    placements = optimize_tool_placement(items, 60, 30)
    for placement in placements:
        layout["item_placements"].append({
            "name": placement["item"],
            "position": (placement["x"], placement["y"]),
            "symbol": "rectangle"
        })

    # Add annotations
    layout["annotations"] = [
        {"text": "Primary Zone", "position": (30, 8)},
        {"text": "Secondary Zone", "position": (30, 15)},
        {"text": "Operator Position", "position": (30, 2), "symbol": "circle"}
    ]

    return layout
```

## Process Integration

This skill integrates with the following processes:
- `workstation-design-optimization.js`
- `5s-workplace-organization-implementation.js`

## Output Format

```json
{
  "workstation_type": "Seated Adjustable",
  "work_surface": {
    "dimensions": {"width": 60, "depth": 30},
    "height_range": [24, 32]
  },
  "zones": {
    "primary_radius": 9.6,
    "secondary_radius": 15.6
  },
  "item_placements": [
    {"item": "Keyboard", "x": 30, "y": 6, "zone": "primary"},
    {"item": "Phone", "x": 50, "y": 8, "zone": "secondary"}
  ],
  "chair_specs": {
    "seat_height_range": [16, 21],
    "lumbar_support": true
  }
}
```

## Best Practices

1. **User involvement** - Get worker input
2. **Task analysis first** - Understand work requirements
3. **Prototype and test** - Validate before finalizing
4. **Consider all users** - Not just average
5. **Plan for change** - Build in adjustability
6. **Document rationale** - Record design decisions

## Constraints

- Balance ergonomics with task efficiency
- Consider cost vs adjustability tradeoffs
- Ensure compliance with standards
- Plan for maintenance and cleaning
