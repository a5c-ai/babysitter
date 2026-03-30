# Robotics and Simulation Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Robotics and Simulation Engineering processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, ROS/ROS2 integration, physics simulation, motion planning, and specialized robotics tooling.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 20 implemented processes in this specialization currently use generic agent names for task execution (e.g., `robotics-engineer`, `test-engineer`, `ml-engineer`). While functional, this approach lacks domain-specific optimizations that specialized skills and agents with deep robotics knowledge could provide.

### Goals
- Provide deep expertise in ROS/ROS2 middleware and tooling
- Enable automated simulation environment creation and validation
- Reduce development time for motion planning and control algorithms
- Improve accuracy of SLAM, perception, and sensor fusion implementations
- Support hardware-in-the-loop testing and sim-to-real transfer
- Integrate specialized robotics frameworks (MoveIt, Nav2, Gazebo, Isaac Sim)

---

## Skills Backlog

### SK-001: ROS/ROS2 Integration Skill
**Slug**: `ros-integration`
**Category**: Middleware

**Description**: Deep integration with ROS/ROS2 middleware for node development, launch files, and package management.

**Capabilities**:
- Generate ROS/ROS2 package structures with proper CMakeLists.txt and package.xml
- Create launch files (Python launch for ROS2, XML for ROS1)
- Configure node parameters and YAML configuration files
- Set up publishers, subscribers, services, and actions
- Generate message, service, and action definitions
- Configure QoS policies for DDS communication
- Implement lifecycle node management (ROS2)
- Create ROS parameter bridges and topic remapping
- Debug topic/service connectivity issues
- Configure tf2 transform broadcasts

**Process Integration**:
- robot-system-design.js
- robot-calibration.js
- gazebo-simulation-setup.js
- nav2-navigation-setup.js
- multi-robot-coordination.js

**Dependencies**: ROS/ROS2 installation, colcon build tools, rosdep

---

### SK-002: Gazebo Simulation Skill
**Slug**: `gazebo-simulation`
**Category**: Simulation

**Description**: Expert skill for Gazebo Classic and Ignition/Gazebo Sim world creation and plugin development.

**Capabilities**:
- Create SDF world files with terrain, lighting, and physics
- Configure physics engine parameters (ODE, Bullet, DART)
- Implement Gazebo plugins (model, world, sensor, visual)
- Generate sensor models (camera, LiDAR, IMU, GPS, depth)
- Set up contact sensors and force-torque sensors
- Configure dynamic actors and animated models
- Implement custom physics materials and friction
- Create procedural world generation
- Optimize simulation performance (LOD, collision simplification)
- Set up multi-robot simulation instances

**Process Integration**:
- gazebo-simulation-setup.js
- digital-twin-development.js
- synthetic-data-pipeline.js
- simulation-performance-optimization.js
- hil-testing.js

**Dependencies**: Gazebo/Ignition, gazebo_ros_pkgs, SDF specification

---

### SK-003: NVIDIA Isaac Sim Skill
**Slug**: `isaac-sim`
**Category**: Simulation

**Description**: Specialized skill for NVIDIA Isaac Sim photorealistic simulation and synthetic data generation.

**Capabilities**:
- Import and convert URDF to USD format
- Create photorealistic environments with RTX ray tracing
- Configure PhysX physics simulation
- Implement Replicator synthetic data generation
- Apply domain randomization (lighting, textures, poses)
- Generate ground truth annotations (segmentation, depth, bounding boxes)
- Configure ROS/ROS2 bridge for Isaac Sim
- Set up multi-GPU distributed simulation
- Create Isaac Sim extensions and workflows
- Export datasets in standard formats (COCO, KITTI)

**Process Integration**:
- isaac-sim-photorealistic.js
- synthetic-data-pipeline.js
- digital-twin-development.js
- rl-robot-control.js

**Dependencies**: NVIDIA Isaac Sim, Omniverse, NVIDIA GPU with RTX

---

### SK-004: URDF/SDF Model Skill
**Slug**: `urdf-sdf-model`
**Category**: Robot Modeling

**Description**: Expert skill for robot model creation and validation in URDF and SDF formats.

**Capabilities**:
- Generate URDF files with proper link-joint hierarchy
- Create Xacro macros for modular robot descriptions
- Convert between URDF and SDF formats
- Calculate and set inertial properties (mass, inertia tensors)
- Import and optimize mesh files (visual and collision)
- Configure joint types (revolute, prismatic, continuous, fixed, floating)
- Set up transmission and actuator definitions
- Add sensor plugins and attachments
- Validate models with urdfdom and check_urdf
- Visualize and debug in RViz

**Process Integration**:
- robot-urdf-sdf-model.js
- robot-system-design.js
- moveit-manipulation-planning.js
- gazebo-simulation-setup.js

**Dependencies**: urdfdom, xacro, mesh processing tools (MeshLab, Blender)

---

### SK-005: MoveIt Motion Planning Skill
**Slug**: `moveit-planning`
**Category**: Motion Planning

**Description**: Deep expertise in MoveIt/MoveIt2 configuration and manipulation planning.

**Capabilities**:
- Generate MoveIt configuration packages with Setup Assistant
- Configure kinematics solvers (KDL, IKFast, TracIK, BioIK)
- Set up SRDF files with planning groups and end effectors
- Configure OMPL planners (RRT, RRT*, PRM, BiTRRT)
- Implement grasp planning and pick-place pipelines
- Configure collision checking (FCL, Bullet)
- Set up planning scene and octomap integration
- Implement motion planning adapters and post-processing
- Configure trajectory execution and monitoring
- Debug IK failures and planning issues

