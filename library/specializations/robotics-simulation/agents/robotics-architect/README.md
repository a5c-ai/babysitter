# Robotics System Architect Agent

## Overview

The `robotics-architect` agent is a specialized AI agent embodying the expertise of a Principal Robotics Architect. It provides deep knowledge for robotic system design from requirements analysis through deployment, including hardware/software architecture, safety systems, and multi-robot coordination.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Principal Robotics Architect |
| **Experience** | 12+ years robotics systems |
| **Background** | Industrial automation, mobile robots, manipulation systems |
| **Certifications** | Systems engineering, functional safety |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Requirements** | Stakeholder analysis, technical requirements, specifications |
| **Architecture** | Hardware/software architecture, ROS2 design, layered systems |
| **Hardware** | Sensor selection, actuator sizing, compute platform selection |
| **Real-Time** | Control loop design, latency optimization, determinism |
| **Safety** | Risk assessment, safety functions, compliance |
| **Multi-Robot** | Fleet architecture, coordination, shared resources |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(roboticsArchitectTask, {
  agentName: 'robotics-architect',
  prompt: {
    role: 'Principal Robotics Architect',
    task: 'Design system architecture for warehouse AGV',
    context: {
      requirements: requirementsDocument,
      constraints: projectConstraints,
      existingInfrastructure: currentSystems
    },
    instructions: [
      'Analyze requirements and constraints',
      'Propose sensor and actuator selection',
      'Design ROS2 node architecture',
      'Create safety architecture',
      'Document architectural decisions'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# System architecture design
/agent robotics-architect design-system \
  --requirements requirements.yaml \
  --output architecture_doc.md

# Sensor selection
/agent robotics-architect select-sensors \
  --use-case "indoor_navigation" \
  --budget medium \
  --accuracy high

# Safety architecture review
/agent robotics-architect safety-review \
  --architecture architecture.yaml \
  --standard ISO_13482
```

## Common Tasks

### 1. System Requirements Analysis

```bash
/agent robotics-architect analyze-requirements \
  --stakeholder-needs stakeholder_input.md \
  --output technical_requirements.yaml
```

Output includes:
- Functional requirements breakdown
- Performance specifications
- Safety requirements (PL level)
- Interface definitions
- Compliance requirements

### 2. Architecture Design

```bash
/agent robotics-architect design-architecture \
  --requirements requirements.yaml \
  --platform ros2 \
  --output architecture/
```

Produces:
- System block diagram
- ROS2 node architecture
- Data flow diagrams
- Interface specifications
- Deployment architecture

### 3. Component Selection

```bash
/agent robotics-architect select-components \
  --architecture architecture.yaml \
  --budget-constraint medium \
  --output bill_of_materials.yaml
```

Provides:
- Sensor recommendations with rationale
- Actuator sizing calculations
- Compute platform selection
- Cost estimation

### 4. Safety Architecture

```bash
/agent robotics-architect design-safety \
  --architecture architecture.yaml \
  --standard ISO_10218 \
  --risk-level high \
  --output safety_architecture.yaml
```

Delivers:
- Risk assessment (hazard analysis)
- Safety function definitions
- Performance level calculations
- Validation test plan

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `robot-system-design.js` | Full system architecture |
| `digital-twin-development.js` | Twin architecture design |
| `multi-robot-coordination.js` | Fleet system design |
| `safety-system-validation.js` | Safety architecture |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const systemDesignTask = defineTask({
  name: 'system-design',
  description: 'Design robot system architecture',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Robot System Architecture Design',
      agent: {
        name: 'robotics-architect',
        prompt: {
          role: 'Principal Robotics Architect',
          task: 'Design comprehensive system architecture',
          context: {
            robotType: inputs.robotType,
            requirements: inputs.requirements,
            constraints: inputs.constraints
          },
          instructions: [
            'Review requirements and constraints',
            'Design layered architecture',
            'Select sensors and actuators',
            'Define ROS2 node structure',
            'Create safety architecture',
            'Document all decisions with rationale'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['architecture', 'components', 'decisions'],
          properties: {
            architecture: { type: 'object' },
            components: { type: 'array' },
            decisions: { type: 'array' },
            risks: { type: 'array' }
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

## Architecture Templates

### Mobile Robot Template

```yaml
mobile_robot_architecture:
  perception:
    - 2d_lidar: primary_navigation
    - rgbd_camera: obstacle_detection
    - imu: state_estimation
    - wheel_encoders: odometry

  navigation:
    - slam: rtabmap
    - planner: nav2
    - controller: regulated_pure_pursuit

  safety:
    - safety_scanner: protective_field
    - bumper: contact_detection
    - estop: hardware_wired

  compute:
    - main: nvidia_jetson_orin
    - safety: safety_plc
```

### Manipulator Template

```yaml
manipulator_architecture:
  perception:
    - rgbd_camera: scene_understanding
    - force_torque: contact_sensing
    - joint_encoders: position_feedback

  motion:
    - planner: moveit2
    - controller: joint_trajectory_controller
    - kinematics: kdl

  safety:
    - force_limiting: collision_detection
    - workspace_monitoring: safety_zones
    - speed_limiting: collaborative_mode

  compute:
    - main: industrial_pc
    - realtime: ethercat_master
```

## Interaction Guidelines

### What to Expect

- **Comprehensive analysis** with trade-off documentation
- **Standards-compliant** designs referencing applicable standards
- **Risk-aware** recommendations with mitigation strategies
- **Actionable outputs** with implementation guidance

### Best Practices

1. Provide clear requirements and constraints
2. Specify applicable standards and regulations
3. Include budget and timeline information
4. Mention existing infrastructure to integrate with
5. Clarify safety criticality level

## Related Resources

- [ros-integration skill](../../skills/ros-integration/) - ROS development
- [urdf-sdf-model skill](../../skills/urdf-sdf-model/) - Robot modeling
- [gazebo-simulation skill](../../skills/gazebo-simulation/) - Simulation
- [ros-expert agent](../ros-expert/) - ROS expertise

## References

- [ROS2 Design](https://design.ros2.org/)
- [ISO 10218 Industrial Robots](https://www.iso.org/standard/51330.html)
- [ISO 13482 Personal Care Robots](https://www.iso.org/standard/53820.html)
- [ISO 3691-4 AGV Safety](https://www.iso.org/standard/70660.html)
- [Systems Engineering Handbook](https://www.incose.org/products-and-publications/se-handbook)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-001
**Category:** Architecture
**Status:** Active
