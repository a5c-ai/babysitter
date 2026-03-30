---
name: ros-integration
description: Deep integration with ROS/ROS2 middleware for node development, launch files, package management, and robot communication. Execute ros2 commands, create and validate packages, configure publishers/subscribers/services/actions, and debug topic connectivity.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: middleware
  backlog-id: SK-001
---

# ros-integration

You are **ros-integration** - a specialized skill for ROS/ROS2 middleware integration, providing deep capabilities for robot software development, node creation, and system configuration.

## Overview

This skill enables AI-powered ROS/ROS2 development including:
- Generating ROS/ROS2 package structures with proper CMakeLists.txt and package.xml
- Creating launch files (Python launch for ROS2, XML for ROS1)
- Configuring node parameters and YAML configuration files
- Setting up publishers, subscribers, services, and actions
- Generating message, service, and action definitions
- Configuring QoS policies for DDS communication
- Implementing lifecycle node management (ROS2)
- Debugging topic/service connectivity issues
- Configuring tf2 transform broadcasts

## Prerequisites

- ROS/ROS2 installation (Humble, Iron, or Rolling recommended for ROS2)
- colcon build tools (ROS2) or catkin (ROS1)
- rosdep for dependency management
- Python 3.8+ for launch files

## Capabilities

### 1. Package Generation

Generate complete ROS2 packages with proper structure:

```bash
# Create a new ROS2 package
ros2 pkg create --build-type ament_python my_robot_pkg \
  --dependencies rclpy std_msgs sensor_msgs geometry_msgs

# For C++ packages
ros2 pkg create --build-type ament_cmake my_robot_cpp_pkg \
  --dependencies rclcpp std_msgs sensor_msgs
```

#### Package Structure (Python)
```
my_robot_pkg/
├── my_robot_pkg/
│   ├── __init__.py
│   ├── my_node.py
│   └── utils/
├── launch/
│   └── robot_launch.py
├── config/
│   └── params.yaml
├── resource/
│   └── my_robot_pkg
├── test/
├── package.xml
├── setup.py
└── setup.cfg
```

### 2. Launch File Creation

Generate Python launch files for ROS2:

```python
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Get package share directory
    pkg_share = get_package_share_directory('my_robot_pkg')

    # Declare launch arguments
    use_sim_time = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation time'
    )

    # Node configuration
    robot_node = Node(
        package='my_robot_pkg',
        executable='my_node',
        name='robot_controller',
        output='screen',
        parameters=[
            os.path.join(pkg_share, 'config', 'params.yaml'),
            {'use_sim_time': LaunchConfiguration('use_sim_time')}
        ],
        remappings=[
            ('/cmd_vel', '/robot/cmd_vel'),
            ('/odom', '/robot/odom')
        ]
    )

    return LaunchDescription([
        use_sim_time,
        robot_node
    ])
```

### 3. Node Development

Create ROS2 nodes with publishers, subscribers, services, and actions:

```python
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
from std_msgs.msg import String
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan

class RobotController(Node):
    def __init__(self):
        super().__init__('robot_controller')

        # Declare parameters
        self.declare_parameter('max_speed', 1.0)
        self.declare_parameter('safety_distance', 0.5)

        # QoS profile for sensor data
        sensor_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )

        # Publishers
        self.cmd_vel_pub = self.create_publisher(
            Twist, '/cmd_vel', 10
        )

        # Subscribers
        self.laser_sub = self.create_subscription(
            LaserScan, '/scan', self.laser_callback, sensor_qos
        )

        # Timer for control loop
        self.timer = self.create_timer(0.1, self.control_loop)

        self.get_logger().info('Robot controller initialized')

    def laser_callback(self, msg):
        # Process laser scan data
        self.latest_scan = msg

    def control_loop(self):
        # Main control logic
        max_speed = self.get_parameter('max_speed').value
        # ... control logic ...

def main(args=None):
    rclpy.init(args=args)
    node = RobotController()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### 4. Message/Service/Action Definitions

Generate custom message definitions:

```
# msg/RobotStatus.msg
std_msgs/Header header
string robot_name
float64 battery_level
bool is_moving
geometry_msgs/Pose current_pose
float64[] joint_positions
```

Service definition:
```
# srv/SetMode.srv
string mode
---
bool success
string message
```

Action definition:
```
# action/Navigate.action
# Goal
geometry_msgs/PoseStamped target_pose
float64 timeout
---
# Result
bool success
string message
float64 elapsed_time
---
# Feedback
float64 distance_remaining
float64 estimated_time_remaining
```

### 5. QoS Configuration

Configure Quality of Service policies for different use cases:

```python
from rclpy.qos import QoSProfile, QoSReliabilityPolicy, QoSHistoryPolicy, QoSDurabilityPolicy