**Process Integration**:
- moveit-manipulation-planning.js
- trajectory-optimization.js
- robot-system-design.js

**Dependencies**: MoveIt/MoveIt2, OMPL, IK solvers

---

### SK-006: Nav2 Navigation Skill
**Slug**: `nav2-navigation`
**Category**: Navigation

**Description**: Specialized skill for ROS2 Nav2 navigation stack configuration and behavior trees.

**Capabilities**:
- Configure Nav2 navigation stack with all plugins
- Create behavior trees for navigation logic
- Set up costmap layers (static, obstacle, inflation, voxel)
- Configure planners (NavFn, Smac, ThetaStar)
- Set up controllers (DWB, Regulated Pure Pursuit, MPPI)
- Implement recovery behaviors (spin, backup, wait)
- Configure waypoint following and route planning
- Set up navigation server lifecycle management
- Implement custom BT nodes and plugins
- Debug navigation failures and path planning issues

**Process Integration**:
- nav2-navigation-setup.js
- path-planning-algorithm.js
- dynamic-obstacle-avoidance.js
- autonomous-exploration.js

**Dependencies**: Nav2, BehaviorTree.CPP, navigation2 plugins

---

### SK-007: SLAM Algorithm Skill
**Slug**: `slam-algorithms`
**Category**: Perception

**Description**: Expert skill for SLAM algorithm selection, configuration, and tuning.

**Capabilities**:
- Configure ORB-SLAM3 for monocular, stereo, and RGB-D
- Set up RTAB-Map for visual and LiDAR SLAM
- Configure Google Cartographer for 2D and 3D SLAM
- Implement LIO-SAM and LeGO-LOAM for LiDAR-inertial SLAM
- Tune feature detection and matching parameters
- Configure loop closure detection and optimization
- Set up IMU preintegration and visual-inertial fusion
- Optimize for real-time performance
- Evaluate SLAM accuracy (ATE, RPE metrics)
- Configure map saving and loading

**Process Integration**:
- visual-slam-implementation.js
- lidar-mapping-localization.js
- autonomous-exploration.js
- sensor-fusion-framework.js

**Dependencies**: ORB-SLAM3, RTAB-Map, Cartographer, LIO-SAM, g2o, GTSAM

---

### SK-008: Point Cloud Processing Skill
**Slug**: `point-cloud-processing`
**Category**: Perception

**Description**: Specialized skill for 3D point cloud processing and analysis using PCL and Open3D.

**Capabilities**:
- Implement point cloud filtering (voxel grid, statistical outlier, passthrough)
- Configure ground plane segmentation (RANSAC, SAC)
- Implement clustering algorithms (Euclidean, DBSCAN)
- Set up surface reconstruction (Poisson, ball pivoting)
- Configure feature extraction (FPFH, SHOT, PFH)
- Implement registration algorithms (ICP, NDT, GICP)
- Set up octree and KD-tree spatial indexing
- Process organized and unorganized point clouds
- Implement point cloud downsampling strategies
- Configure LiDAR-camera fusion

**Process Integration**:
- lidar-mapping-localization.js
- object-detection-pipeline.js
- sensor-fusion-framework.js
- synthetic-data-pipeline.js

**Dependencies**: PCL, Open3D, pcl_ros, laser_geometry

---

### SK-009: Sensor Fusion Skill
**Slug**: `sensor-fusion`
**Category**: State Estimation

**Description**: Expert skill for multi-sensor fusion and state estimation using Kalman filtering.

**Capabilities**:
- Implement Extended Kalman Filter (EKF) for state estimation
- Configure Unscented Kalman Filter (UKF) for nonlinear systems
- Set up robot_localization package configuration
- Implement IMU preintegration and bias estimation
- Configure GPS/RTK integration with local coordinate frames
- Implement wheel odometry fusion with slip compensation
- Set up visual odometry integration
- Configure outlier rejection (Mahalanobis, chi-squared)
- Tune process and measurement noise covariances
- Implement sensor delay compensation

**Process Integration**:
- sensor-fusion-framework.js
- visual-slam-implementation.js
- lidar-mapping-localization.js
- robot-calibration.js

**Dependencies**: robot_localization, imu_complementary_filter, GTSAM

---

### SK-010: Computer Vision Skill
**Slug**: `computer-vision`
**Category**: Perception

**Description**: Specialized skill for robot vision including feature detection, tracking, and camera calibration.

**Capabilities**:
- Implement camera intrinsic calibration (pinhole, fisheye)
- Configure stereo camera calibration and rectification
- Set up camera-LiDAR extrinsic calibration
- Implement feature detection (ORB, SIFT, SURF, SuperPoint)
- Configure optical flow tracking (Lucas-Kanade, Farneback)
- Implement depth estimation from stereo
- Set up visual servoing pipelines
- Configure image undistortion and rectification
- Implement ArUco/AprilTag marker detection
- Set up hand-eye calibration

**Process Integration**:
- robot-calibration.js
- visual-slam-implementation.js
- object-detection-pipeline.js
- digital-twin-development.js

**Dependencies**: OpenCV, cv_bridge, image_geometry, camera_calibration

---

### SK-011: Object Detection/Segmentation Skill
**Slug**: `object-detection`
**Category**: Perception

