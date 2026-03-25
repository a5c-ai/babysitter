# ROS/ROS2 Expert Agent

## Overview

The `ros-expert` agent is a specialized AI agent embodying the expertise of a Senior ROS/ROS2 Engineer. It provides deep knowledge for ROS2 node development, package creation, DDS configuration, launch file design, and system debugging.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior ROS/ROS2 Engineer |
| **Experience** | 10+ years ROS development |
| **Background** | Open source robotics, industrial systems, research |
| **Contributions** | ROS package maintainer, community contributor |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Node Architecture** | Standard nodes, lifecycle nodes, components |
| **DDS/QoS** | Middleware configuration, QoS policies |
| **Packages** | CMake, ament, package structure |
| **Launch** | Python launch files, composition, namespacing |
| **Interfaces** | Message, service, action design |
| **tf2** | Transform management, frame conventions |
| **Parameters** | Parameter handling, YAML configuration |
| **Debugging** | CLI tools, logging, profiling |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(rosExpertTask, {
  agentName: 'ros-expert',
  prompt: {
    role: 'Senior ROS2 Engineer',
    task: 'Review and optimize ROS2 package architecture',
    context: {
      packageFiles: packageContents,
      issues: reportedIssues
    },
    instructions: [
      'Review CMakeLists.txt and package.xml',
      'Check QoS configuration',
      'Analyze node architecture',
      'Suggest improvements',
      'Provide code examples'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Create package structure
/agent ros-expert create-package \
  --name my_robot_pkg \
  --type cpp \
  --dependencies "rclcpp std_msgs sensor_msgs"

# Debug topic connectivity
/agent ros-expert debug-topics \
  --publisher-node /camera_driver \
  --subscriber-node /image_processor \
  --topic /camera/image_raw

# Design launch architecture
/agent ros-expert design-launch \
  --nodes "driver,processor,controller" \
  --composition enabled \
  --lifecycle true
```

## Common Tasks

### 1. Package Creation and Review

```bash
/agent ros-expert review-package \
  --path /path/to/my_package \
  --check-style \
  --check-tests \
  --output review_report.md
```

Output includes:
- CMakeLists.txt issues
- package.xml completeness
- Code style violations
- Missing tests
- Improvement recommendations

### 2. QoS Troubleshooting

```bash
/agent ros-expert troubleshoot-qos \
  --topic /sensor_data \
  --publisher-node /sensor_driver \
  --subscriber-node /processor
```

Provides:
- QoS compatibility analysis
- Recommended QoS profiles
- Configuration examples

### 3. Launch File Design

```bash
/agent ros-expert design-launch \
  --robot-name my_robot \
  --nodes "driver,perception,navigation" \
  --namespacing true \
  --parameters config/robot.yaml \
  --output launch/robot_bringup.launch.py
```

Generates:
- Complete launch file
- Configuration file templates
- Composition setup if applicable

### 4. Interface Design

```bash
/agent ros-expert design-interface \
  --type action \
  --name NavigateToGoal \
  --goal-fields "target_pose:geometry_msgs/PoseStamped,timeout:float32" \
  --result-fields "success:bool,elapsed_time:float32" \
  --feedback-fields "distance_remaining:float32,progress:float32"
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `robot-system-design.js` | ROS architecture |
| `nav2-navigation-setup.js` | Nav2 integration |
| `moveit-manipulation-planning.js` | MoveIt integration |
| `multi-robot-coordination.js` | Multi-robot ROS |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const rosPackageTask = defineTask({
  name: 'ros-package-setup',
  description: 'Setup ROS2 package',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Create ROS2 Package',
      agent: {
        name: 'ros-expert',
        prompt: {
          role: 'Senior ROS2 Engineer',
          task: 'Create a well-structured ROS2 package',
          context: {
            packageName: inputs.packageName,
            nodeTypes: inputs.nodeTypes,
            dependencies: inputs.dependencies
          },
          instructions: [
            'Create package structure',
            'Generate CMakeLists.txt',
            'Create package.xml',
            'Add node templates',
            'Create launch files',
            'Add test infrastructure'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['files', 'instructions'],
          properties: {
            files: { type: 'array' },
            instructions: { type: 'array' },
            dependencies: { type: 'array' }
          }
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

## Knowledge Base

### ROS2 Distributions

| Distribution | Status | EOL |
|-------------|--------|-----|
| Humble | LTS | May 2027 |
| Iron | Stable | November 2024 |
| Jazzy | LTS | May 2029 |
| Rolling | Development | N/A |

### QoS Profile Reference

| Profile | Reliability | Durability | Use Case |
|---------|-------------|------------|----------|
| Sensor | Best Effort | Volatile | High-rate sensor data |
| Default | Reliable | Volatile | General communication |
| Services | Reliable | Volatile | Request/response |
| Parameters | Reliable | Transient Local | Configuration |

### Common Frame Conventions (REP-105)

| Frame | Description |
|-------|-------------|
| `map` | Global fixed frame |
| `odom` | Odometry frame (continuous) |
| `base_link` | Robot body frame |
| `base_footprint` | 2D projection of base_link |

## Debugging Decision Tree

```
Communication Issue
├── Topic not visible
│   ├── Check ROS_DOMAIN_ID matches
│   ├── Check network/firewall settings
│   └── Verify node is publishing
├── Messages not received
│   ├── Check QoS compatibility
│   ├── Verify topic type matches
│   └── Check namespace/remapping
├── Transform lookup fails
│   ├── Verify frame chain exists
│   ├── Check broadcaster is running
│   └── Verify timestamps are valid
└── Service times out
    ├── Check service server is running
    ├── Verify service type matches
    └── Check for blocking operations
```

## Interaction Guidelines

### What to Expect

- **Complete code examples** with proper imports and structure
- **Best practices** following ROS2 conventions
- **Debugging assistance** with specific commands
- **Performance considerations** for real-time systems

### Best Practices

1. Provide ROS2 distribution being used
2. Include relevant error messages
3. Describe the expected vs actual behavior
4. Mention any custom configurations

## Related Resources

- [ros-integration skill](../../skills/ros-integration/) - ROS development
- [robotics-architect agent](../robotics-architect/) - System architecture

## References

- [ROS2 Documentation](https://docs.ros.org/en/humble/)
- [ROS2 Design](https://design.ros2.org/)
- [ROS Enhancement Proposals](https://ros.org/reps/)
- [ROS2 Coding Style](https://docs.ros.org/en/humble/Contributing/Code-Style-Language-Versions.html)
- [ros-mcp-server](https://github.com/robotmcp/ros-mcp-server)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-015
**Category:** Middleware
**Status:** Active
