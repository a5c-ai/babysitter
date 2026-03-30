---
name: urdf-sdf-model
description: Expert skill for robot model creation and validation in URDF and SDF formats. Generate URDF files with proper link-joint hierarchy, create Xacro macros, calculate inertial properties, configure joint types, and validate models.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: robot-modeling
  backlog-id: SK-004
---

# urdf-sdf-model

You are **urdf-sdf-model** - a specialized skill for robot model creation and validation in URDF (Unified Robot Description Format) and SDF (Simulation Description Format).

## Overview

This skill enables AI-powered robot modeling including:
- Generating URDF files with proper link-joint hierarchy
- Creating Xacro macros for modular robot descriptions
- Converting between URDF and SDF formats
- Calculating and setting inertial properties (mass, inertia tensors)
- Importing and optimizing mesh files (visual and collision)
- Configuring joint types (revolute, prismatic, continuous, fixed, floating)
- Setting up transmission and actuator definitions
- Adding sensor plugins and attachments
- Validating models with urdfdom and check_urdf
- Visualizing and debugging in RViz

## Prerequisites

- ROS/ROS2 with urdf packages
- xacro for macro processing
- urdfdom for validation
- Gazebo for SDF validation
- Mesh tools (MeshLab, Blender) for mesh optimization

## Capabilities

### 1. URDF Generation

Generate URDF files with proper structure:

```xml
<?xml version="1.0"?>
<robot name="my_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Materials -->
  <material name="blue">
    <color rgba="0.0 0.0 0.8 1.0"/>
  </material>

  <!-- Base Link -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.5 0.3 0.1"/>
      </geometry>
      <material name="blue"/>
    </visual>
    <collision>
      <geometry>
        <box size="0.5 0.3 0.1"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="10.0"/>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <inertia ixx="0.0833" ixy="0" ixz="0"
               iyy="0.2167" iyz="0" izz="0.2833"/>
    </inertial>
  </link>

  <!-- Wheel Joint -->
  <joint name="wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_link"/>
    <origin xyz="0.2 0.15 -0.05" rpy="-1.5708 0 0"/>
    <axis xyz="0 0 1"/>
    <limit effort="10" velocity="10"/>
    <dynamics damping="0.1" friction="0.1"/>
  </joint>

  <!-- Wheel Link -->
  <link name="wheel_link">
    <visual>
      <geometry>
        <cylinder radius="0.05" length="0.02"/>
      </geometry>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.05" length="0.02"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.0003" ixy="0" ixz="0"
               iyy="0.0003" iyz="0" izz="0.0006"/>
    </inertial>
  </link>

</robot>
```

### 2. Xacro Macros

Create modular robot descriptions with Xacro:

```xml
<?xml version="1.0"?>
<robot name="my_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Properties -->
  <xacro:property name="wheel_radius" value="0.05"/>
  <xacro:property name="wheel_width" value="0.02"/>
  <xacro:property name="wheel_mass" value="0.5"/>

  <!-- Inertia Macros -->
  <xacro:macro name="cylinder_inertia" params="m r h">
    <inertia ixx="${m*(3*r*r+h*h)/12}" ixy="0" ixz="0"
             iyy="${m*(3*r*r+h*h)/12}" iyz="0" izz="${m*r*r/2}"/>
  </xacro:macro>

  <xacro:macro name="box_inertia" params="m x y z">
    <inertia ixx="${m*(y*y+z*z)/12}" ixy="0" ixz="0"
             iyy="${m*(x*x+z*z)/12}" iyz="0" izz="${m*(x*x+y*y)/12}"/>
  </xacro:macro>

  <!-- Wheel Macro -->
  <xacro:macro name="wheel" params="prefix parent x_offset y_offset">
    <joint name="${prefix}_wheel_joint" type="continuous">
      <parent link="${parent}"/>
      <child link="${prefix}_wheel_link"/>
      <origin xyz="${x_offset} ${y_offset} 0" rpy="-1.5708 0 0"/>
      <axis xyz="0 0 1"/>
      <limit effort="10" velocity="10"/>
      <dynamics damping="0.1" friction="0.1"/>
    </joint>

    <link name="${prefix}_wheel_link">
      <visual>
        <geometry>
          <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
        </geometry>
        <material name="black"/>
      </visual>
      <collision>
        <geometry>
          <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
        </geometry>
      </collision>
      <inertial>
        <mass value="${wheel_mass}"/>
        <xacro:cylinder_inertia m="${wheel_mass}" r="${wheel_radius}" h="${wheel_width}"/>
      </inertial>
    </link>

    <!-- Gazebo friction -->
    <gazebo reference="${prefix}_wheel_link">
      <mu1>1.0</mu1>
      <mu2>1.0</mu2>
      <kp>1e6</kp>
      <kd>1.0</kd>
    </gazebo>
  </xacro:macro>

  <!-- Instantiate wheels -->
  <xacro:wheel prefix="front_left" parent="base_link" x_offset="0.15" y_offset="0.12"/>
  <xacro:wheel prefix="front_right" parent="base_link" x_offset="0.15" y_offset="-0.12"/>
  <xacro:wheel prefix="rear_left" parent="base_link" x_offset="-0.15" y_offset="0.12"/>
  <xacro:wheel prefix="rear_right" parent="base_link" x_offset="-0.15" y_offset="-0.12"/>

</robot>
```

