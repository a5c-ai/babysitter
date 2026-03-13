# SLAM Algorithms Skill

## Overview

The `slam-algorithms` skill provides expert capabilities for SLAM (Simultaneous Localization and Mapping) algorithm selection, configuration, and tuning. It enables AI-powered SLAM deployment for visual, LiDAR, and multi-sensor configurations.

## Quick Start

### Prerequisites

1. **ROS2** - Humble or later
2. **SLAM packages** - ORB-SLAM3, RTAB-Map, Cartographer, LIO-SAM
3. **Calibrated sensors** - Camera intrinsics, IMU parameters, LiDAR-camera extrinsics

### Installation

```bash
# RTAB-Map
sudo apt install ros-humble-rtabmap-ros

# Cartographer
sudo apt install ros-humble-cartographer ros-humble-cartographer-ros

# SLAM Toolbox (2D LiDAR)
sudo apt install ros-humble-slam-toolbox

# ORB-SLAM3 (build from source)
git clone https://github.com/UZ-SLAMLab/ORB_SLAM3.git
# Follow build instructions

# LIO-SAM (build from source)
git clone https://github.com/TixiaoShan/LIO-SAM.git
# Follow build instructions

# Evaluation tools
pip install evo
```

## Usage

### Basic Operations

```bash
# Select SLAM algorithm for use case
/skill slam-algorithms recommend --sensor-type "rgbd+imu" --environment indoor

# Configure RTAB-Map
/skill slam-algorithms configure-rtabmap --mode mapping --sensor rgbd --lidar true

# Configure Cartographer
/skill slam-algorithms configure-cartographer --mode 2d --imu true

# Evaluate SLAM accuracy
/skill slam-algorithms evaluate --groundtruth gt.txt --estimated est.txt

# Tune parameters
/skill slam-algorithms tune --algorithm rtabmap --metric loop_closure --target better
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(slamAlgorithmsTask, {
  operation: 'configure',
  algorithm: 'rtabmap',
  sensorConfig: {
    rgbd: true,
    lidar: true,
    imu: true
  },
  environment: 'indoor_warehouse',
  requirements: {
    realTime: true,
    loopClosure: true,
    mapSaving: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Algorithm Selection** | Recommend SLAM algorithms for use case |
| **Visual SLAM** | Configure ORB-SLAM3, RTAB-Map visual modes |
| **LiDAR SLAM** | Configure Cartographer, LIO-SAM, SLAM Toolbox |
| **Parameter Tuning** | Tune feature extraction, loop closure, optimization |
| **Accuracy Evaluation** | Compute ATE, RPE metrics with EVO |
| **Map Management** | Save, load, and export SLAM maps |
| **Multi-Sensor Fusion** | Configure VIO, LiDAR-inertial SLAM |

## Algorithm Comparison

| Algorithm | Sensor | Real-Time | Loop Closure | Best For |
|-----------|--------|-----------|--------------|----------|
| ORB-SLAM3 | Mono/Stereo/RGBD+IMU | Yes | Yes | Research, high accuracy |
| RTAB-Map | RGBD/Stereo/LiDAR | Yes | Yes | Multi-sensor, long-term |
| Cartographer | LiDAR+IMU | Yes | Yes | 2D/3D mapping, Google support |
| LIO-SAM | LiDAR+IMU | Yes | Yes | Outdoor, high-speed |
| SLAM Toolbox | 2D LiDAR | Yes | Yes | Nav2 integration, simple |

## Examples

### Example 1: Indoor Mobile Robot (RGB-D + LiDAR)

```bash
/skill slam-algorithms configure \
  --algorithm rtabmap \
  --rgbd-camera realsense_d435i \
  --lidar rplidar_s2 \
  --imu enabled \
  --mode mapping \
  --output-config config/indoor_slam.yaml
```

### Example 2: Outdoor Vehicle (LiDAR-Inertial)

```bash
/skill slam-algorithms configure \
  --algorithm lio-sam \
  --lidar velodyne_vlp16 \
  --imu xsens \
  --gps enabled \
  --environment outdoor \
  --output-config config/outdoor_slam.yaml
