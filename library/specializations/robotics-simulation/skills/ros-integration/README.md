# ROS/ROS2 Integration Skill

## Overview

The `ros-integration` skill provides deep integration with ROS/ROS2 middleware for robot software development. It enables AI-powered package creation, node development, launch file generation, and system debugging.

## Quick Start

### Prerequisites

1. **ROS2 Installation** - Install from [docs.ros.org](https://docs.ros.org/en/humble/Installation.html)
2. **colcon** - Build tools for ROS2 packages
3. **rosdep** - Dependency management tool

### Supported ROS2 Distributions

| Distribution | Status | EOL |
|-------------|--------|-----|
| Humble (LTS) | Recommended | May 2027 |
| Iron | Supported | November 2024 |
| Rolling | Development | Rolling |

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

To add MCP server integration:

```bash
# ROS MCP Server for natural language robot control
# Requires rosbridge_server running on the robot
pip install robotmcp
```

## Usage

### Basic Operations

```bash
# Create a new ROS2 package
/skill ros-integration create-package --name my_robot --type python

# Generate a launch file
/skill ros-integration generate-launch --package my_robot --nodes controller,sensor

# Debug topic connectivity
/skill ros-integration debug-topics --pattern "/robot/*"

# Create a custom message
/skill ros-integration create-msg --package my_robot --name RobotStatus
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(rosIntegrationTask, {
  operation: 'create-node',
  package: 'my_robot_pkg',
  nodeName: 'robot_controller',
  nodeType: 'publisher-subscriber',
  topics: {
    publishers: [{ name: '/cmd_vel', type: 'geometry_msgs/Twist' }],
    subscribers: [{ name: '/scan', type: 'sensor_msgs/LaserScan' }]
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Package Creation** | Generate complete ROS2 packages with proper structure |
| **Node Development** | Create publisher/subscriber/service/action nodes |
| **Launch Files** | Generate Python launch files with parameters |
| **Message Definitions** | Create custom msg/srv/action definitions |
| **QoS Configuration** | Configure DDS Quality of Service policies |
| **Debugging** | Debug topics, services, parameters, TF |
| **Workspace Management** | Build and source workspace operations |

## Examples

### Example 1: Create a Robot Controller Package

```bash
/skill ros-integration create-package \
  --name robot_controller \
  --type python \
  --dependencies rclpy geometry_msgs sensor_msgs nav_msgs \
  --with-launch \
  --with-config
```

### Example 2: Generate a Subscriber Node

```bash
/skill ros-integration generate-node \
  --package robot_controller \
  --name lidar_processor \
  --subscribers "/scan:sensor_msgs/LaserScan" \
  --publishers "/obstacles:std_msgs/Float32MultiArray" \
  --timer 0.1
```

### Example 3: Debug Communication Issues

```bash
/skill ros-integration debug \
  --check-topics \
  --check-services \
  --check-qos \
  --namespace /robot
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ROS_DISTRO` | ROS2 distribution | humble |
| `ROS_DOMAIN_ID` | DDS domain ID | 0 |
| `RMW_IMPLEMENTATION` | DDS implementation | rmw_fastrtps_cpp |
| `AMENT_PREFIX_PATH` | Workspace overlay paths | - |

### Skill Configuration

```yaml
# .babysitter/skills/ros-integration.yaml
ros-integration:
  defaultDistro: humble
  defaultBuildType: ament_python
  autoSource: true
  qosDefaults:
    sensorReliability: best_effort
    controlReliability: reliable
  mcpServer:
    enabled: true
    rosbridgeUrl: ws://localhost:9090
```

## Process Integration

### Processes Using This Skill

1. **robot-system-design.js** - ROS node architecture design
2. **robot-calibration.js** - Calibration node development
3. **gazebo-simulation-setup.js** - ROS-Gazebo bridge configuration
4. **nav2-navigation-setup.js** - Nav2 stack setup
5. **multi-robot-coordination.js** - Multi-master ROS communication

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const createRosPackageTask = defineTask({
  name: 'create-ros-package',
  description: 'Create a new ROS2 package',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Create ROS2 package: ${inputs.packageName}`,
      skill: {
        name: 'ros-integration',
        context: {
          operation: 'create-package',
          packageName: inputs.packageName,
          buildType: inputs.buildType || 'ament_python',
          dependencies: inputs.dependencies,
          includeTests: true
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

### ros-mcp-server (robotmcp)

Primary MCP server for ROS/ROS2 robot control.

**Features:**
- List topics, services, message types
- Publish/subscribe to topics
- Call ROS services
- Get/set parameters
- View custom type definitions

**Installation:**
```bash
pip install robotmcp
# Run rosbridge on robot
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

**GitHub:** https://github.com/robotmcp/ros-mcp-server

### ROSBag MCP Server

For analyzing ROS bag files with natural language.

**Features:**
- Trajectory analysis
- Laser scan processing
- Coordinate transformations

**Paper:** [arXiv:2511.03497](https://arxiv.org/pdf/2511.03497)

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Package not found` | Source workspace: `source install/setup.bash` |
| `Topic not visible` | Check ROS_DOMAIN_ID matches between nodes |
| `QoS incompatibility` | Ensure publisher/subscriber QoS compatibility |
| `TF lookup failed` | Verify transform chain with `ros2 run tf2_tools view_frames` |
| `Service timeout` | Check if service server is running and healthy |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
export RCUTILS_CONSOLE_OUTPUT_FORMAT="[{severity}] [{time}] [{name}]: {message}"
export RCUTILS_LOGGING_BUFFERED_STREAM=0
```

## Related Skills

- **gazebo-simulation** - Gazebo simulation integration
- **urdf-sdf-model** - Robot model creation
- **nav2-navigation** - Navigation stack
- **sensor-fusion** - Multi-sensor fusion

## References

- [ROS2 Documentation](https://docs.ros.org/en/humble/)
- [ROS2 Design Patterns](https://design.ros2.org/)
- [ros-mcp-server GitHub](https://github.com/robotmcp/ros-mcp-server)
- [ROS2 Migration Guide](https://docs.ros.org/en/humble/How-To-Guides/Migrating-from-ROS1.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-001
**Category:** Middleware
**Status:** Active
