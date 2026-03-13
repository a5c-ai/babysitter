---
name: gazebo-simulation
description: Expert skill for Gazebo Classic and Ignition/Gazebo Sim world creation and plugin development. Create SDF worlds with terrain, lighting, physics configuration, sensor models, and custom plugins.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: simulation
  backlog-id: SK-002
---

# gazebo-simulation

You are **gazebo-simulation** - a specialized skill for Gazebo simulation environment creation, configuration, and plugin development.

## Overview

This skill enables AI-powered Gazebo simulation including:
- Creating SDF world files with terrain, lighting, and physics
- Configuring physics engine parameters (ODE, Bullet, DART)
- Implementing Gazebo plugins (model, world, sensor, visual)
- Generating sensor models (camera, LiDAR, IMU, GPS, depth)
- Setting up contact sensors and force-torque sensors
- Configuring dynamic actors and animated models
- Implementing custom physics materials and friction
- Creating procedural world generation
- Optimizing simulation performance (LOD, collision simplification)
- Setting up multi-robot simulation instances

## Prerequisites

- Gazebo Sim (Harmonic, Ionic) or Gazebo Classic (11)
- ROS2 with gazebo_ros_pkgs
- SDF specification knowledge
- C++ development tools for custom plugins

## Capabilities

### 1. World File Creation

Generate SDF world files:

```xml
<?xml version="1.0" ?>
<sdf version="1.8">
  <world name="robot_world">
    <!-- Physics Configuration -->
    <physics name="default_physics" type="ode">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1.0</real_time_factor>
      <real_time_update_rate>1000</real_time_update_rate>
      <ode>
        <solver>
          <type>quick</type>
          <iters>50</iters>
          <sor>1.3</sor>
        </solver>
        <constraints>
          <cfm>0.0</cfm>
          <erp>0.2</erp>
          <contact_max_correcting_vel>100.0</contact_max_correcting_vel>
          <contact_surface_layer>0.001</contact_surface_layer>
        </constraints>
      </ode>
    </physics>

    <!-- Lighting -->
    <light type="directional" name="sun">
      <cast_shadows>true</cast_shadows>
      <pose>0 0 10 0 0 0</pose>
      <diffuse>0.8 0.8 0.8 1</diffuse>
      <specular>0.2 0.2 0.2 1</specular>
      <direction>-0.5 0.1 -0.9</direction>
    </light>

    <light type="point" name="point_light">
      <pose>5 5 3 0 0 0</pose>
      <diffuse>0.5 0.5 0.5 1</diffuse>
      <specular>0.1 0.1 0.1 1</specular>
      <attenuation>
        <range>20</range>
        <linear>0.05</linear>
        <quadratic>0.001</quadratic>
      </attenuation>
    </light>

    <!-- Ground Plane -->
    <model name="ground_plane">
      <static>true</static>
      <link name="link">
        <collision name="collision">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
              <size>100 100</size>
            </plane>
          </geometry>
          <surface>
            <friction>
              <ode>
                <mu>100</mu>
                <mu2>50</mu2>
              </ode>
            </friction>
          </surface>
        </collision>
        <visual name="visual">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
              <size>100 100</size>
            </plane>
          </geometry>
          <material>
            <ambient>0.8 0.8 0.8 1</ambient>
            <diffuse>0.8 0.8 0.8 1</diffuse>
          </material>
        </visual>
      </link>
    </model>

    <!-- Include Models -->
    <include>
      <uri>model://my_robot</uri>
      <name>robot1</name>
      <pose>0 0 0.1 0 0 0</pose>
    </include>

    <!-- Plugins -->
    <plugin filename="gz-sim-physics-system" name="gz::sim::systems::Physics"/>
    <plugin filename="gz-sim-user-commands-system" name="gz::sim::systems::UserCommands"/>
    <plugin filename="gz-sim-scene-broadcaster-system" name="gz::sim::systems::SceneBroadcaster"/>
    <plugin filename="gz-sim-sensors-system" name="gz::sim::systems::Sensors">
      <render_engine>ogre2</render_engine>
    </plugin>

  </world>
</sdf>
```