```

### Example 3: Evaluate and Compare

```bash
/skill slam-algorithms compare \
  --groundtruth kitti_gt.txt \
  --trajectories "orb_slam3:orb.txt,rtabmap:rtabmap.txt,lio_sam:lio.txt" \
  --metrics "ate,rpe" \
  --output-report comparison_report.pdf
```

## Configuration

### Skill Configuration

```yaml
# .babysitter/skills/slam-algorithms.yaml
slam-algorithms:
  defaultAlgorithm: rtabmap
  evaluation:
    tool: evo
    metrics: [ate, rpe]
  realTimeMonitoring: true
  mapFormats:
    2d: pgm
    3d: pcd
  defaults:
    featureType: ORB
    loopClosure: true
    optimizationBackend: g2o
```

### Algorithm Selection Guide

| Environment | Recommended Algorithm | Reason |
|-------------|----------------------|--------|
| Indoor, textured | RTAB-Map (RGBD) | Good features, loop closure |
| Indoor, sparse | RTAB-Map + LiDAR | Robust to texture-poor |
| Outdoor, driving | LIO-SAM | Fast, robust to vibration |
| Outdoor, walking | ORB-SLAM3 VI | Visual-inertial fusion |
| Large scale | Cartographer | Google-scale optimization |

## Process Integration

### Processes Using This Skill

1. **visual-slam-implementation.js** - Visual SLAM setup and tuning
2. **lidar-mapping-localization.js** - LiDAR SLAM configuration
3. **autonomous-exploration.js** - Exploration with online mapping
4. **sensor-fusion-framework.js** - Multi-sensor SLAM fusion

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const setupSlamTask = defineTask({
  name: 'setup-slam',
  description: 'Setup SLAM for robot localization',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure ${inputs.algorithm} SLAM`,
      skill: {
        name: 'slam-algorithms',
        context: {
          operation: 'configure',
          algorithm: inputs.algorithm,
          sensors: inputs.sensors,
          environment: inputs.environment,
          requirements: inputs.requirements
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

## Evaluation Metrics

### Absolute Trajectory Error (ATE)

Measures global consistency of the estimated trajectory.

```
ATE = sqrt(1/n * sum(||p_est - p_gt||^2))
```

**Interpretation:**
- < 0.1m: Excellent
- 0.1-0.5m: Good
- 0.5-1.0m: Acceptable
- > 1.0m: Poor

### Relative Pose Error (RPE)

Measures local accuracy (drift) over fixed distances.

```
RPE = sqrt(1/m * sum(||delta_est - delta_gt||^2))
```

**Interpretation:**
- < 1%: Excellent drift
- 1-2%: Good drift
- 2-5%: Acceptable drift
- > 5%: Significant drift

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Tracking lost` | Reduce speed, improve lighting, add more features |
| `No loop closure` | Lower similarity threshold, extend search radius |
| `High drift` | Enable IMU fusion, check calibration |
| `Memory overflow` | Enable map pruning, reduce feature count |
| `Real-time failure` | Reduce resolution, use GPU acceleration |

### Debug Commands

```bash
# Monitor SLAM status (RTAB-Map)
ros2 topic echo /rtabmap/info

# Visualize tracking quality (ORB-SLAM3)
ros2 topic echo /orb_slam3/tracking_state

# Check loop closures (Cartographer)
ros2 topic echo /constraint_list

# View trajectory in real-time
ros2 run rviz2 rviz2 -d slam_debug.rviz
```

## Related Skills

- **sensor-fusion** - Multi-sensor state estimation
- **ros-integration** - ROS node development
- **computer-vision** - Camera calibration

## References

- [ORB-SLAM3 Paper](https://arxiv.org/abs/2007.11898)
- [RTAB-Map Wiki](http://wiki.ros.org/rtabmap_ros)
- [Cartographer ROS](https://google-cartographer-ros.readthedocs.io/)
- [LIO-SAM Paper](https://arxiv.org/abs/2007.00258)
- [EVO Evaluation Tool](https://github.com/MichaelGrupp/evo)
- [awesome-visual-slam](https://github.com/tzutalin/awesome-visual-slam)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-007
**Category:** Perception
**Status:** Active
