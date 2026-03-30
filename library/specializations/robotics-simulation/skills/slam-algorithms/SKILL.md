---
name: slam-algorithms
description: Expert skill for SLAM algorithm selection, configuration, and tuning. Configure visual SLAM (ORB-SLAM3, RTAB-Map), LiDAR SLAM (Cartographer, LIO-SAM), tune parameters, evaluate accuracy, and optimize for real-time performance.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: perception
  backlog-id: SK-007
---

# slam-algorithms

You are **slam-algorithms** - a specialized skill for SLAM (Simultaneous Localization and Mapping) algorithm selection, configuration, and tuning.

## Overview

This skill enables AI-powered SLAM implementation including:
- Configuring ORB-SLAM3 for monocular, stereo, and RGB-D
- Setting up RTAB-Map for visual and LiDAR SLAM
- Configuring Google Cartographer for 2D and 3D SLAM
- Implementing LIO-SAM and LeGO-LOAM for LiDAR-inertial SLAM
- Tuning feature detection and matching parameters
- Configuring loop closure detection and optimization
- Setting up IMU preintegration and visual-inertial fusion
- Optimizing for real-time performance
- Evaluating SLAM accuracy (ATE, RPE metrics)
- Configuring map saving and loading

## Prerequisites

- ROS/ROS2 with SLAM packages
- Camera calibration (intrinsics and extrinsics)
- IMU calibration (if using VI-SLAM)
- Appropriate compute resources (GPU recommended for visual SLAM)

## Capabilities

### 1. ORB-SLAM3 Configuration

Configure ORB-SLAM3 for different sensor configurations:

```yaml
# orb_slam3_config.yaml
%YAML:1.0

# Camera Parameters (Monocular/Stereo)
Camera.type: "PinHole"
Camera.fx: 458.654
Camera.fy: 457.296
Camera.cx: 367.215
Camera.cy: 248.375
Camera.k1: -0.28340811
Camera.k2: 0.07395907
Camera.p1: 0.00019359
Camera.p2: 1.76187114e-05

# Camera resolution
Camera.width: 752
Camera.height: 480
Camera.fps: 20.0

# Stereo parameters
Camera.bf: 47.90639384423901  # baseline * fx

# RGB-D parameters
DepthMapFactor: 1.0
ThDepth: 35.0  # depth threshold

# ORB Extractor
ORBextractor.nFeatures: 1200
ORBextractor.scaleFactor: 1.2
ORBextractor.nLevels: 8
ORBextractor.iniThFAST: 20
ORBextractor.minThFAST: 7

# IMU Parameters (for VI-SLAM)
IMU.NoiseGyro: 1.7e-4
IMU.NoiseAcc: 2.0e-3
IMU.GyroWalk: 1.9e-5
IMU.AccWalk: 3.0e-3
IMU.Frequency: 200

# Viewer parameters
Viewer.KeyFrameSize: 0.05
Viewer.KeyFrameLineWidth: 1
Viewer.GraphLineWidth: 0.9
Viewer.PointSize: 2
Viewer.CameraSize: 0.08
Viewer.CameraLineWidth: 3
Viewer.ViewpointX: 0
Viewer.ViewpointY: -0.7
Viewer.ViewpointZ: -1.8
Viewer.ViewpointF: 500
```

Launch ORB-SLAM3:
```bash
# Monocular
ros2 run orb_slam3_ros orb_slam3_mono \
  --ros-args -p vocabulary:=/path/to/ORBvoc.txt \
  -p settings:=/path/to/config.yaml \
  -r /camera/image_raw:=/robot/camera/image_raw

# Stereo
ros2 run orb_slam3_ros orb_slam3_stereo \
  --ros-args -p vocabulary:=/path/to/ORBvoc.txt \
  -p settings:=/path/to/stereo_config.yaml

# RGB-D
ros2 run orb_slam3_ros orb_slam3_rgbd \
  --ros-args -p vocabulary:=/path/to/ORBvoc.txt \
  -p settings:=/path/to/rgbd_config.yaml

# Stereo-Inertial
ros2 run orb_slam3_ros orb_slam3_stereo_inertial \
  --ros-args -p vocabulary:=/path/to/ORBvoc.txt \
  -p settings:=/path/to/stereo_inertial_config.yaml
```