### 2. Physics Engine Configuration

Configure different physics engines:

```xml
<!-- ODE (Default, fast) -->
<physics name="ode_physics" type="ode">
  <max_step_size>0.001</max_step_size>
  <real_time_factor>1.0</real_time_factor>
  <ode>
    <solver>
      <type>quick</type>
      <iters>50</iters>
    </solver>
  </ode>
</physics>

<!-- Bullet (Better for complex collisions) -->
<physics name="bullet_physics" type="bullet">
  <max_step_size>0.001</max_step_size>
  <real_time_factor>1.0</real_time_factor>
  <bullet>
    <solver>
      <type>sequential_impulse</type>
      <iters>50</iters>
      <sor>1.3</sor>
    </solver>
  </bullet>
</physics>

<!-- DART (Best for robotics, articulated bodies) -->
<physics name="dart_physics" type="dart">
  <max_step_size>0.001</max_step_size>
  <real_time_factor>1.0</real_time_factor>
  <dart>
    <collision_detector>fcl</collision_detector>
    <solver>
      <solver_type>pgs</solver_type>
    </solver>
  </dart>
</physics>
```

### 3. Sensor Configuration

Add various sensors to robots:

```xml
<!-- Camera Sensor -->
<sensor name="camera" type="camera">
  <always_on>true</always_on>
  <update_rate>30</update_rate>
  <camera>
    <horizontal_fov>1.3962634</horizontal_fov>
    <image>
      <width>640</width>
      <height>480</height>
      <format>R8G8B8</format>
    </image>
    <clip>
      <near>0.1</near>
      <far>100</far>
    </clip>
    <noise>
      <type>gaussian</type>
      <mean>0</mean>
      <stddev>0.007</stddev>
    </noise>
  </camera>
  <plugin filename="gz-sim-camera-system" name="gz::sim::systems::Camera"/>
</sensor>

<!-- Depth Camera -->
<sensor name="depth_camera" type="depth_camera">
  <always_on>true</always_on>
  <update_rate>15</update_rate>
  <camera>
    <horizontal_fov>1.047</horizontal_fov>
    <image>
      <width>640</width>
      <height>480</height>
      <format>R_FLOAT32</format>
    </image>
    <clip>
      <near>0.1</near>
      <far>10</far>
    </clip>
  </camera>
  <plugin filename="gz-sim-depth-camera-system" name="gz::sim::systems::DepthCamera"/>
</sensor>

<!-- LiDAR Sensor -->
<sensor name="lidar" type="gpu_lidar">
  <always_on>true</always_on>
  <update_rate>10</update_rate>
  <lidar>
    <scan>
      <horizontal>
        <samples>640</samples>
        <resolution>1</resolution>
        <min_angle>-3.14159</min_angle>
        <max_angle>3.14159</max_angle>
      </horizontal>
      <vertical>
        <samples>16</samples>
        <resolution>1</resolution>
        <min_angle>-0.26</min_angle>
        <max_angle>0.26</max_angle>
      </vertical>
    </scan>
    <range>
      <min>0.3</min>
      <max>100</max>
      <resolution>0.01</resolution>
    </range>
    <noise>
      <type>gaussian</type>
      <mean>0</mean>
      <stddev>0.01</stddev>
    </noise>
  </lidar>
  <plugin filename="gz-sim-gpu-lidar-system" name="gz::sim::systems::GpuLidar"/>
</sensor>

<!-- IMU Sensor -->
<sensor name="imu" type="imu">
  <always_on>true</always_on>
  <update_rate>200</update_rate>
  <imu>
    <angular_velocity>
      <x>
        <noise type="gaussian">
          <mean>0.0</mean>
          <stddev>0.0002</stddev>
        </noise>
      </x>
      <y>
        <noise type="gaussian">
          <mean>0.0</mean>
          <stddev>0.0002</stddev>
        </noise>
      </y>
      <z>
        <noise type="gaussian">
          <mean>0.0</mean>
          <stddev>0.0002</stddev>
        </noise>
      </z>
    </angular_velocity>
    <linear_acceleration>
      <x>
        <noise type="gaussian">
          <mean>0.0</mean>
          <stddev>0.017</stddev>
        </noise>
      </x>
    </linear_acceleration>
  </imu>
  <plugin filename="gz-sim-imu-system" name="gz::sim::systems::Imu"/>
</sensor>

<!-- GPS Sensor -->
<sensor name="gps" type="navsat">
  <always_on>true</always_on>
  <update_rate>5</update_rate>
  <navsat>
    <position_sensing>
      <horizontal>
        <noise type="gaussian">
          <mean>0</mean>
          <stddev>0.5</stddev>
        </noise>
      </horizontal>
      <vertical>
        <noise type="gaussian">
          <mean>0</mean>
          <stddev>1.0</stddev>
        </noise>
      </vertical>
    </position_sensing>
  </navsat>
  <plugin filename="gz-sim-navsat-system" name="gz::sim::systems::NavSat"/>
</sensor>
```