# Sensor data (high frequency, lossy)
sensor_qos = QoSProfile(
    reliability=QoSReliabilityPolicy.BEST_EFFORT,
    history=QoSHistoryPolicy.KEEP_LAST,
    depth=5
)

# Control commands (reliable)
control_qos = QoSProfile(
    reliability=QoSReliabilityPolicy.RELIABLE,
    history=QoSHistoryPolicy.KEEP_LAST,
    depth=10
)

# Parameters and configuration (transient local)
config_qos = QoSProfile(
    reliability=QoSReliabilityPolicy.RELIABLE,
    durability=QoSDurabilityPolicy.TRANSIENT_LOCAL,
    history=QoSHistoryPolicy.KEEP_LAST,
    depth=1
)
```

### 6. Debugging Commands

Debug ROS2 systems:

```bash
# List all nodes
ros2 node list

# Get node info
ros2 node info /robot_controller

# List topics
ros2 topic list -t

# Echo topic
ros2 topic echo /cmd_vel

# Topic bandwidth/frequency
ros2 topic hz /scan
ros2 topic bw /camera/image_raw

# Service list and call
ros2 service list
ros2 service call /set_mode my_robot_pkg/srv/SetMode "{mode: 'autonomous'}"

# Parameter operations
ros2 param list /robot_controller
ros2 param get /robot_controller max_speed
ros2 param set /robot_controller max_speed 2.0

# TF2 debugging
ros2 run tf2_tools view_frames
ros2 run tf2_ros tf2_echo base_link odom
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| ros-mcp-server (robotmcp) | ROS/ROS2 bridge via MCP | [GitHub](https://github.com/robotmcp/ros-mcp-server) |
| ros2-mcp-server (kakimochi) | Python-based ROS2 MCP integration | [Glama](https://glama.ai/mcp/servers/@kakimochi/ros2-mcp-server) |
| roba-labs-mcp | ROS documentation and learning resources | [Glama](https://glama.ai/mcp/servers/@Tairon-ai/roba-labs-mcp) |

## Best Practices

1. **Use namespaces** - Organize nodes with proper namespaces for multi-robot systems
2. **Parameter files** - Keep configuration in YAML files, not hardcoded
3. **QoS matching** - Ensure publishers and subscribers use compatible QoS
4. **Lifecycle nodes** - Use managed lifecycle for clean startup/shutdown
5. **Composition** - Use component containers for efficient node composition
6. **Testing** - Include launch_testing for integration tests

## Process Integration

This skill integrates with the following processes:
- `robot-system-design.js` - System architecture with ROS nodes
- `robot-calibration.js` - Calibration node development
- `gazebo-simulation-setup.js` - ROS-Gazebo integration
- `nav2-navigation-setup.js` - Navigation stack configuration
- `multi-robot-coordination.js` - Multi-robot ROS communication

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "create-package",
  "packageName": "my_robot_pkg",
  "buildType": "ament_python",
  "status": "success",
  "artifacts": [
    "my_robot_pkg/package.xml",
    "my_robot_pkg/setup.py",
    "my_robot_pkg/my_robot_pkg/__init__.py"
  ],
  "nextSteps": [
    "Add node implementation",
    "Create launch file",
    "Build with colcon build"
  ]
}
```

## Error Handling

- Capture full error output from ros2 commands
- Check for missing dependencies with rosdep
- Verify DDS configuration for communication issues
- Check QoS compatibility for topic connectivity
- Validate package.xml and CMakeLists.txt syntax

## Constraints

- Verify ROS2 distribution before operations
- Use sourced workspace for all commands
- Respect package naming conventions (snake_case)
- Follow ROS2 design patterns and best practices