### 2. RTAB-Map Configuration

Configure RTAB-Map for RGB-D and LiDAR SLAM:

```yaml
# rtabmap_params.yaml
rtabmap:
  ros__parameters:
    # Database
    database_path: ""

    # Detection
    Rtabmap/DetectionRate: "1.0"
    Rtabmap/TimeThr: "0.0"

    # Memory
    Mem/IncrementalMemory: "true"
    Mem/STMSize: "30"
    Mem/RehearsalSimilarity: "0.6"

    # Visual Features
    Vis/FeatureType: "6"  # ORB
    Vis/MaxFeatures: "500"
    Vis/MinInliers: "20"
    Vis/InlierDistance: "0.1"

    # Loop Closure
    RGBD/LoopClosureReextractFeatures: "true"
    RGBD/OptimizeFromGraphEnd: "false"
    RGBD/ProximityBySpace: "true"

    # ICP for LiDAR
    Reg/Strategy: "1"  # 0=Vis, 1=ICP, 2=VisIcp
    Icp/PointToPlane: "true"
    Icp/Iterations: "30"
    Icp/VoxelSize: "0.05"
    Icp/MaxCorrespondenceDistance: "0.1"

    # Graph Optimization
    Optimizer/Strategy: "1"  # g2o
    Optimizer/Iterations: "20"

    # Mapping
    Grid/CellSize: "0.05"
    Grid/RangeMax: "5.0"
    Grid/RayTracing: "true"
    Grid/3D: "true"

rgbd_odometry:
  ros__parameters:
    frame_id: "base_link"
    odom_frame_id: "odom"
    publish_tf: true
    Odom/Strategy: "0"  # Frame-to-Map
    Odom/ResetCountdown: "1"
    Vis/CorType: "0"  # Features matching
```

Launch RTAB-Map:
```python
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        # RGB-D Odometry
        Node(
            package='rtabmap_odom',
            executable='rgbd_odometry',
            output='screen',
            parameters=[{
                'frame_id': 'base_link',
                'odom_frame_id': 'odom',
                'subscribe_rgbd': True,
                'approx_sync': True,
            }],
            remappings=[
                ('rgbd_image', '/camera/rgbd'),
            ]
        ),

        # RTAB-Map SLAM
        Node(
            package='rtabmap_slam',
            executable='rtabmap',
            output='screen',
            parameters=[{
                'subscribe_rgbd': True,
                'subscribe_scan': True,
                'approx_sync': True,
                'frame_id': 'base_link',
                'map_frame_id': 'map',
                'odom_frame_id': 'odom',
                'queue_size': 10,
            }],
            remappings=[
                ('rgbd_image', '/camera/rgbd'),
                ('scan', '/lidar/scan'),
            ]
        ),

        # RViz
        Node(
            package='rtabmap_viz',
            executable='rtabmap_viz',
            output='screen',
            parameters=[{
                'subscribe_rgbd': True,
                'subscribe_scan': True,
            }],
        )
    ])
```

### 3. Google Cartographer Configuration

Configure Cartographer for 2D and 3D SLAM:

```lua
-- cartographer_2d.lua
include "map_builder.lua"
include "trajectory_builder.lua"

options = {
  map_builder = MAP_BUILDER,
  trajectory_builder = TRAJECTORY_BUILDER,
  map_frame = "map",
  tracking_frame = "imu_link",
  published_frame = "base_link",
  odom_frame = "odom",
  provide_odom_frame = true,
  publish_frame_projected_to_2d = false,
  use_pose_extrapolator = true,
  use_odometry = false,
  use_nav_sat = false,
  use_landmarks = false,
  num_laser_scans = 1,
  num_multi_echo_laser_scans = 0,
  num_subdivisions_per_laser_scan = 1,
  num_point_clouds = 0,
  lookup_transform_timeout_sec = 0.2,
  submap_publish_period_sec = 0.3,
  pose_publish_period_sec = 5e-3,
  trajectory_publish_period_sec = 30e-3,
  rangefinder_sampling_ratio = 1.,
  odometry_sampling_ratio = 1.,
  fixed_frame_pose_sampling_ratio = 1.,
  imu_sampling_ratio = 1.,
  landmarks_sampling_ratio = 1.,
}

MAP_BUILDER.use_trajectory_builder_2d = true

TRAJECTORY_BUILDER_2D.submaps.num_range_data = 35
TRAJECTORY_BUILDER_2D.min_range = 0.3
TRAJECTORY_BUILDER_2D.max_range = 30.
TRAJECTORY_BUILDER_2D.missing_data_ray_length = 1.
TRAJECTORY_BUILDER_2D.use_imu_data = true
TRAJECTORY_BUILDER_2D.use_online_correlative_scan_matching = true
TRAJECTORY_BUILDER_2D.real_time_correlative_scan_matcher.linear_search_window = 0.1
TRAJECTORY_BUILDER_2D.real_time_correlative_scan_matcher.translation_delta_cost_weight = 10.
TRAJECTORY_BUILDER_2D.real_time_correlative_scan_matcher.rotation_delta_cost_weight = 1e-1

POSE_GRAPH.optimization_problem.huber_scale = 5e2
POSE_GRAPH.optimize_every_n_nodes = 35
POSE_GRAPH.constraint_builder.sampling_ratio = 0.03
POSE_GRAPH.constraint_builder.max_constraint_distance = 15.
POSE_GRAPH.constraint_builder.min_score = 0.55
POSE_GRAPH.constraint_builder.global_localization_min_score = 0.6

return options
```

```lua
-- cartographer_3d.lua
include "map_builder.lua"
include "trajectory_builder.lua"

options = {
  map_builder = MAP_BUILDER,
  trajectory_builder = TRAJECTORY_BUILDER,
  map_frame = "map",
  tracking_frame = "imu_link",
  published_frame = "base_link",
  odom_frame = "odom",
  provide_odom_frame = true,
  publish_frame_projected_to_2d = false,
  use_pose_extrapolator = true,
  use_odometry = false,
  use_nav_sat = false,
  use_landmarks = false,
  num_laser_scans = 0,
  num_multi_echo_laser_scans = 0,
  num_subdivisions_per_laser_scan = 1,
  num_point_clouds = 1,
  lookup_transform_timeout_sec = 0.2,
  submap_publish_period_sec = 0.3,
  pose_publish_period_sec = 5e-3,
  trajectory_publish_period_sec = 30e-3,
  rangefinder_sampling_ratio = 1.,
  odometry_sampling_ratio = 1.,
  fixed_frame_pose_sampling_ratio = 1.,
  imu_sampling_ratio = 1.,
  landmarks_sampling_ratio = 1.,
}

MAP_BUILDER.use_trajectory_builder_3d = true

TRAJECTORY_BUILDER_3D.num_accumulated_range_data = 1
TRAJECTORY_BUILDER_3D.min_range = 1.
TRAJECTORY_BUILDER_3D.max_range = 100.
TRAJECTORY_BUILDER_3D.voxel_filter_size = 0.15
TRAJECTORY_BUILDER_3D.high_resolution_adaptive_voxel_filter.max_length = 2.
TRAJECTORY_BUILDER_3D.low_resolution_adaptive_voxel_filter.max_length = 4.
TRAJECTORY_BUILDER_3D.use_online_correlative_scan_matching = false
TRAJECTORY_BUILDER_3D.ceres_scan_matcher.translation_weight = 5.
TRAJECTORY_BUILDER_3D.ceres_scan_matcher.rotation_weight = 4e2
TRAJECTORY_BUILDER_3D.submaps.high_resolution = 0.10
TRAJECTORY_BUILDER_3D.submaps.low_resolution = 0.45

return options
```