**Description**: Deep learning based object detection and segmentation for robotics applications.

**Capabilities**:
- Configure YOLO (v5, v8) for real-time detection
- Set up Detectron2 for instance segmentation
- Implement semantic segmentation models
- Configure TensorRT optimization for Jetson
- Set up ONNX runtime deployment
- Implement 3D object detection (PointPillars, VoxelNet)
- Configure depth-based object detection
- Set up ROS vision pipelines with image_pipeline
- Implement object tracking (SORT, DeepSORT, ByteTrack)
- Configure multi-camera detection fusion

**Process Integration**:
- object-detection-pipeline.js
- synthetic-data-pipeline.js
- nn-model-optimization.js
- moveit-manipulation-planning.js

**Dependencies**: YOLO, Detectron2, TensorRT, ONNX Runtime, vision_msgs

---

### SK-012: Kinematics/Dynamics Skill
**Slug**: `kinematics-dynamics`
**Category**: Control

**Description**: Robot kinematics and dynamics computation including forward/inverse kinematics and dynamics.

**Capabilities**:
- Implement forward kinematics from DH parameters
- Set up analytical and numerical inverse kinematics
- Compute Jacobian matrices for velocity kinematics
- Implement forward and inverse dynamics
- Configure mass matrix and Coriolis computation
- Set up gravity compensation
- Implement singularity detection and avoidance
- Configure workspace analysis and limits
- Set up force/torque sensor integration
- Implement impedance and admittance control

**Process Integration**:
- robot-system-design.js
- moveit-manipulation-planning.js
- mpc-controller-design.js
- robot-calibration.js

**Dependencies**: KDL, Pinocchio, RBDL, eigen

---

### SK-013: MPC Controller Skill
**Slug**: `mpc-controller`
**Category**: Control

**Description**: Expert skill for Model Predictive Control implementation and tuning.

**Capabilities**:
- Derive kinematic and dynamic robot models
- Formulate MPC optimization problems (QP, NLP)
- Configure CasADi for symbolic differentiation
- Set up ACADO code generation for real-time MPC
- Implement constraint handling (velocity, acceleration, collision)
- Configure cost function weights (tracking, control effort)
- Implement warm starting for fast convergence
- Set up NMPC for nonlinear systems
- Configure terminal constraints and costs
- Optimize solver parameters for real-time execution

**Process Integration**:
- mpc-controller-design.js
- trajectory-optimization.js
- dynamic-obstacle-avoidance.js
- path-planning-algorithm.js

**Dependencies**: CasADi, ACADO, OSQP, qpOASES, Ipopt

---

### SK-014: Motion Planning Skill
**Slug**: `motion-planning`
**Category**: Planning

**Description**: Sampling-based and optimization-based motion planning algorithms.

**Capabilities**:
- Configure OMPL planners (RRT, RRT*, RRT-Connect, PRM, FMT*)
- Implement hybrid A* for car-like robots
- Set up lattice-based planners
- Configure trajectory optimization (TrajOpt, CHOMP, STOMP)
- Implement time-optimal trajectory planning
- Set up path smoothing algorithms
- Configure state space and validity checking
- Implement kinodynamic planning
- Set up multi-query planning with roadmaps
- Configure asymptotically optimal planners

**Process Integration**:
- path-planning-algorithm.js
- trajectory-optimization.js
- moveit-manipulation-planning.js
- nav2-navigation-setup.js

**Dependencies**: OMPL, MoveIt, TrajOpt, FCL

---

### SK-015: Reinforcement Learning Skill
**Slug**: `rl-robotics`
**Category**: Learning

**Description**: RL training for robot control using simulation with sim-to-real transfer.

**Capabilities**:
- Configure Gym/Gymnasium environments for robots
- Set up Stable Baselines3 training (PPO, SAC, TD3)
- Implement custom observation and action spaces
- Design reward shaping strategies
- Configure parallel environment training
- Implement domain randomization for sim-to-real
- Set up curriculum learning
- Configure vision-based RL with CNNs
- Implement policy distillation
- Export policies for deployment (ONNX, TorchScript)

**Process Integration**:
- rl-robot-control.js
- imitation-learning.js
- sim-to-real-validation.js
- nn-model-optimization.js

**Dependencies**: Stable Baselines3, Gymnasium, Isaac Gym, rsl_rl

---

### SK-016: Sim-to-Real Transfer Skill
**Slug**: `sim-to-real`
**Category**: Validation

**Description**: Techniques for minimizing simulation-to-reality gap and validating transfer.

**Capabilities**:
- Implement domain randomization (physics, appearance, dynamics)
- Configure system identification for simulation parameters
- Set up adaptive domain randomization
- Implement domain adaptation techniques
- Configure noise injection for robust policies
- Set up reality gap metrics and monitoring
- Implement progressive network transfer
- Configure latency simulation
- Set up sensor noise modeling
- Implement hardware-in-the-loop validation

**Process Integration**:
- sim-to-real-validation.js
- digital-twin-development.js
- rl-robot-control.js
- field-testing-validation.js

**Dependencies**: Simulation environments, physical robot access

---

### SK-017: Calibration Tools Skill
**Slug**: `calibration-tools`
**Category**: Calibration

**Description**: Sensor and robot calibration using specialized robotics calibration tools.

