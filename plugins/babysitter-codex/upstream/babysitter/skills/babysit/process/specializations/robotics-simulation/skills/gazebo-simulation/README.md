# Gazebo Simulation Skill

## Overview

The `gazebo-simulation` skill provides expert capabilities for Gazebo simulation environment creation and configuration. It enables AI-powered world creation, physics configuration, sensor setup, and plugin development.

## Quick Start

### Prerequisites

1. **Gazebo Sim** - Harmonic (recommended) or Ionic
2. **ROS2** - Humble or later with ros_gz packages
3. **C++ compiler** - For custom plugin development

### Installation

```bash
# Install Gazebo Sim (Harmonic)
sudo apt install gz-harmonic

# Install ROS-Gazebo integration
sudo apt install ros-humble-ros-gz

# Install additional packages
sudo apt install ros-humble-ros-gz-bridge ros-humble-ros-gz-sim
```

## Usage

### Basic Operations

```bash
# Create a new world
/skill gazebo-simulation create-world --name robot_world --terrain flat

# Add robot to world
/skill gazebo-simulation spawn-robot --model my_robot --world robot_world --pose "0 0 0.1 0 0 0"

# Configure physics
/skill gazebo-simulation set-physics --engine dart --step-size 0.001

# Add sensor to model
/skill gazebo-simulation add-sensor --type lidar --model my_robot --link base_link
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(gazeboSimulationTask, {
  operation: 'create-world',
  worldName: 'warehouse_world',
  terrain: {
    type: 'heightmap',
    file: 'terrain/warehouse.png',
    size: [50, 50, 2]
  },
  lighting: 'indoor',
  physics: {
    engine: 'ode',
    realTimeFactor: 1.0
  },
  robots: [
    { model: 'agv_robot', pose: [0, 0, 0.1, 0, 0, 0] },
    { model: 'agv_robot', pose: [5, 0, 0.1, 0, 0, 0] }
  ]
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **World Creation** | Create SDF worlds with terrain, lighting, physics |
| **Physics Configuration** | Configure ODE, Bullet, DART engines |
| **Sensor Setup** | Add camera, LiDAR, IMU, GPS, depth sensors |
| **Plugin Development** | Create custom world/model/sensor plugins |
| **ROS Bridge** | Configure ROS2-Gazebo topic bridges |
| **Environment Design** | Create obstacles, terrain, dynamic actors |
| **Performance Tuning** | Optimize simulation for speed/accuracy |

## Examples

### Example 1: Create Warehouse Environment

```bash
/skill gazebo-simulation create-warehouse \
  --dimensions "50 30 10" \
  --shelves 20 \
  --aisles 5 \
  --lighting indoor \
  --floor-material concrete \
  --spawn-points "0,0;10,0;20,0"
```

### Example 2: Setup Multi-Robot Simulation

```bash
/skill gazebo-simulation multi-robot-setup \
  --world warehouse_world \
  --robot-model agv_robot \
  --count 5 \
  --namespace-pattern "robot_{i}" \
  --spawn-pattern grid \
  --spacing 3.0
```

### Example 3: Configure Sensors

```bash
/skill gazebo-simulation configure-sensors \
  --model my_robot \
  --sensors "camera:30hz,lidar:10hz,imu:200hz" \
  --noise-models realistic \
  --ros-bridge enabled
```

## Configuration

### Skill Configuration

```yaml
# .babysitter/skills/gazebo-simulation.yaml
gazebo-simulation:
  defaultPhysics: ode
  defaultStepSize: 0.001
  realTimeFactor: 1.0
  rendering:
    engine: ogre2
    shadows: true
    antiAliasing: true
  sensors:
    defaultNoiseModel: gaussian
    gpuAcceleration: true
  rosIntegration:
    enabled: true
    bridgeType: parameter_bridge
```

### Physics Engine Comparison

| Engine | Speed | Accuracy | Best For |
|--------|-------|----------|----------|
| ODE | Fast | Good | General robotics |
| Bullet | Medium | Better | Complex collisions |
| DART | Medium | Best | Articulated robots |

## Process Integration

### Processes Using This Skill

1. **gazebo-simulation-setup.js** - Primary simulation setup
2. **digital-twin-development.js** - Digital twin creation
3. **synthetic-data-pipeline.js** - Training data generation
4. **simulation-performance-optimization.js** - Performance tuning
5. **hil-testing.js** - Hardware-in-the-loop testing

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const setupSimulationTask = defineTask({
  name: 'setup-simulation',
  description: 'Setup Gazebo simulation environment',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Setup Gazebo: ${inputs.worldName}`,
      skill: {
        name: 'gazebo-simulation',
        context: {
          operation: 'create-world',
          worldName: inputs.worldName,
          physics: inputs.physics || { engine: 'ode' },
          terrain: inputs.terrain,
          robots: inputs.robots,
          sensors: inputs.sensors,
          rosBridge: true
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

### Gazebo MCP Server

MCP server for Gazebo simulation control.

**Features:**
- Spawn robots and models
- Manipulate simulation environments
- Generate test worlds
- Gather sensor data

**Supported Sensors:** camera, depth_camera, rgbd_camera, imu, lidar, ray, gps, contact, force_torque, magnetometer, altimeter, sonar

**Token Efficiency:** 95%+ token savings with local filtering

### ros-mcp-server

For ROS-Gazebo integration.

**Features:**
- Topic publish/subscribe
- Service calls
- Parameter management

**GitHub:** https://github.com/robotmcp/ros-mcp-server

## Sensor Reference

### Camera Configuration

| Parameter | Description | Typical Value |
|-----------|-------------|---------------|
| update_rate | Frames per second | 30 |
| horizontal_fov | Field of view (rad) | 1.396 |
| image_width | Image width (px) | 640 |
| image_height | Image height (px) | 480 |
| clip_near | Near clip (m) | 0.1 |
| clip_far | Far clip (m) | 100 |

### LiDAR Configuration

| Parameter | Description | Typical Value |
|-----------|-------------|---------------|
| update_rate | Scans per second | 10 |
| samples | Points per scan | 640 |
| min_angle | Start angle (rad) | -3.14159 |
| max_angle | End angle (rad) | 3.14159 |
| range_min | Min range (m) | 0.3 |
| range_max | Max range (m) | 100 |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Model not found` | Check GZ_SIM_RESOURCE_PATH includes model directory |
| `Sensor not publishing` | Verify sensor plugin is loaded, check topic names |
| `Slow simulation` | Reduce sensor rates, simplify collision meshes |
| `Physics instability` | Decrease step size, check inertia values |
| `Bridge not working` | Verify topic types match, check namespaces |

### Debug Commands

```bash
# List Gazebo topics
gz topic -l

# Echo a topic
gz topic -e -t /world/default/model/my_robot/link/base_link/sensor/camera/image

# View simulation stats
gz stats

# Launch with verbose logging
GZ_SIM_VERBOSE=1 gz sim robot_world.sdf
```

## Related Skills

- **urdf-sdf-model** - Robot model creation
- **ros-integration** - ROS package development
- **isaac-sim** - NVIDIA Isaac Sim (alternative)

## References

- [Gazebo Sim Documentation](https://gazebosim.org/docs)
- [SDF Format Specification](http://sdformat.org/)
- [ros_gz GitHub](https://github.com/gazebosim/ros_gz)
- [Gazebo Tutorials](https://gazebosim.org/docs/latest/tutorials)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-002
**Category:** Simulation
**Status:** Active