### 4. LIO-SAM Configuration

Configure LIO-SAM for LiDAR-inertial SLAM:

```yaml
# lio_sam_params.yaml
lio_sam:
  ros__parameters:
    # Topics
    pointCloudTopic: "points_raw"
    imuTopic: "imu_raw"
    odomTopic: "odometry/imu"
    gpsTopic: "gps/fix"

    # Frames
    lidarFrame: "base_link"
    baselinkFrame: "base_link"
    odometryFrame: "odom"
    mapFrame: "map"

    # GPS Settings
    useImuHeadingInitialization: true
    useGpsElevation: false
    gpsCovThreshold: 2.0
    poseCovThreshold: 25.0

    # Export settings
    savePCD: false
    savePCDDirectory: "/Downloads/LOAM/"

    # Sensor Settings
    sensor: velodyne  # velodyne, ouster, livox
    N_SCAN: 16
    Horizon_SCAN: 1800
    downsampleRate: 1
    lidarMinRange: 1.0
    lidarMaxRange: 100.0

    # IMU Settings
    imuAccNoise: 3.9939570888238808e-03
    imuGyrNoise: 1.5636343949698187e-03
    imuAccBiasN: 6.4356659353532566e-05
    imuGyrBiasN: 3.5640318696367613e-05
    imuGravity: 9.80511
    imuRPYWeight: 0.01

    # Extrinsics
    extrinsicTrans: [0.0, 0.0, 0.0]
    extrinsicRot: [-1, 0, 0, 0, 1, 0, 0, 0, -1]

    # LOAM feature threshold
    edgeThreshold: 1.0
    surfThreshold: 0.1
    edgeFeatureMinValidNum: 10
    surfFeatureMinValidNum: 100

    # Voxel filter params
    odometrySurfLeafSize: 0.4
    mappingCornerLeafSize: 0.2
    mappingSurfLeafSize: 0.4

    # Loop closure
    loopClosureEnableFlag: true
    loopClosureFrequency: 1.0
    surroundingKeyframeSize: 50
    historyKeyframeSearchRadius: 15.0
    historyKeyframeSearchTimeDiff: 30.0
    historyKeyframeSearchNum: 25
    historyKeyframeFitnessScore: 0.3

    # Optimization
    z_tollerance: 1000.0
    rotation_tollerance: 1000.0
    numberOfCores: 4
    mappingProcessInterval: 0.15
    surroundingKeyframeDensity: 2.0
    surroundingKeyframeSearchRadius: 50.0
```

### 5. SLAM Accuracy Evaluation

Evaluate SLAM accuracy using EVO toolkit:

```bash
# Install evo
pip install evo

# Compute Absolute Trajectory Error (ATE)
evo_ape tum groundtruth.txt estimated.txt -va --plot --save_results results/ate.zip

# Compute Relative Pose Error (RPE)
evo_rpe tum groundtruth.txt estimated.txt -va --delta 1 --delta_unit m --plot

# Compare multiple trajectories
evo_traj tum groundtruth.txt orb_slam.txt rtabmap.txt cartographer.txt -va --plot

# Generate trajectory statistics
evo_res results/*.zip --use_filenames -p --save_table results/comparison.csv
```