**Capabilities**:
- Configure Kalibr for camera-IMU calibration
- Set up camera_calibration for intrinsic calibration
- Implement robot_calibration for kinematic calibration
- Configure hand-eye calibration (eye-in-hand, eye-to-hand)
- Set up LiDAR-camera extrinsic calibration
- Implement IMU bias estimation
- Configure wheel odometry calibration
- Set up multi-camera calibration
- Implement joint encoder calibration
- Generate calibration reports and validation

**Process Integration**:
- robot-calibration.js
- sensor-fusion-framework.js
- visual-slam-implementation.js
- lidar-mapping-localization.js

**Dependencies**: Kalibr, camera_calibration, robot_calibration, easy_handeye

---

### SK-018: Safety System Skill
**Slug**: `safety-systems`
**Category**: Safety

**Description**: Robot safety system design and validation for industrial and collaborative robots.

**Capabilities**:
- Implement safety-rated monitored stop
- Configure speed and separation monitoring
- Set up safety-rated soft axis/space limiting
- Implement emergency stop integration
- Configure safety PLC communication
- Set up collision detection and response
- Implement force/torque limiting
- Configure safety zones and virtual fencing
- Set up ISO 13849 PL calculations
- Generate safety documentation

**Process Integration**:
- safety-system-validation.js
- robot-system-design.js
- field-testing-validation.js
- hri-interface.js

**Dependencies**: Safety PLCs, force/torque sensors, safety scanners

---

### SK-019: Multi-Robot Coordination Skill
**Slug**: `multi-robot-coordination`
**Category**: Fleet Management

**Description**: Coordination and task allocation for multi-robot systems and fleets.

**Capabilities**:
- Implement auction-based task allocation
- Configure market-based coordination
- Set up conflict-based search (CBS) for path planning
- Implement ORCA/RVO collision avoidance
- Configure formation control algorithms
- Set up distributed consensus protocols
- Implement priority-based planning
- Configure multi-master ROS communication
- Set up fleet management APIs
- Implement traffic management zones

**Process Integration**:
- multi-robot-coordination.js
- fleet-management-system.js
- path-planning-algorithm.js
- dynamic-obstacle-avoidance.js

**Dependencies**: multimaster_fkie, free_fleet, Open-RMF

---

### SK-020: TF2 Transforms Skill
**Slug**: `tf2-transforms`
**Category**: Middleware

**Description**: Expert skill for ROS tf2 coordinate frame management and transforms.

**Capabilities**:
- Configure static transforms for robot links
- Implement dynamic transform broadcasters
- Set up tf2 listeners with time synchronization
- Debug transform chains and connectivity
- Configure transform lookup caching
- Implement transform extrapolation
- Set up multi-robot namespaced transforms
- Configure map-odom-base_link chain
- Implement sensor frame transforms
- Debug TF_REPEATED_DATA and other issues

**Process Integration**:
- robot-system-design.js
- robot-calibration.js
- sensor-fusion-framework.js
- visual-slam-implementation.js

**Dependencies**: tf2_ros, tf2_geometry_msgs, tf_transformations

---

### SK-021: RViz Visualization Skill
**Slug**: `rviz-visualization`
**Category**: Visualization

**Description**: RViz configuration and custom visualization for robot development and debugging.

**Capabilities**:
- Create RViz configuration files for robot visualization
- Configure visualization plugins (robot model, TF, point cloud)
- Implement custom RViz panels and displays
- Set up marker publishers for debugging
- Configure interactive markers for teleoperation
- Create visualization dashboards
- Set up camera views and fixed frames
- Implement trajectory visualization
- Configure planning scene visualization
- Set up sensor data overlays

**Process Integration**:
- robot-urdf-sdf-model.js
- moveit-manipulation-planning.js
- visual-slam-implementation.js
- path-planning-algorithm.js

**Dependencies**: RViz2, rviz_visual_tools, interactive_markers

---

### SK-022: ros2_control Skill
**Slug**: `ros2-control`
**Category**: Control

**Description**: Hardware abstraction and controller management using ros2_control framework.

**Capabilities**:
- Configure hardware interfaces (GPIO, system, actuator, sensor)
- Set up controller manager and controller lifecycle
- Implement position, velocity, and effort controllers
- Configure joint trajectory controller
- Set up diff_drive and ackermann controllers
- Implement custom hardware interfaces
- Configure transmission interfaces
- Set up joint limits and saturation
- Implement combined robot controllers
- Debug controller loading and activation

**Process Integration**:
- robot-system-design.js
- mpc-controller-design.js
- moveit-manipulation-planning.js
- robot-bring-up.js

**Dependencies**: ros2_control, ros2_controllers, hardware_interface

---

### SK-023: Behavior Trees Skill
**Slug**: `behavior-trees`
**Category**: Decision Making

**Description**: Behavior tree design and implementation for robot decision making.

**Capabilities**:
- Design behavior trees for complex robot behaviors
- Configure BehaviorTree.CPP nodes and trees
- Implement custom action, condition, and decorator nodes
- Set up blackboard for state sharing
- Configure subtrees and tree switching
- Implement reactive behaviors and fallbacks
- Debug behavior tree execution with Groot
- Set up behavior tree logging and analysis
- Configure timeout and recovery behaviors
- Implement parallel and sequence nodes

**Process Integration**:
- nav2-navigation-setup.js
- autonomous-exploration.js
- multi-robot-coordination.js
- hri-interface.js

**Dependencies**: BehaviorTree.CPP, Groot, nav2_behavior_tree

---

### SK-024: Grasp Planning Skill
**Slug**: `grasp-planning`
**Category**: Manipulation