### 4. ROS2-Gazebo Bridge

Configure ROS2 bridge for topics:

```xml
<!-- In world file -->
<plugin filename="gz-sim-ros-gz-bridge" name="ros_gz_bridge::RosGzBridge">
  <ros>
    <namespace>/robot</namespace>
  </ros>

  <!-- Camera -->
  <bridge topic="/camera/image_raw" ros_topic="/robot/camera/image_raw" type="sensor_msgs/msg/Image" direction="GZ_TO_ROS"/>
  <bridge topic="/camera/camera_info" ros_topic="/robot/camera/camera_info" type="sensor_msgs/msg/CameraInfo" direction="GZ_TO_ROS"/>

  <!-- LiDAR -->
  <bridge topic="/lidar/points" ros_topic="/robot/scan" type="sensor_msgs/msg/PointCloud2" direction="GZ_TO_ROS"/>

  <!-- IMU -->
  <bridge topic="/imu" ros_topic="/robot/imu" type="sensor_msgs/msg/Imu" direction="GZ_TO_ROS"/>

  <!-- Velocity Commands -->
  <bridge topic="/cmd_vel" ros_topic="/robot/cmd_vel" type="geometry_msgs/msg/Twist" direction="ROS_TO_GZ"/>

  <!-- Odometry -->
  <bridge topic="/odom" ros_topic="/robot/odom" type="nav_msgs/msg/Odometry" direction="GZ_TO_ROS"/>

  <!-- Joint States -->
  <bridge topic="/joint_states" ros_topic="/robot/joint_states" type="sensor_msgs/msg/JointState" direction="GZ_TO_ROS"/>

  <!-- TF -->
  <bridge topic="/tf" ros_topic="/tf" type="tf2_msgs/msg/TFMessage" direction="GZ_TO_ROS"/>
</plugin>
```

### 5. Terrain and Environment

Create terrain and environment models:

```xml
<!-- Heightmap Terrain -->
<model name="terrain">
  <static>true</static>
  <link name="link">
    <collision name="collision">
      <geometry>
        <heightmap>
          <uri>file://terrain/heightmap.png</uri>
          <size>100 100 10</size>
          <pos>0 0 0</pos>
        </heightmap>
      </geometry>
    </collision>
    <visual name="visual">
      <geometry>
        <heightmap>
          <uri>file://terrain/heightmap.png</uri>
          <size>100 100 10</size>
          <pos>0 0 0</pos>
          <texture>
            <diffuse>file://terrain/grass.png</diffuse>
            <normal>file://terrain/grass_normal.png</normal>
            <size>10</size>
          </texture>
        </heightmap>
      </geometry>
    </visual>
  </link>
</model>

<!-- Obstacles -->
<model name="obstacle_box">
  <static>true</static>
  <pose>5 3 0.5 0 0 0</pose>
  <link name="link">
    <collision name="collision">
      <geometry>
        <box>
          <size>1 1 1</size>
        </box>
      </geometry>
    </collision>
    <visual name="visual">
      <geometry>
        <box>
          <size>1 1 1</size>
        </box>
      </geometry>
      <material>
        <ambient>0.5 0.5 0.5 1</ambient>
      </material>
    </visual>
  </link>
</model>
```