Python evaluation:
```python
import numpy as np
from evo.core import metrics
from evo.core.trajectory import PoseTrajectory3D
from evo.tools import file_interface

def evaluate_slam_accuracy(groundtruth_file, estimated_file):
    """Evaluate SLAM accuracy using ATE and RPE metrics."""

    # Load trajectories
    traj_ref = file_interface.read_tum_trajectory_file(groundtruth_file)
    traj_est = file_interface.read_tum_trajectory_file(estimated_file)

    # Synchronize trajectories
    from evo.core import sync
    traj_ref, traj_est = sync.associate_trajectories(traj_ref, traj_est)

    # Compute ATE
    ate_result = metrics.APE(metrics.PoseRelation.translation_part)
    ate_result.process_data((traj_ref, traj_est))

    print(f"ATE RMSE: {ate_result.stats['rmse']:.4f} m")
    print(f"ATE Mean: {ate_result.stats['mean']:.4f} m")
    print(f"ATE Std:  {ate_result.stats['std']:.4f} m")

    # Compute RPE
    rpe_result = metrics.RPE(metrics.PoseRelation.translation_part,
                            delta=1.0, delta_unit=metrics.Unit.meters)
    rpe_result.process_data((traj_ref, traj_est))

    print(f"RPE RMSE: {rpe_result.stats['rmse']:.4f} m")

    return {
        'ate_rmse': ate_result.stats['rmse'],
        'ate_mean': ate_result.stats['mean'],
        'rpe_rmse': rpe_result.stats['rmse']
    }
```

### 6. Map Saving and Loading

Save and load SLAM maps:

```bash
# RTAB-Map
# Save map database
ros2 service call /rtabmap/pause std_srvs/srv/Empty
ros2 service call /rtabmap/backup std_srvs/srv/Empty

# Load map for localization
ros2 run rtabmap_slam rtabmap \
  --ros-args -p database_path:=/path/to/map.db \
  -p Mem/IncrementalMemory:=false \
  -p Mem/InitWMWithAllNodes:=true

# Cartographer
# Save map
ros2 service call /write_state cartographer_ros_msgs/srv/WriteState \
  "{filename: '/path/to/map.pbstream'}"

# Load map
ros2 run cartographer_ros cartographer_node \
  -configuration_directory /path/to/config \
  -configuration_basename localization.lua \
  -load_state_filename /path/to/map.pbstream

# Export 2D occupancy grid
ros2 run nav2_map_server map_saver_cli -f /path/to/map
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Reference |
|--------|-------------|-----------|
| ros-mcp-server | ROS topic/service access | [GitHub](https://github.com/robotmcp/ros-mcp-server) |
| ROSBag MCP | Bag file analysis | [arXiv](https://arxiv.org/pdf/2511.03497) |

## Best Practices

1. **Proper calibration** - Accurate camera and IMU calibration is essential
2. **Feature tuning** - Adjust feature extraction for environment (texture-poor, dynamic)
3. **Loop closure** - Enable and tune for large environments
4. **Real-time monitoring** - Track tracking quality and relocalization events
5. **Map management** - Implement map saving for long-term autonomy
6. **Sensor fusion** - Combine visual and LiDAR for robust performance

## Process Integration

This skill integrates with the following processes:
- `visual-slam-implementation.js` - Visual SLAM setup
- `lidar-mapping-localization.js` - LiDAR SLAM configuration
- `autonomous-exploration.js` - Exploration with SLAM
- `sensor-fusion-framework.js` - Multi-sensor SLAM

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "configure-slam",
  "algorithm": "rtabmap",
  "sensorConfig": "rgbd+lidar",
  "status": "success",
  "configuration": {
    "featureType": "ORB",
    "loopClosure": true,
    "optimizationStrategy": "g2o"
  },
  "artifacts": [
    "config/rtabmap_params.yaml",
    "launch/slam.launch.py"
  ],
  "estimatedPerformance": {
    "updateRate": "10 Hz",
    "memoryUsage": "moderate"
  }
}
```

## Constraints

- Verify sensor calibration before SLAM deployment
- Monitor CPU/GPU usage for real-time performance
- Test loop closure in controlled environment first
- Validate map quality before autonomous navigation
- Consider environmental factors (lighting, texture, dynamic objects)