**Description**: Grasp planning and execution for robotic manipulation tasks.

**Capabilities**:
- Configure grasp pose generation (GPD, GraspIt!)
- Implement antipodal grasp detection
- Set up grasp quality metrics
- Configure approach and retreat vectors
- Implement pre-grasp and post-grasp poses
- Set up gripper control and monitoring
- Configure grasp database and learning
- Implement 6-DOF grasp pose estimation
- Set up object affordance detection
- Configure collision-aware grasp selection

**Process Integration**:
- moveit-manipulation-planning.js
- object-detection-pipeline.js
- rl-robot-control.js
- hri-interface.js

**Dependencies**: MoveIt grasps, GPD, GraspIt!, moveit_simple_grasps

---

### SK-025: Edge Deployment Skill
**Slug**: `edge-deployment`
**Category**: Deployment

**Description**: ML model optimization and deployment on robot edge devices (Jetson, embedded).

**Capabilities**:
- Configure TensorRT optimization for NVIDIA Jetson
- Set up ONNX model conversion and optimization
- Implement INT8 and FP16 quantization
- Configure DeepStream for video analytics
- Set up CUDA graph optimization
- Implement model pruning and distillation
- Configure DLA (Deep Learning Accelerator) deployment
- Set up multi-stream inference
- Implement ROS2 inference nodes
- Profile and benchmark on target hardware

**Process Integration**:
- nn-model-optimization.js
- object-detection-pipeline.js
- rl-robot-control.js
- field-testing-validation.js

**Dependencies**: TensorRT, ONNX Runtime, NVIDIA Jetson SDK, DeepStream

---

---

## Agents Backlog

### AG-001: Robotics System Architect Agent
**Slug**: `robotics-architect`
**Category**: Architecture

**Description**: Senior architect for robotic system design from requirements to deployment.

**Expertise Areas**:
- Robot system requirements analysis
- Hardware/software architecture design
- Sensor and actuator selection
- ROS/ROS2 system architecture
- Real-time performance requirements
- Safety architecture (ISO 10218, ISO 13482)
- Multi-robot system architecture
- Sim-to-real transfer strategies

**Persona**:
- Role: Principal Robotics Architect
- Experience: 12+ years robotics systems
- Background: Industrial automation, mobile robots, manipulation systems

**Process Integration**:
- robot-system-design.js (all phases)
- digital-twin-development.js (architecture phases)
- multi-robot-coordination.js (system design)
- safety-system-validation.js (architecture)

---

### AG-002: Perception Engineer Agent
**Slug**: `perception-engineer`
**Category**: Perception

**Description**: Expert in robot perception including SLAM, object detection, and sensor fusion.

**Expertise Areas**:
- Visual and LiDAR SLAM algorithms
- Multi-sensor fusion (EKF, UKF, factor graphs)
- 3D object detection and segmentation
- Point cloud processing and analysis
- Camera calibration and stereo vision
- Deep learning for perception
- Real-time perception optimization
- Sensor selection and placement

**Persona**:
- Role: Senior Perception Engineer
- Experience: 10+ years computer vision/robotics
- Background: Autonomous vehicles, warehouse robots, drones

**Process Integration**:
- visual-slam-implementation.js (all phases)
- lidar-mapping-localization.js (all phases)
- object-detection-pipeline.js (all phases)
- sensor-fusion-framework.js (all phases)

---

### AG-003: Motion Planning Expert Agent
**Slug**: `motion-planning-expert`
**Category**: Planning

**Description**: Specialist in motion planning algorithms for mobile robots and manipulators.

**Expertise Areas**:
- Sampling-based planning (RRT, PRM, FMT*)
- Optimization-based planning (TrajOpt, CHOMP)
- Kinodynamic planning
- Manipulation planning with MoveIt
- Navigation with Nav2
- Dynamic obstacle avoidance
- Multi-robot path planning
- Trajectory optimization

**Persona**:
- Role: Motion Planning Lead
- Experience: 8+ years motion planning
- Background: Manipulation systems, mobile robots, autonomous navigation

**Process Integration**:
- path-planning-algorithm.js (all phases)
- moveit-manipulation-planning.js (all phases)
- trajectory-optimization.js (all phases)
- nav2-navigation-setup.js (planning phases)

---

### AG-004: Control Systems Engineer Agent
**Slug**: `control-systems-engineer`
**Category**: Control

**Description**: Expert in robot control including classical and modern control methods.

**Expertise Areas**:
- PID tuning and implementation
- Model Predictive Control (MPC)
- Linear Quadratic Regulator (LQR)
- Impedance and admittance control
- Force/torque control
- Trajectory tracking control
- ros2_control framework
- Real-time control systems

**Persona**:
- Role: Senior Control Systems Engineer
- Experience: 9+ years control systems
- Background: Industrial robots, mobile platforms, drones

**Process Integration**:
- mpc-controller-design.js (all phases)
- trajectory-optimization.js (control phases)
- robot-system-design.js (control architecture)
- moveit-manipulation-planning.js (trajectory control)

---

### AG-005: Simulation Engineer Agent
**Slug**: `simulation-engineer`
**Category**: Simulation

**Description**: Specialist in robotics simulation including Gazebo, Isaac Sim, and digital twins.

