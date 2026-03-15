# URDF/SDF Model Skill

## Overview

The `urdf-sdf-model` skill provides expert capabilities for robot model creation and validation in URDF and SDF formats. It enables AI-powered model generation, inertia calculations, mesh management, and sensor integration.

## Quick Start

### Prerequisites

1. **ROS2 with URDF packages** - `ros-humble-urdf`, `ros-humble-xacro`
2. **Gazebo** - For SDF validation and simulation
3. **Mesh tools** - MeshLab, Blender for mesh optimization (optional)

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

```bash
# Install ROS2 URDF packages
sudo apt install ros-humble-urdf ros-humble-xacro ros-humble-joint-state-publisher-gui

# Install mesh tools (optional)
sudo apt install meshlab blender
```

## Usage

### Basic Operations

```bash
# Create a new robot URDF
/skill urdf-sdf-model create --name my_robot --type differential_drive

# Validate existing URDF
/skill urdf-sdf-model validate --file robot.urdf.xacro

# Convert URDF to SDF
/skill urdf-sdf-model convert --input robot.urdf --output robot.sdf

# Calculate inertia for a link
/skill urdf-sdf-model inertia --shape box --mass 5.0 --dimensions "0.5 0.3 0.1"

# Add a sensor to the model
/skill urdf-sdf-model add-sensor --type lidar --parent base_link --position "0.1 0 0.2"
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(urdfModelTask, {
  operation: 'create',
  robotName: 'mobile_robot',
  robotType: 'differential_drive',
  components: {
    base: { shape: 'box', dimensions: [0.5, 0.3, 0.1], mass: 10.0 },
    wheels: { count: 4, radius: 0.05, width: 0.02, mass: 0.5 }
  },
  sensors: [
    { type: 'camera', parent: 'base_link', position: [0.2, 0, 0.1] },
    { type: 'lidar', parent: 'base_link', position: [0, 0, 0.15] }
  ]
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **URDF Generation** | Create complete URDF files with proper hierarchy |
| **Xacro Macros** | Build modular robot descriptions |
| **Inertia Calculation** | Compute inertia tensors for shapes and meshes |
| **Joint Configuration** | Set up revolute, continuous, prismatic, fixed joints |
| **Sensor Integration** | Add camera, LiDAR, IMU, GPS sensors |
| **Mesh Management** | Import and optimize visual/collision meshes |
| **URDF to SDF Conversion** | Convert between robot description formats |
| **Validation** | Verify model syntax and physics properties |

## Examples

### Example 1: Create a Differential Drive Robot

```bash
/skill urdf-sdf-model create-robot \
  --name diff_drive_bot \
  --base-shape box \
  --base-dimensions "0.4 0.3 0.1" \
  --base-mass 8.0 \
  --wheel-count 2 \
  --wheel-radius 0.05 \
  --caster true \
  --sensors "camera,lidar" \
  --output-format xacro
```

### Example 2: Add Manipulator Arm

```bash
/skill urdf-sdf-model add-arm \
  --parent base_link \
  --dof 6 \
  --link-lengths "0.1 0.2 0.15 0.1 0.08 0.05" \
  --joint-limits "-3.14:3.14,-1.57:1.57,-2.0:2.0,-3.14:3.14,-1.57:1.57,-3.14:3.14" \
  --end-effector gripper
```

### Example 3: Validate and Fix Model

```bash
/skill urdf-sdf-model validate \
  --file robot.urdf.xacro \
  --check-inertia \
  --check-collisions \
  --auto-fix \
  --output fixed_robot.urdf.xacro
```

## Configuration

### Skill Configuration

```yaml
# .babysitter/skills/urdf-sdf-model.yaml
urdf-sdf-model:
  defaultUnits: SI
  coordinateFrame: REP-103
  collision:
    simplifyMeshes: true
    maxPolygons: 5000
  inertia:
    autoCalculate: true
    minMass: 0.001
  gazebo:
    sdfVersion: "1.7"
    physicsEngine: ode
  mcpServer:
    enabled: true
    cadBackend: cadquery
```

### Common Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `units` | Unit system (SI/imperial) | SI |
| `meshFormat` | Mesh output format | STL |
| `collisionDetail` | Collision mesh detail level | medium |
| `inertiaMethod` | Inertia calculation method | analytical |

## Process Integration

### Processes Using This Skill

1. **robot-urdf-sdf-model.js** - Complete robot model creation
2. **robot-system-design.js** - Architecture with physical models
3. **moveit-manipulation-planning.js** - MoveIt SRDF generation
4. **gazebo-simulation-setup.js** - Gazebo model setup

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const createRobotModelTask = defineTask({
  name: 'create-robot-model',
  description: 'Create URDF model for robot',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Create URDF: ${inputs.robotName}`,
      skill: {
        name: 'urdf-sdf-model',
        context: {
          operation: 'create',
          robotName: inputs.robotName,
          robotType: inputs.robotType,
          components: inputs.components,
          sensors: inputs.sensors,
          generateXacro: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### CAD-Query MCP Server

Parametric 3D modeling for robot parts.

**Features:**
- Python-based CAD modeling
- STL/STEP export
- Parametric design

**Installation:**
```bash
pip install cadquery-mcp-server
```

### FreeCAD MCP Server

Full-featured CAD integration.

**Features:**
- Complex geometry creation
- Assembly modeling
- Mesh import/export

**GitHub:** https://github.com/bonninr/freecad_mcp

### Blender MCP

Visual mesh creation and editing.

**Features:**
- Mesh modeling
- UV mapping
- Material assignment

**Website:** https://blender-mcp.com/

## Inertia Reference

### Common Shape Formulas

| Shape | Ixx | Iyy | Izz |
|-------|-----|-----|-----|
| Box | m(y^2+z^2)/12 | m(x^2+z^2)/12 | m(x^2+y^2)/12 |
| Cylinder (z-axis) | m(3r^2+h^2)/12 | m(3r^2+h^2)/12 | mr^2/2 |
| Sphere | 2mr^2/5 | 2mr^2/5 | 2mr^2/5 |
| Thin Rod (z-axis) | mL^2/12 | mL^2/12 | 0 |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Invalid inertia` | Ensure positive definite inertia matrix |
| `Missing link` | Check parent/child references in joints |
| `Mesh not found` | Verify mesh paths with package:// prefix |
| `Gazebo crash` | Simplify collision meshes, check inertia |
| `TF tree broken` | Ensure continuous joint chain from root |

### Debug Commands

```bash
# Check URDF syntax
check_urdf robot.urdf

# Visualize link tree
urdf_to_graphviz robot.urdf && dot -Tpng robot.gv -o robot_tree.png

# View in RViz
ros2 launch urdf_tutorial display.launch.py model:=robot.urdf.xacro

# Test in Gazebo
ros2 launch gazebo_ros spawn_entity.py -entity my_robot -file robot.urdf
```

## Related Skills

- **ros-integration** - ROS package for robot model
- **gazebo-simulation** - Gazebo world setup
- **moveit-planning** - MoveIt configuration

## References

- [URDF Specification](http://wiki.ros.org/urdf/XML)
- [SDF Specification](http://sdformat.org/spec)
- [Xacro Documentation](http://wiki.ros.org/xacro)
- [REP-103 Coordinate Frames](https://www.ros.org/reps/rep-0103.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-004
**Category:** Robot Modeling
**Status:** Active
