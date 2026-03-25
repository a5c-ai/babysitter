# Robotics and Simulation Engineering - Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that match the skills and agents identified in the backlog for the Robotics and Simulation Engineering specialization.

---

## Table of Contents

1. [Overview](#overview)
2. [ROS/ROS2 Integration Resources](#rosros2-integration-resources)
3. [Simulation Resources](#simulation-resources)
4. [Perception and SLAM Resources](#perception-and-slam-resources)
5. [Motion Planning and Navigation Resources](#motion-planning-and-navigation-resources)
6. [Control and Hardware Resources](#control-and-hardware-resources)
7. [Machine Learning and RL Resources](#machine-learning-and-rl-resources)
8. [CAD and Robot Modeling Resources](#cad-and-robot-modeling-resources)
9. [Safety and Industrial IoT Resources](#safety-and-industrial-iot-resources)
10. [Multi-Robot and Fleet Management Resources](#multi-robot-and-fleet-management-resources)
11. [Computer Vision Resources](#computer-vision-resources)
12. [General Robotics Resources](#general-robotics-resources)
13. [Awesome Lists and Directories](#awesome-lists-and-directories)
14. [Summary Statistics](#summary-statistics)

---

## Overview

This reference document was created as Phase 5 of the Robotics and Simulation specialization development. It maps external community resources to the 25 skills and 15 agents identified in the skills-agents-backlog.md.

### Search Sources
- GitHub Topics: claude-skills, mcp-servers, ros, robotics
- Curated Lists: awesome-mcp-servers, awesome-mcp-hardware, awesome-ros-mobile-robot
- MCP Directories: mcpservers.org, mcp-awesome.com, pulsemcp.com
- Research: arXiv papers on MCP and robotics integration

---

## ROS/ROS2 Integration Resources

### MCP Servers

#### ROS MCP Server (robotmcp)
**Matches**: SK-001 (ROS/ROS2 Integration), SK-020 (TF2 Transforms), AG-015 (ROS/ROS2 Expert)

| Field | Value |
|-------|-------|
| Repository | [robotmcp/ros-mcp-server](https://github.com/robotmcp/ros-mcp-server) |
| Stars | 940+ |
| License | Apache 2.0 |
| ROS Support | ROS1 and ROS2 |

**Description**: Connect AI models like Claude, GPT, and Gemini with robots using MCP and ROS. Enables natural language control of ROS-based robots without modifying existing robot code.

**Capabilities**:
- List topics, services, and message types
- Publish/subscribe to topics for real-time data streaming
- Call custom ROS services directly
- Get/set parameters dynamically
- View custom type definitions
- Support for both ROS1 and ROS2

**Integration Notes**: Requires only adding a rosbridge node to existing robot systems.

---

#### ROS2 MCP Server (kakimochi)
**Matches**: SK-001 (ROS/ROS2 Integration), SK-022 (ros2_control)

| Field | Value |
|-------|-------|
| Repository | [@kakimochi/ros2-mcp-server](https://glama.ai/mcp/servers/@kakimochi/ros2-mcp-server) |
| Platform | Glama MCP Directory |
| Language | Python |

**Description**: A Python-based server that integrates MCP with ROS 2, enabling AI assistants to control robots via ROS 2 topics. Processes commands through FastMCP and runs as a ROS 2 node.

**Capabilities**:
- Publishes geometry_msgs/Twist messages to /cmd_vel
- FastMCP integration
- Real-time robot control

---

#### ROS Robot Control MCP Server
**Matches**: SK-001 (ROS/ROS2 Integration), AG-015 (ROS/ROS2 Expert)

| Field | Value |
|-------|-------|
| Directory | [playbooks.com/mcp/lpigeon-ros-robot-control](https://playbooks.com/mcp/lpigeon-ros-robot-control) |
| Listing | [pulsemcp.com](https://www.pulsemcp.com/servers/lpigeon-ros-robot-control) |

**Description**: Connects LLMs with robots through bidirectional AI integration. Enables natural language robot control and gives AI visibility into robot state, sensor data, and system information through ROS/ROS2.

---

#### Roba Labs MCP Server
**Matches**: SK-001 (ROS/ROS2 Integration), AG-015 (ROS/ROS2 Expert)

| Field | Value |
|-------|-------|
| Repository | [@Tairon-ai/roba-labs-mcp](https://glama.ai/mcp/servers/@Tairon-ai/roba-labs-mcp) |
| API Required | No |

**Description**: Provides comprehensive access to information, documentation, and learning resources for the Robot Operating System (ROS and ROS2) frameworks. Designed for AI assistants helping with robotics development.

---

#### Robot MCP Client
**Matches**: SK-001 (ROS/ROS2 Integration)

| Field | Value |
|-------|-------|
| Repository | [robotmcp/robot-mcp-client](https://github.com/robotmcp/robot-mcp-client) |
| Organization | [Robot MCP](https://github.com/robotmcp) |

**Description**: Client component for connecting AI models with robots using MCP and ROS.

---

### Research

#### ROSBag MCP Server
**Matches**: SK-001 (ROS/ROS2 Integration), AG-011 (Integration Test Engineer)

| Field | Value |
|-------|-------|
| Paper | [arXiv:2511.03497](https://arxiv.org/pdf/2511.03497) |
| Topic | ROS bag analysis with LLMs |

**Description**: Academic paper introducing an MCP server for ROS and ROS 2 bag analysis, enabling natural language interaction with robotic datasets through LLMs and VLMs.

**Capabilities**:
- Trajectory analysis
- Laser scan processing
- Coordinate frame transformations
- Domain-specific tooling

**Performance**: Claude Sonnet 4 achieved 100% task completion rates in experimental evaluation.

---

## Simulation Resources

### MCP Servers

#### Gazebo MCP Server
**Matches**: SK-002 (Gazebo Simulation), AG-005 (Simulation Engineer)

| Field | Value |
|-------|-------|
| Directory | [lobehub.com/mcp/yourusername-gazebo-mcp](https://lobehub.com/mcp/yourusername-gazebo-mcp) |
| ROS Version | ROS2 |

**Description**: ROS2 Model Context Protocol Server for Gazebo Simulation enabling AI assistants to control Gazebo simulations.

**Capabilities**:
- Spawn robots (TurtleBot3) and models
- Manipulate simulation environments
- Generate test worlds
- Gather sensor data through standardized MCP interface
- List models in simulation
- Get model state

**Supported Sensors**: camera, depth_camera, rgbd_camera, imu, lidar, ray, gps, contact, force_torque, magnetometer, altimeter, sonar

**Token Efficiency**: Filtering locally in MCP server can achieve 95%+ token savings compared to sending all data through the model.

---

#### Isaac Sim MCP Server
**Matches**: SK-003 (NVIDIA Isaac Sim), AG-005 (Simulation Engineer)

| Field | Value |
|-------|-------|
| Directory | [mcpnow.io/server/isaac-sim-controller](https://www.mcpnow.io/en/server/isaac-sim-controller-omni-mcp-isaac-sim-mcp) |
| Platform | NVIDIA Omniverse |

**Description**: MCP Server for NVIDIA Isaac Sim that leverages MCP framework to enable natural language control of NVIDIA Isaac Sim, transforming conversational AI inputs into precise simulation manipulation.

**Capabilities**:
- Natural language simulation control
- Photorealistic rendering integration
- Physics simulation control (PhysX)
- Bridge to embodied intelligence applications

---

### Frameworks and Tools

#### NVIDIA TensorRT Edge-LLM
**Matches**: SK-003 (NVIDIA Isaac Sim), SK-025 (Edge Deployment)

| Field | Value |
|-------|-------|
| Repository | [NVIDIA/TensorRT-Edge-LLM](https://github.com/NVIDIA/TensorRT-Edge-LLM) |
| Language | C++ |
| Platform | NVIDIA Jetson, edge devices |

**Description**: High-performance, lightweight C++ LLM and VLM Inference Software for Physical AI, designed for automotive and robotics edge deployment.

**Features**:
- EAGLE-3 speculative decoding
- NVFP4 quantization
- Chunked prefill
- Multi-platform support (Jetson, automotive)

**Adopters**: Bosch, ThunderSoft, MediaTek

---

## Perception and SLAM Resources

### Awesome Lists

#### awesome-visual-slam
**Matches**: SK-007 (SLAM Algorithms), AG-006 (SLAM Specialist)

| Field | Value |
|-------|-------|
| Repository | [tzutalin/awesome-visual-slam](https://github.com/tzutalin/awesome-visual-slam) |
| Content | Vision-based SLAM resources |

**Description**: Curated list of vision-based SLAM / Visual Odometry open source projects, blogs, and papers.

**Covered Algorithms**:
- RTAB-MAP (Real-Time Appearance-Based Mapping)
- ORB-SLAM2/ORB-SLAM3
- LSD-SLAM
- DSO (Direct Sparse Odometry)

---

#### awesome-ros-mobile-robot
**Matches**: SK-006 (Nav2 Navigation), SK-007 (SLAM Algorithms), AG-008 (Navigation Engineer)

| Field | Value |
|-------|-------|
| Repository | [shannon112/awesome-ros-mobile-robot](https://github.com/shannon112/awesome-ros-mobile-robot) |
| Focus | Mobile robots with ROS |

**Description**: Curated list of mobile robot resources based on ROS including SLAM, odometry, navigation, and manipulation.

**Topics Covered**:
- Cartographer
- ORB_SLAM2
- RTAB-Map
- Navigation stack

---

### Tools and Frameworks

#### SLAM Toolbox
**Matches**: SK-007 (SLAM Algorithms), AG-006 (SLAM Specialist)

| Field | Value |
|-------|-------|
| Repository | [SteveMacenski/slam_toolbox](https://github.com/SteveMacenski/slam_toolbox) |
| Maintainer | Steve Macenski |
| ROS Support | ROS2 (official library) |

**Description**: Slam Toolbox for lifelong mapping and localization in potentially massive maps with ROS. Currently supported ROS2-SLAM library.

**Performance**:
- 5x+ real-time up to 30,000 sq. ft.
- 3x real-time up to 60,000 sq. ft.
- Tested on 200,000 sq. ft. buildings

---

#### RTAB-Map ROS
**Matches**: SK-007 (SLAM Algorithms), SK-008 (Point Cloud Processing), AG-006 (SLAM Specialist)

| Field | Value |
|-------|-------|
| Repository | [introlab/rtabmap_ros](https://github.com/introlab/rtabmap_ros) |
| Website | [introlab.github.io/rtabmap](http://introlab.github.io/rtabmap/) |

**Description**: RTAB-Map (Real-Time Appearance-Based Mapping) ROS package. RGB-D, Stereo and Lidar Graph-Based SLAM approach.

**Integration Examples**:
- Stereo and RGB-D cameras
- 3D LiDAR
- TurtleBot3 and TurtleBot4
- Nav2 integration

---

#### PythonRobotics
**Matches**: SK-007 (SLAM Algorithms), SK-014 (Motion Planning), AG-003 (Motion Planning Expert)

| Field | Value |
|-------|-------|
| Repository | [AtsushiSakai/PythonRobotics](https://github.com/AtsushiSakai/PythonRobotics) |
| Stars | 24,000+ |
| Language | Python |

**Description**: Python sample codes and textbook for robotics algorithms.

**Includes**:
- Feature-based SLAM (FastSLAM 1.0)
- Dynamic Window Approach
- Dijkstra's algorithm
- A* algorithm
- Path planning algorithms

---

### MCP Servers for Vision

#### VisionCraft MCP Server
**Matches**: SK-010 (Computer Vision), SK-011 (Object Detection/Segmentation), AG-002 (Perception Engineer)

| Field | Value |
|-------|-------|
| Repository | [augmentedstartups/VisionCraft-MCP-Server](https://github.com/augmentedstartups/VisionCraft-MCP-Server) |
| Focus | Computer Vision knowledge |

**Description**: Delivers up-to-date, specialized computer vision and Gen-AI knowledge directly to Claude and other AI assistants.

**Knowledge Base Coverage**:
- Object Detection
- Segmentation
- 3D Vision
- Vision-Language Models
- Agentic Frameworks (OpenAI Agents SDK, CrewAI)

---

#### Groundlight mcp-vision
**Matches**: SK-010 (Computer Vision), SK-011 (Object Detection/Segmentation), AG-002 (Perception Engineer)

| Field | Value |
|-------|-------|
| Website | [groundlight.ai/blog/vision-as-mcp-service](https://www.groundlight.ai/blog/vision-as-mcp-service) |
| Approach | Vision models via MCP |

**Description**: Extends MCP approach to provide access to specialized vision models (Owl-Vit, YOLO, GroundingDINO, SAM) via MCP server.

**Capabilities**:
- Semantic segmentation
- Panoptic segmentation
- Depth perception
- Object localization
- Specialized-domain image classification

---

## Motion Planning and Navigation Resources

### Nav2 Navigation Stack
**Matches**: SK-006 (Nav2 Navigation), SK-023 (Behavior Trees), AG-008 (Navigation Engineer)

| Field | Value |
|-------|-------|
| Repository | [ros-navigation/navigation2](https://github.com/ros-navigation/navigation2) |
| Documentation | [docs.nav2.org](https://docs.nav2.org/) |
| ROS Version | ROS 2 |

**Description**: ROS 2 Navigation Framework and System for autonomous mobile robots.

**Features**:
- Behavior Tree-based navigation (BehaviorTree.CPP)
- Multiple robot types: holonomic, differential-drive, legged, ackermann
- Costmap layers
- Multiple planners (NavFn, Smac, ThetaStar)
- Multiple controllers (DWB, Regulated Pure Pursuit, MPPI)
- Recovery behaviors

---

### awesome-robotic-tooling
**Matches**: SK-005 (MoveIt Motion Planning), SK-007 (SLAM Algorithms), SK-014 (Motion Planning), AG-003 (Motion Planning Expert)

| Field | Value |
|-------|-------|
| Repository | [Ly0n/awesome-robotic-tooling](https://github.com/Ly0n/awesome-robotic-tooling) |
| Focus | Professional robotic development |

**Description**: Tooling for professional robotic development in C++ and Python with a touch of ROS, autonomous driving, and aerospace.

**SLAM Tools Listed**:
- cartographer_ros
- slam_toolbox
- orb_slam_2_ros
- ORB_SLAM3

**Planning Tools Listed**:
- MoveIt
- OMPL
- Navigation2

---

### Linorobot2
**Matches**: SK-006 (Nav2 Navigation), AG-008 (Navigation Engineer)

| Field | Value |
|-------|-------|
| Repository | [linorobot/linorobot2](https://github.com/linorobot/linorobot2) |
| Robot Types | 2WD, 4WD, Mecanum Drive |

**Description**: ROS2 port of linorobot package for building custom robots with Nav2 integration and Gazebo simulation pipeline.

---

## Control and Hardware Resources

### MCP Servers

#### tinymcp
**Matches**: SK-022 (ros2_control), AG-004 (Control Systems Engineer)

| Field | Value |
|-------|-------|
| Repository | [golioth/tinymcp](https://github.com/golioth/tinymcp) |
| Focus | Embedded devices |

**Description**: Let LLMs control embedded devices via the Model Context Protocol.

---

#### mcp2serial
**Matches**: SK-022 (ros2_control)

| Field | Value |
|-------|-------|
| Repository | [mcp2everything/mcp2serial](https://github.com/mcp2everything/mcp2serial) |
| Platform | Raspberry Pi Pico |

**Description**: Library enabling AI models to regulate hardware via serial communication.

---

#### embedded-debugger-mcp
**Matches**: AG-011 (Integration Test Engineer)

| Field | Value |
|-------|-------|
| Repository | [Adancurusul/embedded-debugger-mcp](https://github.com/Adancurusul/embedded-debugger-mcp) |
| Tool | probe-rs |

**Description**: MCP server facilitating embedded system debugging utilizing probe-rs.

---

#### Choturobo (Arduino Robotics MCP)
**Matches**: SK-022 (ros2_control), AG-011 (Integration Test Engineer)

| Field | Value |
|-------|-------|
| Platform | ESP32, Arduino Nano |
| Integration | Arduino-based robotics |

**Description**: MCP server integrating Arduino-based robotics with AI, enabling control of hardware components like LEDs, motors, servos, and sensors through AI assistants.

---

#### Arduino MCP Server
**Matches**: SK-022 (ros2_control)

| Field | Value |
|-------|-------|
| Repository | [Volt23/mcp-arduino-server](https://github.com/Volt23/mcp-arduino-server) |
| Tool | Arduino CLI |

**Description**: Facilitates Arduino development workflows by bridging MCP with Arduino CLI for sketch, board, library, and file management.

---

#### ESP-MCP
**Matches**: SK-025 (Edge Deployment)

| Field | Value |
|-------|-------|
| Repository | [horw/esp-mcp](https://github.com/horw/esp-mcp) |
| Stars | 130+ |
| Platform | ESP32 series |

**Description**: Workflow for fixing build issues in ESP32 series chips using ESP-IDF.

---

### Reinforcement Learning for Control

#### rl-mpc-locomotion
**Matches**: SK-013 (MPC Controller), SK-015 (Reinforcement Learning), AG-004 (Control Systems Engineer)

| Field | Value |
|-------|-------|
| Repository | [silvery107/rl-mpc-locomotion](https://github.com/silvery107/rl-mpc-locomotion) |
| Focus | Quadruped locomotion |

**Description**: Deep RL for MPC control of Quadruped Robot Locomotion.

---

## Machine Learning and RL Resources

### MCP Servers and Tools

#### MCP-RL (Agent Reinforcement Trainer)
**Matches**: SK-015 (Reinforcement Learning), AG-007 (ML/RL Robotics Agent)

| Field | Value |
|-------|-------|
| Repository | [OpenPipe/ART](https://github.com/OpenPipe/ART) |
| Documentation | [art.openpipe.ai/features/mcp-rl](https://art.openpipe.ai/features/mcp-rl) |

**Description**: Agent Reinforcement Trainer for training multi-step agents using GRPO. Teaches language models to effectively use MCP servers through reinforcement learning.

**Features**:
- Automatic training without manually labeled data
- RULER feedback for reinforcement learning
- Improved tool selection and parameter usage
- Support for Qwen2.5, Qwen3, Llama models

---

#### TensorRT-LLM Agent Skill
**Matches**: SK-025 (Edge Deployment), AG-007 (ML/RL Robotics Agent)

| Field | Value |
|-------|-------|
| Directory | [claude-plugins.dev/skills/@ovachiever/droid-tings/tensorrt-llm](https://claude-plugins.dev/skills/@ovachiever/droid-tings/tensorrt-llm) |
| Platform | NVIDIA GPUs (A100, H100, GB200) |

**Description**: NVIDIA's TensorRT-LLM for optimizing LLM inference with state-of-the-art performance.

**Use Cases**:
- Maximum throughput (24,000+ tokens/sec on Llama)
- Low latency real-time applications
- Quantized models (FP8, INT4, FP4)
- Multi-GPU/node scaling

---

#### PyTorch Documentation Search MCP
**Matches**: SK-015 (Reinforcement Learning), AG-007 (ML/RL Robotics Agent)

| Field | Value |
|-------|-------|
| Repository | [seanmichaelmcgee/pytorch-docs](https://playbooks.com/mcp/seanmichaelmcgee-pytorch-docs) |
| Listing | [pulsemcp.com](https://www.pulsemcp.com/servers/seanmichaelmcgee-pytorch-docs) |

**Description**: Semantic search capabilities over PyTorch documentation using vector embeddings and semantic similarity.

---

### Robot RL Frameworks

#### Robo-Gym
**Matches**: SK-015 (Reinforcement Learning), SK-016 (Sim-to-Real Transfer), AG-007 (ML/RL Robotics Agent)

| Field | Value |
|-------|-------|
| Repository | [jr-robotics/robo-gym](https://github.com/jr-robotics/robo-gym) |
| Framework | Distributed Deep RL |

**Description**: Open source toolkit for Distributed Deep Reinforcement Learning on real and simulated robots.

**Features**:
- Sim-to-real transfer
- Built-in distributed capabilities
- MiR 100 and Universal Robots support

---

#### Unitree RL Gym
**Matches**: SK-015 (Reinforcement Learning), SK-016 (Sim-to-Real Transfer), AG-007 (ML/RL Robotics Agent)

| Field | Value |
|-------|-------|
| Repository | [unitreerobotics/unitree_rl_gym](https://github.com/unitreerobotics/unitree_rl_gym) |
| Robots | Unitree Go2, H1, H1_2, G1 |

**Description**: Reinforcement learning implementation based on Unitree robots.

**Workflow**: Gym training -> Sim2Sim -> Sim2Real

---

#### Humanoid-Gym
**Matches**: SK-015 (Reinforcement Learning), SK-016 (Sim-to-Real Transfer), AG-007 (ML/RL Robotics Agent)

| Field | Value |
|-------|-------|
| Repository | [roboterax/humanoid-gym](https://github.com/roboterax/humanoid-gym) |
| Paper | [arXiv:2404.05695](https://arxiv.org/abs/2404.05695) |
| Platform | NVIDIA Isaac Gym |

**Description**: Easy-to-use RL framework for humanoid robot locomotion with zero-shot sim2real transfer.

---

#### MuJoCo RL UR5
**Matches**: SK-015 (Reinforcement Learning), SK-024 (Grasp Planning), AG-012 (Manipulation Specialist)

| Field | Value |
|-------|-------|
| Repository | [PaulDanielML/MuJoCo_RL_UR5](https://github.com/PaulDanielML/MuJoCo_RL_UR5) |
| Simulator | MuJoCo |
| Task | Grasp prediction |

**Description**: MuJoCo/Gym environment for robot control using Reinforcement Learning with pixel-wise grasp success prediction.

---

## CAD and Robot Modeling Resources

### MCP Servers

#### CAD-Query MCP Server
**Matches**: SK-004 (URDF/SDF Model), AG-001 (Robotics System Architect)

| Field | Value |
|-------|-------|
| Directory | [mcpservers.org/servers/rishigundakaram/cadquery-mcp-server](https://mcpservers.org/servers/rishigundakaram/cadquery-mcp-server) |
| Focus | Parametric 3D modeling |

**Description**: MCP server providing CAD generation and verification tools for Claude Code, enabling conversational 3D modeling.

**Features**:
- CAD-Query validation
- Python script generation from descriptions
- Full CAD-Query integration
- STL/STEP export for 3D printing

---

#### FreeCAD MCP Server
**Matches**: SK-004 (URDF/SDF Model), AG-001 (Robotics System Architect)

| Field | Value |
|-------|-------|
| Repository | [bonninr/freecad_mcp](https://github.com/bonninr/freecad_mcp) |
| Alternative | [lucygoodchild/freecad-mcp-server](https://github.com/lucygoodchild/freecad-mcp-server) |
| Directory | [playbooks.com/mcp/neka-nat-freecad](https://playbooks.com/mcp/neka-nat-freecad) |

**Description**: MCP server enabling AI assistants to interact with FreeCAD for 3D modeling and CAD operations.

**Features**:
- Basic geometry creation (boxes, cylinders, spheres)
- Boolean operations (union, cut, common)
- Document management
- Custom script execution
- Cross-platform (Windows, macOS, Linux)

---

#### SolidWorks MCP
**Matches**: SK-004 (URDF/SDF Model), AG-001 (Robotics System Architect)

| Field | Value |
|-------|-------|
| Repository | [Sam-Of-The-Arth/SolidWorks-MCP](https://github.com/Sam-Of-The-Arth/SolidWorks-MCP) |
| Platform | SolidWorks |

**Description**: Automated CAD using Anthropic's Claude and SolidWorks. Enables creating 3D CAD models through natural language commands.

**Features**:
- Automated part creation
- Sketch creation on different planes
- Drawing tools
- Extrusion capabilities

---

#### Blender MCP
**Matches**: SK-004 (URDF/SDF Model), SK-021 (RViz Visualization)

| Field | Value |
|-------|-------|
| Website | [blender-mcp.com](https://blender-mcp.com/) |
| Platform | Blender |

**Description**: Connects Claude AI to Blender for creating, modifying, and enhancing 3D models through text prompts.

**Features**:
- Built-in Blender plugin support
- Viewport screenshots
- Sketchfab integration
- 3D printing workflow support

---

#### OpenSCAD MCP Server
**Matches**: SK-004 (URDF/SDF Model)

| Field | Value |
|-------|-------|
| Directory | [playbooks.com/mcp/jhacksman-openscad](https://playbooks.com/mcp/jhacksman-openscad) |
| Guide | [skywork.ai](https://skywork.ai/skypage/en/ai-engineer-openscad-mcp-server/1980872653259997184) |

**Description**: Bridges AI image generation with 3D modeling, allowing creation of parametric OpenSCAD models from text descriptions or images.

**Features**:
- Multi-view reconstruction
- Local and remote CUDA processing
- Programmatic 3D modeling

---

## Safety and Industrial IoT Resources

### MCP Servers

#### IoT-Edge-MCP-Server
**Matches**: SK-018 (Safety Systems), AG-010 (Safety Engineer)

| Field | Value |
|-------|-------|
| Repository | [poly-mcp/IoT-Edge-MCP-Server](https://github.com/poly-mcp/IoT-Edge-MCP-Server) |
| Alternative | [llm-use/IoT-Edge-MCP-Server](https://github.com/llm-use/IoT-Edge-MCP-Server) |
| Focus | Industrial IoT, SCADA, PLC |

**Description**: MCP server for Industrial IoT, SCADA and PLC systems. Unifies MQTT sensors, Modbus devices, and industrial equipment into a single AI-orchestrable API.

**Features**:
- Real-time monitoring
- Alarms management
- Time-series storage
- Actuator control
- Natural language control
- Predictive maintenance
- Incident response

**Use Cases**:
- "Check all pressure sensors and alert if any are abnormal"
- Complex multi-step industrial automation
- Emergency procedures

---

#### Modbus MCP
**Matches**: SK-018 (Safety Systems)

| Field | Value |
|-------|-------|
| Repository | [kukapay/modbus-mcp](https://github.com/kukapay/modbus-mcp) |
| Protocol | Modbus |

**Description**: Standardizes and contextualizes Modbus data for seamless AI agent integration with industrial IoT systems.

---

#### MCP-Scan (Security)
**Matches**: SK-018 (Safety Systems), AG-010 (Safety Engineer)

| Field | Value |
|-------|-------|
| Repository | [invariantlabs-ai/mcp-scan](https://github.com/invariantlabs-ai/mcp-scan) |
| Focus | MCP security |

**Description**: Security scanning tool to statically and dynamically scan and monitor MCP connections for vulnerabilities.

**Features**:
- Prompt injection detection
- Tool poisoning detection
- Toxic flow detection
- Real-time proxy monitoring
- Tool call checking
- Data flow constraints
- PII detection

---

## Multi-Robot and Fleet Management Resources

### Open-RMF Free Fleet
**Matches**: SK-019 (Multi-Robot Coordination), AG-013 (Fleet Management Agent)

| Field | Value |
|-------|-------|
| Repository | [open-rmf/free_fleet](https://github.com/open-rmf/free_fleet) |
| Organization | [Open-RMF](https://www.open-rmf.org/) |
| Communication | zenoh, CycloneDDS |

**Description**: Open-source robot fleet management system ("Fun Free Fleet For Friends" - F5). Python implementation of the Open-RMF Fleet Adapter.

**Architecture**:
- **Client**: Runs on each robot alongside navigation software
- **Server**: Runs on central computer, consolidates status updates

**Features**:
- Heterogeneous fleet management
- Support for different ROS distributions
- Flexible network configuration via zenoh bridges
- Nav2 integration

**Related Resources**:
- [ROS2 Multi-Robot Book](https://osrf.github.io/ros2multirobotbook/)
- [Open-RMF Demos](https://github.com/open-rmf/rmf_demos)

---

### Stack-chan (M5Stack Robot)
**Matches**: SK-019 (Multi-Robot Coordination), AG-014 (HRI Interface Designer)

| Field | Value |
|-------|-------|
| Repository | [stack-chan/stack-chan](https://github.com/stack-chan/stack-chan) |
| Stars | 1,100+ |
| Platform | M5Stack |

**Description**: JavaScript-driven M5Stack-embedded robot with MCP server functionality for AI-controlled interactions.

---

## Computer Vision Resources

### MCP Servers

#### OpenCV MCP Server
**Matches**: SK-010 (Computer Vision), SK-011 (Object Detection/Segmentation), AG-002 (Perception Engineer)

| Field | Value |
|-------|-------|
| Repository | [GongRzhe/opencv-mcp-server](https://github.com/GongRzhe/opencv-mcp-server) |
| Directory | [lobehub.com/mcp/gongrzhe-opencv-mcp-server](https://lobehub.com/mcp/gongrzhe-opencv-mcp-server) |

**Description**: Provides OpenCV's image and video processing capabilities through MCP.

**Applications**:
- Autonomous systems (vision-based navigation, obstacle detection)
- Traffic analysis (vehicle counting, speed estimation, license plate recognition)
- Security systems (motion detection, facial recognition)
- Augmented reality (feature tracking, pose estimation)
- Medical imaging
- Industrial inspection

**Configuration**:
- MCP_TRANSPORT (default: "stdio")
- OPENCV_DNN_MODELS_DIR for DNN models
- CV_HAAR_CASCADE_DIR for Haar cascades

---

#### Video Capture MCP
**Matches**: SK-010 (Computer Vision), AG-002 (Perception Engineer)

| Field | Value |
|-------|-------|
| Repository | [13rac1/videocapture-mcp](https://github.com/13rac1/videocapture-mcp) |
| Directory | [mcpservers.org/servers/13rac1/videocapture-mcp](https://mcpservers.org/servers/13rac1/videocapture-mcp) |

**Description**: MCP server to capture images from OpenCV-compatible webcam or video source.

**Features**:
- Quick image capture
- Connection management
- Video properties control (brightness, contrast, resolution)
- Basic image transformations

---

#### Google Cloud Vision MCP
**Matches**: SK-010 (Computer Vision), SK-011 (Object Detection/Segmentation)

| Field | Value |
|-------|-------|
| Integration | [composio.dev/toolkits/google_cloud_vision](https://composio.dev/toolkits/google_cloud_vision/framework/claude-code) |
| Platform | Google Cloud |

**Description**: MCP server connecting AI agents to Google Cloud Vision for image analysis.

**Features**:
- Product registration
- Reference image management
- Endpoint listing
- Large-scale image operations

---

## General Robotics Resources

### Unified Autonomy Stack
**Matches**: SK-007 (SLAM Algorithms), SK-009 (Sensor Fusion), AG-001 (Robotics System Architect)

| Field | Value |
|-------|-------|
| Website | [ntnu-arl.github.io/unified_autonomy_stack](https://ntnu-arl.github.io/unified_autonomy_stack/) |
| Organization | Autonomous Robots Lab, NTNU |

**Description**: Autonomy architecture integrating perception, planning, and navigation algorithms, field tested across robot configurations.

**Features**:
- Multi-modal Perception (LiDAR, radar, vision, IMU fusion)
- Robust SLAM
- Simulation and testing tools

---

### EKF Sensor Fusion Packages
**Matches**: SK-009 (Sensor Fusion), AG-002 (Perception Engineer)

| Repository | Description |
|------------|-------------|
| [balamuruganky/EKF_IMU_GPS](https://github.com/balamuruganky/EKF_IMU_GPS) | Enhanced GPS accuracy using IMU with EKF |
| [Guo-ziwei/fusion](https://github.com/Guo-ziwei/fusion) | IMU + Odometry fusion with EKF, batch optimization, iSAM2 |
| [norsechurros/Ekf-Fusion](https://github.com/norsechurros/Ekf-Fusion) | ROS package for IMU, GPS, odometry fusion |
| [Janudis/Extended-Kalman-Filter-GPS_IMU](https://github.com/Janudis/Extended-Kalman-Filter-GPS_IMU) | EKF for autonomous driving localization |

---

### ROS Autonomous SLAM Projects
**Matches**: SK-007 (SLAM Algorithms), SK-006 (Nav2 Navigation), AG-008 (Navigation Engineer)

| Repository | Description |
|------------|-------------|
| [apresland/autonomous-mobile-robots](https://github.com/apresland/autonomous-mobile-robots) | ROS + Gazebo SLAM and path planning demo |
| [fazildgr8/ros_autonomous_slam](https://github.com/fazildgr8/ros_autonomous_slam) | Autonomous exploration with GMAPPING and RRT |
| [AAArpan/Autonomous-Navigation-and-Path-planning-on-ROS2](https://github.com/AAArpan/Autonomous-Navigation-and-Path-planning-on-ROS2-using-Dijkstra-and-SLAM) | ROS2 Humble, SLAM Toolbox, custom Dijkstra |
| [noshluk2/ROS-Navigation-Stack-and-SLAM](https://github.com/noshluk2/ROS-Navigation-Stack-and-SLAM-for-Autonomous-Custom-Robot) | Custom robot navigation stack |

---

## Awesome Lists and Directories

### MCP Server Collections

| Repository | Description | Stars |
|------------|-------------|-------|
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | Comprehensive MCP server collection | 35K+ |
| [TensorBlock/awesome-mcp-servers](https://github.com/TensorBlock/awesome-mcp-servers) | 7,260+ servers cataloged | - |
| [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) | Curated MCP servers list | - |
| [beriberikix/awesome-mcp-hardware](https://github.com/beriberikix/awesome-mcp-hardware) | Hardware-focused MCP servers | - |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | Official MCP reference servers | - |
| [tolkonepiu/best-of-mcp-servers](https://github.com/tolkonepiu/best-of-mcp-servers) | Ranked list, updated weekly | - |

### Robotics Collections

| Repository | Description |
|------------|-------------|
| [Ly0n/awesome-robotic-tooling](https://github.com/Ly0n/awesome-robotic-tooling) | Professional robotic development tools |
| [shannon112/awesome-ros-mobile-robot](https://github.com/shannon112/awesome-ros-mobile-robot) | ROS mobile robot resources |
| [tzutalin/awesome-visual-slam](https://github.com/tzutalin/awesome-visual-slam) | Visual SLAM resources |

### Online Directories

| Directory | URL | Description |
|-----------|-----|-------------|
| MCP Awesome | [mcp-awesome.com](https://mcp-awesome.com/) | 1200+ verified servers |
| MCP Servers | [mcpservers.org](https://mcpservers.org/) | Submission-based directory |
| Glama MCP | [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | Searchable MCP registry |
| PulseMCP | [pulsemcp.com](https://www.pulsemcp.com/) | MCP server listings |
| Claude Plugins | [claude-plugins.dev](https://claude-plugins.dev/) | Claude Code plugins registry |

---

## Summary Statistics

| Category | Resources Found |
|----------|-----------------|
| ROS/ROS2 MCP Servers | 6 |
| Simulation MCP Servers | 2 |
| Perception/Vision MCP Servers | 6 |
| CAD/Modeling MCP Servers | 5 |
| Hardware/Embedded MCP Servers | 7 |
| Industrial/Safety MCP Servers | 3 |
| Machine Learning Tools | 8 |
| SLAM Frameworks | 5 |
| Navigation Frameworks | 4 |
| Fleet Management | 2 |
| RL Robotics Frameworks | 5 |
| Awesome Lists | 9 |
| **Total Unique Resources** | **62** |

### Skill Coverage

| Skill ID | Skill Name | Resources Found |
|----------|------------|-----------------|
| SK-001 | ROS/ROS2 Integration | 6 |
| SK-002 | Gazebo Simulation | 1 |
| SK-003 | NVIDIA Isaac Sim | 2 |
| SK-004 | URDF/SDF Model | 5 |
| SK-005 | MoveIt Motion Planning | 2 |
| SK-006 | Nav2 Navigation | 5 |
| SK-007 | SLAM Algorithms | 8 |
| SK-008 | Point Cloud Processing | 2 |
| SK-009 | Sensor Fusion | 5 |
| SK-010 | Computer Vision | 6 |
| SK-011 | Object Detection/Segmentation | 4 |
| SK-012 | Kinematics/Dynamics | 1 |
| SK-013 | MPC Controller | 1 |
| SK-014 | Motion Planning | 3 |
| SK-015 | Reinforcement Learning | 7 |
| SK-016 | Sim-to-Real Transfer | 4 |
| SK-017 | Calibration Tools | 1 |
| SK-018 | Safety Systems | 3 |
| SK-019 | Multi-Robot Coordination | 2 |
| SK-020 | TF2 Transforms | 1 |
| SK-021 | RViz Visualization | 1 |
| SK-022 | ros2_control | 4 |
| SK-023 | Behavior Trees | 2 |
| SK-024 | Grasp Planning | 1 |
| SK-025 | Edge Deployment | 4 |

### Agent Coverage

| Agent ID | Agent Name | Resources Found |
|----------|------------|-----------------|
| AG-001 | Robotics System Architect | 4 |
| AG-002 | Perception Engineer | 8 |
| AG-003 | Motion Planning Expert | 4 |
| AG-004 | Control Systems Engineer | 3 |
| AG-005 | Simulation Engineer | 2 |
| AG-006 | SLAM Specialist | 5 |
| AG-007 | ML/RL Robotics Agent | 9 |
| AG-008 | Navigation Engineer | 6 |
| AG-009 | Robot Calibration Expert | 1 |
| AG-010 | Safety Engineer | 2 |
| AG-011 | Integration Test Engineer | 3 |
| AG-012 | Manipulation Specialist | 1 |
| AG-013 | Fleet Management Agent | 1 |
| AG-014 | HRI Interface Designer | 1 |
| AG-015 | ROS/ROS2 Expert | 4 |

---

## Notes and Recommendations

### High-Value Resources
The following resources provide the most comprehensive coverage and should be prioritized for integration:

1. **ros-mcp-server** - Core ROS/ROS2 integration, widely adopted
2. **OpenCV MCP Server** - Comprehensive computer vision capabilities
3. **IoT-Edge-MCP-Server** - Industrial safety and monitoring
4. **VisionCraft MCP Server** - AI-enhanced perception knowledge
5. **TensorRT Edge-LLM** - Edge deployment optimization

### Gaps Identified
The following skills/agents have limited community resources:

1. **SK-005 (MoveIt)** - No dedicated MCP server found
2. **SK-012 (Kinematics/Dynamics)** - Limited direct resources
3. **SK-017 (Calibration Tools)** - No MCP server found
4. **SK-024 (Grasp Planning)** - Limited MCP integration
5. **AG-009 (Calibration Expert)** - Limited resources
6. **AG-012 (Manipulation Specialist)** - Limited MCP resources

### Integration Recommendations

1. **ROS Integration**: Use ros-mcp-server as the primary bridge for all ROS-based processes
2. **Simulation**: Combine Gazebo MCP with Isaac Sim MCP for comprehensive simulation coverage
3. **Perception**: Layer VisionCraft, OpenCV MCP, and Groundlight for complete perception stack
4. **Safety**: Deploy IoT-Edge-MCP-Server with MCP-Scan for industrial applications
5. **Fleet Management**: Integrate with Open-RMF free_fleet for multi-robot scenarios

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Complete
**Backlog Reference**: skills-agents-backlog.md

---

## Sources

- [GitHub - robotmcp/ros-mcp-server](https://github.com/robotmcp/ros-mcp-server)
- [GitHub - GongRzhe/opencv-mcp-server](https://github.com/GongRzhe/opencv-mcp-server)
- [GitHub - open-rmf/free_fleet](https://github.com/open-rmf/free_fleet)
- [GitHub - punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- [GitHub - beriberikix/awesome-mcp-hardware](https://github.com/beriberikix/awesome-mcp-hardware)
- [GitHub - Ly0n/awesome-robotic-tooling](https://github.com/Ly0n/awesome-robotic-tooling)
- [GitHub - shannon112/awesome-ros-mobile-robot](https://github.com/shannon112/awesome-ros-mobile-robot)
- [GitHub - augmentedstartups/VisionCraft-MCP-Server](https://github.com/augmentedstartups/VisionCraft-MCP-Server)
- [GitHub - poly-mcp/IoT-Edge-MCP-Server](https://github.com/poly-mcp/IoT-Edge-MCP-Server)
- [MCP Awesome Directory](https://mcp-awesome.com/)
- [Glama MCP Servers](https://glama.ai/mcp/servers)
- [PulseMCP](https://www.pulsemcp.com/)