**Expertise Areas**:
- Gazebo Classic and Ignition/Gazebo Sim
- NVIDIA Isaac Sim and Omniverse
- Physics simulation (ODE, Bullet, PhysX)
- Sensor simulation (camera, LiDAR, IMU)
- Synthetic data generation
- Domain randomization
- Digital twin development
- Sim-to-real transfer

**Persona**:
- Role: Simulation Engineer
- Experience: 7+ years robotics simulation
- Background: Game engines, physics simulation, synthetic data

**Process Integration**:
- gazebo-simulation-setup.js (all phases)
- isaac-sim-photorealistic.js (all phases)
- digital-twin-development.js (all phases)
- synthetic-data-pipeline.js (all phases)
- simulation-performance-optimization.js (all phases)

---

### AG-006: SLAM Specialist Agent
**Slug**: `slam-specialist`
**Category**: Localization

**Description**: Expert in simultaneous localization and mapping algorithms and systems.

**Expertise Areas**:
- Visual SLAM (ORB-SLAM3, RTAB-Map)
- LiDAR SLAM (Cartographer, LIO-SAM, LeGO-LOAM)
- Visual-inertial odometry (VIO)
- Loop closure detection and optimization
- Multi-session mapping
- Map management and localization
- SLAM accuracy evaluation
- Real-time SLAM optimization

**Persona**:
- Role: SLAM Research Engineer
- Experience: 8+ years SLAM development
- Background: Autonomous vehicles, indoor robots, AR/VR

**Process Integration**:
- visual-slam-implementation.js (all phases)
- lidar-mapping-localization.js (all phases)
- autonomous-exploration.js (mapping phases)
- robot-calibration.js (SLAM validation)

---

### AG-007: ML/RL Robotics Agent
**Slug**: `ml-rl-robotics`
**Category**: Learning

**Description**: Machine learning and reinforcement learning expert for robot learning applications.

**Expertise Areas**:
- Reinforcement learning (PPO, SAC, TD3)
- Imitation learning and behavior cloning
- Sim-to-real transfer techniques
- Neural network architecture for robotics
- Model optimization for edge deployment
- Vision-based robot learning
- Multi-task learning
- Curriculum learning

**Persona**:
- Role: Robot Learning Researcher
- Experience: 7+ years ML/RL for robotics
- Background: Deep RL, computer vision, manipulation learning

**Process Integration**:
- rl-robot-control.js (all phases)
- imitation-learning.js (all phases)
- nn-model-optimization.js (all phases)
- sim-to-real-validation.js (all phases)

---

### AG-008: Navigation Engineer Agent
**Slug**: `navigation-engineer`
**Category**: Navigation

**Description**: Expert in autonomous mobile robot navigation and exploration.

**Expertise Areas**:
- ROS2 Nav2 stack configuration
- Behavior tree design for navigation
- Costmap configuration and layers
- Path planning algorithms
- Dynamic obstacle avoidance
- Autonomous exploration
- Multi-floor navigation
- Fleet navigation coordination

**Persona**:
- Role: Navigation Systems Engineer
- Experience: 8+ years mobile robot navigation
- Background: Warehouse robots, delivery robots, service robots

**Process Integration**:
- nav2-navigation-setup.js (all phases)
- dynamic-obstacle-avoidance.js (all phases)
- autonomous-exploration.js (all phases)
- path-planning-algorithm.js (navigation aspects)

---

### AG-009: Robot Calibration Expert Agent
**Slug**: `calibration-expert`
**Category**: Calibration

**Description**: Specialist in sensor and robot calibration procedures and validation.

**Expertise Areas**:
- Camera intrinsic/extrinsic calibration
- LiDAR-camera calibration
- IMU calibration and bias estimation
- Kinematic parameter calibration
- Hand-eye calibration
- Multi-sensor calibration
- Calibration validation methods
- Automated calibration workflows

**Persona**:
- Role: Senior Calibration Engineer
- Experience: 7+ years sensor calibration
- Background: Precision robotics, autonomous vehicles, industrial vision

**Process Integration**:
- robot-calibration.js (all phases)
- sensor-fusion-framework.js (calibration phases)
- visual-slam-implementation.js (calibration)
- digital-twin-development.js (calibration validation)

---

### AG-010: Safety Engineer Agent
**Slug**: `safety-engineer`
**Category**: Safety

**Description**: Functional safety expert for robot safety system design and certification.

**Expertise Areas**:
- ISO 10218 industrial robot safety
- ISO 13482 personal care robot safety
- ISO/TS 15066 collaborative robots
- Hazard analysis (HAZOP, FMEA)
- Safety function design (PL calculation)
- Emergency stop systems
- Safety-rated monitoring
- Certification preparation

**Persona**:
- Role: Robot Safety Engineer
- Experience: 10+ years functional safety
- Background: Industrial automation, collaborative robots, medical devices

**Process Integration**:
- safety-system-validation.js (all phases)
- robot-system-design.js (safety requirements)
- field-testing-validation.js (safety validation)
- hri-interface.js (safety aspects)

---

### AG-011: Integration Test Engineer Agent
**Slug**: `integration-test-engineer`
**Category**: Testing

**Description**: Expert in robot system integration testing and validation.

**Expertise Areas**:
- Hardware-in-the-loop (HIL) testing
- System integration testing
- Simulation-based testing
- Field testing procedures
- Performance benchmarking
- Regression testing
- Test automation
- Failure analysis

**Persona**:
- Role: Robot Test Engineer
- Experience: 8+ years robotics testing
- Background: Automotive testing, drone testing, industrial robots