### 6. Custom Plugin Development

Create custom Gazebo plugins:

```cpp
// WorldPlugin example
#include <gz/sim/System.hh>
#include <gz/plugin/Register.hh>

namespace my_plugins {

class MyWorldPlugin : public gz::sim::System,
                      public gz::sim::ISystemConfigure,
                      public gz::sim::ISystemPreUpdate
{
public:
  void Configure(const gz::sim::Entity &_entity,
                 const std::shared_ptr<const sdf::Element> &_sdf,
                 gz::sim::EntityComponentManager &_ecm,
                 gz::sim::EventManager &_eventMgr) override
  {
    // Configuration on load
    gzmsg << "MyWorldPlugin configured" << std::endl;
  }

  void PreUpdate(const gz::sim::UpdateInfo &_info,
                 gz::sim::EntityComponentManager &_ecm) override
  {
    // Called before each simulation step
    if (_info.paused)
      return;

    // Custom logic here
  }
};

}

GZ_ADD_PLUGIN(my_plugins::MyWorldPlugin,
              gz::sim::System,
              my_plugins::MyWorldPlugin::ISystemConfigure,
              my_plugins::MyWorldPlugin::ISystemPreUpdate)
```

### 7. Launch File Integration

Launch Gazebo with ROS2:

```python
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    pkg_share = FindPackageShare('my_robot_gazebo')

    # World file
    world_file = PathJoinSubstitution([pkg_share, 'worlds', 'robot_world.sdf'])

    # Gazebo launch
    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([
            FindPackageShare('ros_gz_sim'), '/launch/gz_sim.launch.py'
        ]),
        launch_arguments={
            'gz_args': ['-r ', world_file],
            'on_exit_shutdown': 'true'
        }.items()
    )

    # Spawn robot
    spawn_robot = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=[
            '-name', 'my_robot',
            '-topic', '/robot_description',
            '-x', '0', '-y', '0', '-z', '0.1'
        ],
        output='screen'
    )

    # ROS-GZ Bridge
    bridge = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        arguments=[
            '/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist',
            '/odom@nav_msgs/msg/Odometry@gz.msgs.Odometry',
            '/scan@sensor_msgs/msg/LaserScan@gz.msgs.LaserScan'
        ],
        output='screen'
    )

    return LaunchDescription([
        gazebo,
        spawn_robot,
        bridge
    ])
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| Gazebo MCP Server | ROS2 MCP for Gazebo | [lobehub.com](https://lobehub.com/mcp/yourusername-gazebo-mcp) |
| ros-mcp-server | ROS/ROS2 bridge | [GitHub](https://github.com/robotmcp/ros-mcp-server) |

## Best Practices

1. **Use appropriate physics** - Choose physics engine based on requirements
2. **Sensor noise** - Add realistic noise models to sensors
3. **Collision simplification** - Use simplified collision geometry
4. **Real-time factor** - Adjust for simulation vs real-time requirements
5. **Resource management** - Disable unused sensors to improve performance
6. **Modular worlds** - Use includes for reusable world components

## Process Integration

This skill integrates with the following processes:
- `gazebo-simulation-setup.js` - Primary simulation setup
- `digital-twin-development.js` - Digital twin creation
- `synthetic-data-pipeline.js` - Training data generation
- `simulation-performance-optimization.js` - Performance tuning
- `hil-testing.js` - Hardware-in-the-loop testing

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "create-world",
  "worldName": "robot_world",
  "status": "success",
  "configuration": {
    "physicsEngine": "ode",
    "realTimeFactor": 1.0,
    "sensors": ["camera", "lidar", "imu"]
  },
  "artifacts": [
    "worlds/robot_world.sdf",
    "launch/simulation.launch.py"
  ],
  "launchCommand": "ros2 launch my_robot_gazebo simulation.launch.py"
}
```

## Constraints

- Verify Gazebo version compatibility (Classic vs Sim)
- Check SDF version for feature availability
- Test sensor update rates for performance impact
- Validate physics parameters for stability
- Ensure ROS-GZ bridge topic compatibility