### 3. Inertia Calculations

Calculate inertia tensors for common geometries:

```python
import numpy as np

def box_inertia(mass, x, y, z):
    """Calculate inertia tensor for a box centered at origin."""
    ixx = mass * (y**2 + z**2) / 12
    iyy = mass * (x**2 + z**2) / 12
    izz = mass * (x**2 + y**2) / 12
    return {'ixx': ixx, 'iyy': iyy, 'izz': izz, 'ixy': 0, 'ixz': 0, 'iyz': 0}

def cylinder_inertia(mass, radius, height):
    """Calculate inertia tensor for a cylinder along z-axis."""
    ixx = mass * (3 * radius**2 + height**2) / 12
    iyy = mass * (3 * radius**2 + height**2) / 12
    izz = mass * radius**2 / 2
    return {'ixx': ixx, 'iyy': iyy, 'izz': izz, 'ixy': 0, 'ixz': 0, 'iyz': 0}

def sphere_inertia(mass, radius):
    """Calculate inertia tensor for a solid sphere."""
    i = 2 * mass * radius**2 / 5
    return {'ixx': i, 'iyy': i, 'izz': i, 'ixy': 0, 'ixz': 0, 'iyz': 0}

def mesh_inertia_from_stl(stl_file, mass, density=None):
    """Estimate inertia from STL mesh using convex hull approximation."""
    # Use trimesh or similar library for accurate calculation
    import trimesh
    mesh = trimesh.load(stl_file)
    mesh.density = density if density else mass / mesh.volume
    return mesh.moment_inertia
```

### 4. Joint Types Configuration

Configure different joint types:

```xml
<!-- Revolute Joint (limited rotation) -->
<joint name="arm_joint" type="revolute">
  <parent link="base"/>
  <child link="arm"/>
  <origin xyz="0 0 0.1" rpy="0 0 0"/>
  <axis xyz="0 1 0"/>
  <limit lower="-1.57" upper="1.57" effort="100" velocity="1.0"/>
  <dynamics damping="0.5" friction="0.1"/>
</joint>

<!-- Continuous Joint (unlimited rotation) -->
<joint name="wheel_joint" type="continuous">
  <parent link="base"/>
  <child link="wheel"/>
  <axis xyz="0 0 1"/>
  <limit effort="10" velocity="10"/>
</joint>

<!-- Prismatic Joint (linear motion) -->
<joint name="slider_joint" type="prismatic">
  <parent link="base"/>
  <child link="slider"/>
  <origin xyz="0 0 0"/>
  <axis xyz="0 0 1"/>
  <limit lower="0" upper="0.5" effort="50" velocity="0.5"/>
</joint>

<!-- Fixed Joint (no motion) -->
<joint name="sensor_mount" type="fixed">
  <parent link="base"/>
  <child link="sensor"/>
  <origin xyz="0.1 0 0.05" rpy="0 0 0"/>
</joint>
```

### 5. Sensor Attachments

Add sensors to the robot model:

```xml
<!-- Camera Sensor -->
<link name="camera_link">
  <visual>
    <geometry>
      <box size="0.02 0.05 0.02"/>
    </geometry>
  </visual>
</link>

<joint name="camera_joint" type="fixed">
  <parent link="base_link"/>
  <child link="camera_link"/>
  <origin xyz="0.2 0 0.1" rpy="0 0 0"/>
</joint>

<gazebo reference="camera_link">
  <sensor type="camera" name="camera">
    <update_rate>30.0</update_rate>
    <camera>
      <horizontal_fov>1.3962634</horizontal_fov>
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.02</near>
        <far>100</far>
      </clip>
    </camera>
    <plugin name="camera_plugin" filename="libgazebo_ros_camera.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>image_raw:=camera/image_raw</remapping>
        <remapping>camera_info:=camera/camera_info</remapping>
      </ros>
      <frame_name>camera_link</frame_name>
    </plugin>
  </sensor>
</gazebo>

<!-- LiDAR Sensor -->
<link name="lidar_link">
  <visual>
    <geometry>
      <cylinder radius="0.03" length="0.04"/>
    </geometry>
  </visual>
</link>

<gazebo reference="lidar_link">
  <sensor type="ray" name="lidar">
    <pose>0 0 0 0 0 0</pose>
    <visualize>true</visualize>
    <update_rate>10</update_rate>
    <ray>
      <scan>
        <horizontal>
          <samples>360</samples>
          <resolution>1</resolution>
          <min_angle>-3.14159</min_angle>
          <max_angle>3.14159</max_angle>
        </horizontal>
      </scan>
      <range>
        <min>0.1</min>
        <max>10.0</max>
        <resolution>0.01</resolution>
      </range>
    </ray>
    <plugin name="lidar_plugin" filename="libgazebo_ros_ray_sensor.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>~/out:=scan</remapping>
      </ros>
      <output_type>sensor_msgs/LaserScan</output_type>
      <frame_name>lidar_link</frame_name>
    </plugin>
  </sensor>
</gazebo>
```

### 6. Model Validation

Validate URDF models:

```bash
# Check URDF syntax
check_urdf robot.urdf

# Process Xacro and check
xacro robot.urdf.xacro > robot.urdf && check_urdf robot.urdf

# Visualize URDF tree
urdf_to_graphviz robot.urdf

# View in RViz
ros2 launch urdf_tutorial display.launch.py model:=robot.urdf.xacro

# Convert URDF to SDF
gz sdf -p robot.urdf > robot.sdf
```

### 7. SDF Format

Generate SDF for Gazebo:

```xml
<?xml version='1.0'?>
<sdf version='1.7'>
  <model name='my_robot'>
    <link name='base_link'>
      <inertial>
        <mass>10.0</mass>
        <inertia>
          <ixx>0.0833</ixx>
          <iyy>0.2167</iyy>
          <izz>0.2833</izz>
        </inertia>
      </inertial>
      <collision name='base_collision'>
        <geometry>
          <box>
            <size>0.5 0.3 0.1</size>
          </box>
        </geometry>
        <surface>
          <friction>
            <ode>
              <mu>1.0</mu>
              <mu2>1.0</mu2>
            </ode>
          </friction>
        </surface>
      </collision>
      <visual name='base_visual'>
        <geometry>
          <box>
            <size>0.5 0.3 0.1</size>
          </box>
        </geometry>
        <material>
          <ambient>0.0 0.0 0.8 1</ambient>
        </material>
      </visual>
    </link>
  </model>
</sdf>
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| CAD-Query MCP | Parametric 3D modeling | [mcpservers.org](https://mcpservers.org/servers/rishigundakaram/cadquery-mcp-server) |
| FreeCAD MCP | FreeCAD integration | [GitHub](https://github.com/bonninr/freecad_mcp) |
| Blender MCP | Mesh creation and editing | [blender-mcp.com](https://blender-mcp.com/) |
| OpenSCAD MCP | Parametric modeling | [playbooks.com](https://playbooks.com/mcp/jhacksman-openscad) |

## Best Practices

1. **Consistent units** - Use SI units (meters, kilograms, radians)
2. **Origin placement** - Place link origins at center of mass when possible
3. **Collision geometry** - Use simplified collision meshes for performance
4. **Inertia accuracy** - Calculate accurate inertia for stable simulation
5. **Mesh optimization** - Reduce polygon count for collision meshes
6. **Modular design** - Use Xacro macros for reusable components

## Process Integration

This skill integrates with the following processes:
- `robot-urdf-sdf-model.js` - Primary model creation process
- `robot-system-design.js` - System architecture with models
- `moveit-manipulation-planning.js` - MoveIt configuration
- `gazebo-simulation-setup.js` - Simulation model setup

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "create-urdf",
  "robotName": "my_robot",
  "status": "success",
  "validation": {
    "syntaxValid": true,
    "inertiasValid": true,
    "jointsValid": true
  },
  "artifacts": [
    "urdf/my_robot.urdf.xacro",
    "meshes/base_link.stl",
    "meshes/wheel.stl"
  ],
  "statistics": {
    "links": 5,
    "joints": 4,
    "sensors": 2
  }
}
```

## Constraints

- Verify coordinate frame conventions (REP-103)
- Ensure consistent units throughout model
- Validate inertia tensors are physically plausible
- Check for self-collision in collision geometry
- Respect Gazebo SDF version compatibility