**Process Integration**:
- hil-testing.js (all phases)
- robot-bring-up.js (all phases)
- field-testing-validation.js (all phases)
- sim-to-real-validation.js (validation phases)

---

### AG-012: Manipulation Specialist Agent
**Slug**: `manipulation-specialist`
**Category**: Manipulation

**Description**: Expert in robotic manipulation including grasping, motion planning, and force control.

**Expertise Areas**:
- MoveIt configuration and optimization
- Grasp planning and execution
- Pick and place pipelines
- Force/torque control
- Dual-arm manipulation
- Dexterous manipulation
- Contact-rich manipulation
- Assembly tasks

**Persona**:
- Role: Manipulation Research Engineer
- Experience: 8+ years robotic manipulation
- Background: Industrial assembly, bin picking, logistics

**Process Integration**:
- moveit-manipulation-planning.js (all phases)
- trajectory-optimization.js (manipulation aspects)
- rl-robot-control.js (manipulation tasks)
- object-detection-pipeline.js (perception for manipulation)

---

### AG-013: Fleet Management Agent
**Slug**: `fleet-management-agent`
**Category**: Fleet Management

**Description**: Expert in multi-robot systems and fleet management infrastructure.

**Expertise Areas**:
- Task allocation algorithms
- Multi-robot path planning
- Fleet scheduling optimization
- Robot-to-robot communication
- Centralized/decentralized coordination
- Traffic management
- Fleet monitoring and analytics
- Scalability engineering

**Persona**:
- Role: Fleet Management Architect
- Experience: 7+ years multi-robot systems
- Background: Warehouse automation, delivery fleets, mining robots

**Process Integration**:
- multi-robot-coordination.js (all phases)
- fleet-management-system.js (all phases)
- nav2-navigation-setup.js (multi-robot aspects)
- path-planning-algorithm.js (multi-agent planning)

---

### AG-014: HRI Interface Designer Agent
**Slug**: `hri-designer`
**Category**: Human-Robot Interaction

**Description**: Expert in human-robot interaction interface design and implementation.

**Expertise Areas**:
- Teleoperation interfaces
- Voice command integration
- Gesture recognition
- GUI/dashboard design
- AR/VR interfaces
- Social navigation
- Intent recognition
- User study design

**Persona**:
- Role: HRI Research Engineer
- Experience: 6+ years human-robot interaction
- Background: Service robots, collaborative robots, assistive robots

**Process Integration**:
- hri-interface.js (all phases)
- multi-robot-coordination.js (human interaction)
- safety-system-validation.js (collaborative safety)
- field-testing-validation.js (user validation)

---

### AG-015: ROS/ROS2 Expert Agent
**Slug**: `ros-expert`
**Category**: Middleware

**Description**: Expert in ROS/ROS2 middleware, tooling, and best practices.

**Expertise Areas**:
- ROS2 node architecture and lifecycle
- DDS configuration and QoS
- Package development and CMake
- Launch files and composition
- Message/service/action design
- tf2 transform management
- Parameter management
- Debugging and profiling

**Persona**:
- Role: Senior ROS Engineer
- Experience: 10+ years ROS development
- Background: Open source robotics, industrial systems, research

**Process Integration**:
- robot-system-design.js (ROS architecture)
- nav2-navigation-setup.js (ROS integration)
- moveit-manipulation-planning.js (ROS integration)
- multi-robot-coordination.js (ROS communication)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| robot-system-design.js | SK-001, SK-004, SK-012, SK-020 | AG-001, AG-015 |
| robot-urdf-sdf-model.js | SK-004, SK-021 | AG-001, AG-005 |
| robot-calibration.js | SK-010, SK-017, SK-009 | AG-009, AG-002 |
| gazebo-simulation-setup.js | SK-002, SK-004 | AG-005 |
| isaac-sim-photorealistic.js | SK-003 | AG-005, AG-007 |
| digital-twin-development.js | SK-002, SK-003, SK-016 | AG-005, AG-001 |
| synthetic-data-pipeline.js | SK-003, SK-008, SK-011 | AG-005, AG-007 |
| simulation-performance-optimization.js | SK-002, SK-003 | AG-005 |
| visual-slam-implementation.js | SK-007, SK-010, SK-009 | AG-006, AG-002 |
| lidar-mapping-localization.js | SK-007, SK-008, SK-009 | AG-006, AG-002 |
| object-detection-pipeline.js | SK-011, SK-025, SK-008 | AG-002, AG-007 |
| sensor-fusion-framework.js | SK-009, SK-017, SK-020 | AG-002, AG-009 |
| path-planning-algorithm.js | SK-014, SK-006, SK-013 | AG-003, AG-008 |
| mpc-controller-design.js | SK-013, SK-012, SK-022 | AG-004 |
| moveit-manipulation-planning.js | SK-005, SK-012, SK-024 | AG-012, AG-003 |
| trajectory-optimization.js | SK-014, SK-013, SK-005 | AG-003, AG-004 |
| nav2-navigation-setup.js | SK-006, SK-023, SK-007 | AG-008, AG-003 |
| dynamic-obstacle-avoidance.js | SK-006, SK-014, SK-013 | AG-008, AG-003 |
| autonomous-exploration.js | SK-006, SK-007, SK-023 | AG-008, AG-006 |
| rl-robot-control.js | SK-015, SK-016, SK-025 | AG-007 |
| imitation-learning.js | SK-015, SK-025 | AG-007 |
| nn-model-optimization.js | SK-025, SK-011 | AG-007, AG-002 |
| hil-testing.js | SK-002, SK-001, SK-022 | AG-011, AG-005 |
| robot-bring-up.js | SK-001, SK-020, SK-022 | AG-011, AG-015 |
| field-testing-validation.js | SK-018, SK-016 | AG-011, AG-010 |
| multi-robot-coordination.js | SK-019, SK-006, SK-001 | AG-013, AG-008 |
| fleet-management-system.js | SK-019, SK-001 | AG-013 |
| hri-interface.js | SK-023, SK-001, SK-018 | AG-014, AG-010 |
| safety-system-validation.js | SK-018 | AG-010, AG-001 |
| sim-to-real-validation.js | SK-016, SK-015, SK-003 | AG-007, AG-011 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-010 | Computer Vision | Computer Vision, Autonomous Vehicles, AR/VR |
| SK-011 | Object Detection/Segmentation | Computer Vision, Autonomous Vehicles, IoT |
| SK-015 | Reinforcement Learning | Game AI, Autonomous Vehicles, Industrial Automation |
| SK-025 | Edge Deployment | Embedded Systems, IoT, Edge Computing |
| SK-009 | Sensor Fusion | Autonomous Vehicles, Drones, Industrial Automation |
| SK-018 | Safety Systems | Industrial Automation, Medical Devices, Automotive |
| SK-023 | Behavior Trees | Game Development, Industrial Automation, Autonomous Systems |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-002 | Perception Engineer | Computer Vision, Autonomous Vehicles, AR/VR |
| AG-004 | Control Systems Engineer | Industrial Automation, Aerospace, Automotive |
| AG-007 | ML/RL Robotics Agent | Game AI, Autonomous Vehicles, Industrial Automation |
| AG-010 | Safety Engineer | Industrial Automation, Medical Devices, Automotive |
| AG-011 | Integration Test Engineer | Embedded Systems, IoT, Industrial Automation |

---

## Implementation Priority

### Phase 1: Core Robotics Infrastructure (High Impact)
1. **SK-001**: ROS/ROS2 Integration - Foundation for all ROS-based processes
2. **SK-004**: URDF/SDF Model - Required for simulation and visualization
3. **SK-002**: Gazebo Simulation - Primary simulation platform
4. **AG-001**: Robotics System Architect - Highest architectural impact
5. **AG-015**: ROS/ROS2 Expert - Core middleware expertise

### Phase 2: Perception and SLAM (High Impact)
1. **SK-007**: SLAM Algorithm - Critical for localization and mapping
2. **SK-009**: Sensor Fusion - Essential for state estimation
3. **SK-008**: Point Cloud Processing - Required for LiDAR-based systems
4. **SK-010**: Computer Vision - Foundation for visual perception
5. **AG-002**: Perception Engineer - Core perception expertise
6. **AG-006**: SLAM Specialist - Deep SLAM knowledge

### Phase 3: Planning and Control (High Impact)
1. **SK-006**: Nav2 Navigation - Primary navigation stack
2. **SK-005**: MoveIt Motion Planning - Manipulation planning
3. **SK-013**: MPC Controller - Advanced control
4. **SK-014**: Motion Planning - General motion planning
5. **AG-003**: Motion Planning Expert - Planning algorithms
6. **AG-004**: Control Systems Engineer - Control expertise
7. **AG-008**: Navigation Engineer - Navigation systems

### Phase 4: Simulation and Synthetic Data (Medium Impact)
1. **SK-003**: NVIDIA Isaac Sim - Photorealistic simulation
2. **SK-016**: Sim-to-Real Transfer - Reality gap reduction
3. **AG-005**: Simulation Engineer - Simulation expertise
4. **AG-009**: Robot Calibration Expert - Calibration procedures

### Phase 5: Learning and AI (Advanced)
1. **SK-015**: Reinforcement Learning - Robot learning
2. **SK-011**: Object Detection/Segmentation - Perception models
3. **SK-025**: Edge Deployment - Model optimization
4. **AG-007**: ML/RL Robotics Agent - Learning expertise

### Phase 6: Testing and Safety (Critical for Production)
1. **SK-018**: Safety System - Safety-critical systems
2. **SK-017**: Calibration Tools - Sensor calibration
3. **AG-010**: Safety Engineer - Functional safety
4. **AG-011**: Integration Test Engineer - System testing

### Phase 7: Advanced Systems (Specialized)
1. **SK-019**: Multi-Robot Coordination - Fleet systems
2. **SK-023**: Behavior Trees - Decision making
3. **SK-024**: Grasp Planning - Manipulation
4. **AG-012**: Manipulation Specialist - Manipulation expertise
5. **AG-013**: Fleet Management Agent - Multi-robot systems
6. **AG-014**: HRI Interface Designer - Human interaction

### Phase 8: Infrastructure and Tools
1. **SK-020**: TF2 Transforms - Coordinate frames
2. **SK-021**: RViz Visualization - Visualization
3. **SK-022**: ros2_control - Hardware abstraction

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 25 |
| Agents Identified | 15 |
| Shared Skill Candidates | 7 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 30 |

---

**Created**: 2026-01-24
**Version**: 1.1.0
**Status**: Phase 6 - Skills and Agents Implemented
**Completed**: 2026-01-24
**Implementation Summary**:
- 25 Skills implemented (20 new + 5 existing)
- 15 Agents implemented (12 new + 3 existing)
