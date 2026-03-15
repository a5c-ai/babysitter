# Sensor Fusion Skill

## Overview

The `sensor-fusion` skill provides expert capabilities for multi-sensor fusion and state estimation using Kalman filtering. It enables AI-powered configuration of EKF/UKF filters, robot_localization setup, and custom fusion implementations.

## Quick Start

### Prerequisites

1. **ROS2** - Humble or later
2. **robot_localization** - ROS2 package for EKF/UKF
3. **Calibrated sensors** - Known noise characteristics

### Installation

```bash
# Install robot_localization
sudo apt install ros-humble-robot-localization

# Install GTSAM for factor graph optimization (optional)
sudo apt install libgtsam-dev
```

## Usage

### Basic Operations

```bash
# Configure robot_localization EKF
/skill sensor-fusion configure-ekf --sensors "imu,odom,gps" --output config/ekf.yaml

# Tune noise covariances
/skill sensor-fusion tune-noise --sensor imu --data-file imu_log.csv

# Setup dual EKF (odom + map frames)
/skill sensor-fusion setup-dual-ekf --local-sensors "imu,odom" --global-sensors "gps"

# Analyze fusion quality
/skill sensor-fusion analyze --bag-file test.db3 --groundtruth gt.txt
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(sensorFusionTask, {
  operation: 'configure',
  filterType: 'ekf',
  sensors: {
    imu: { topic: '/imu/data', rate: 200 },
    odom: { topic: '/wheel_odom', rate: 50 },
    gps: { topic: '/gps/fix', rate: 5 }
  },
  frames: {
    map: 'map',
    odom: 'odom',
    baseLink: 'base_link'
  },
  twoDMode: false
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **EKF Configuration** | Configure Extended Kalman Filter |
| **UKF Configuration** | Configure Unscented Kalman Filter |
| **robot_localization** | Setup ROS2 robot_localization package |
| **IMU Preintegration** | Efficient IMU integration for optimization |
| **GPS Integration** | NavSat transform and GPS fusion |
| **Outlier Rejection** | Mahalanobis distance, chi-squared tests |
| **Noise Tuning** | Autotuning of Q and R matrices |
| **Custom Filters** | Implement custom fusion algorithms |

## Examples

### Example 1: Indoor Robot (IMU + Wheel Odometry)

```bash
/skill sensor-fusion configure \
  --filter ekf \
  --sensors "imu:200hz,wheel_odom:50hz" \
  --two-d-mode true \
  --output config/indoor_ekf.yaml
```

### Example 2: Outdoor Robot (IMU + Odom + GPS)

```bash
/skill sensor-fusion configure-dual-ekf \
  --local-filter "imu,wheel_odom" \
  --global-filter "local_odom,gps" \
  --navsat-transform enabled \
  --output config/outdoor_ekf.yaml
```

### Example 3: Visual-Inertial Fusion

```bash
/skill sensor-fusion configure \
  --filter ukf \
  --sensors "imu:200hz,visual_odom:30hz" \
  --preintegration enabled \
  --output config/vio_fusion.yaml
```

## Configuration

### Sensor Configuration Matrix

Each sensor input is configured with a 15-element boolean array indicating which state elements to fuse:

```
[x, y, z, roll, pitch, yaw, vx, vy, vz, vroll, vpitch, vyaw, ax, ay, az]
```

### Common Configurations

| Sensor | Typical Config | Notes |
|--------|---------------|-------|
| IMU | `[F,F,F,T,T,T,F,F,F,T,T,T,T,T,T]` | Orientation, angular velocity, acceleration |
| Wheel Odom | `[T,T,F,F,F,T,T,T,F,F,F,T,F,F,F]` | 2D position, yaw, velocities |
| GPS | `[T,T,T,F,F,F,F,F,F,F,F,F,F,F,F]` | Position only |
| Visual Odom | `[T,T,T,T,T,T,F,F,F,F,F,F,F,F,F]` | Full pose |

### Skill Configuration

```yaml
# .babysitter/skills/sensor-fusion.yaml
sensor-fusion:
  defaultFilter: ekf
  frameConvention: REP-105
  defaults:
    frequency: 50.0
    sensorTimeout: 0.1
    twoDMode: false
  noiseDefaults:
    imu:
      orientation: [0.01, 0.01, 0.02]
      angularVelocity: [0.001, 0.001, 0.001]
      linearAcceleration: [0.01, 0.01, 0.01]
    odom:
      position: [0.05, 0.05, 0.1]
      velocity: [0.05, 0.05, 0.1]
    gps:
      position: [2.0, 2.0, 5.0]
```

## Process Integration

### Processes Using This Skill

1. **sensor-fusion-framework.js** - Primary fusion implementation
2. **visual-slam-implementation.js** - VIO fusion setup
3. **lidar-mapping-localization.js** - LiDAR-inertial fusion
4. **robot-calibration.js** - Sensor calibration verification

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const setupFusionTask = defineTask({
  name: 'setup-sensor-fusion',
  description: 'Setup multi-sensor fusion',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Configure Sensor Fusion',
      skill: {
        name: 'sensor-fusion',
        context: {
          operation: 'configure',
          filterType: inputs.filterType || 'ekf',
          sensors: inputs.sensors,
          frames: inputs.frames,
          twoDMode: inputs.twoDMode || false,
          publishTf: true
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

## Noise Tuning Guidelines

### Process Noise (Q Matrix)

Controls how much the filter trusts the motion model.

| State | Low Trust | Medium Trust | High Trust |
|-------|-----------|--------------|------------|
| Position | 0.1 | 0.05 | 0.01 |
| Orientation | 0.1 | 0.03 | 0.01 |
| Velocity | 0.5 | 0.1 | 0.025 |
| Angular Vel | 0.1 | 0.02 | 0.01 |

### Measurement Noise (R Matrix)

Controls how much the filter trusts sensor measurements.

| Sensor | Noisy | Typical | Accurate |
|--------|-------|---------|----------|
| IMU Orientation | 0.1 rad | 0.01 rad | 0.001 rad |
| Wheel Odom Velocity | 0.2 m/s | 0.05 m/s | 0.01 m/s |
| GPS Position | 5.0 m | 2.0 m | 0.5 m (RTK) |
| Visual Odom | 0.1 m | 0.02 m | 0.005 m |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Filter diverges` | Reduce process noise, check sensor rates |
| `Jumpy estimates` | Increase measurement noise, enable smoothing |
| `GPS causes jumps` | Enable outlier rejection, use dual-EKF |
| `Heading drift` | Check IMU magnetometer, add absolute heading |
| `TF tree broken` | Verify frame names, check publish_tf |

### Debug Commands

```bash
# Monitor filter output
ros2 topic echo /odometry/filtered

# Check covariance
ros2 topic echo /odometry/filtered --field pose.covariance

# Visualize in RViz
ros2 run rviz2 rviz2 -d sensor_fusion.rviz

# Print diagnostics
ros2 run robot_localization ekf_node --ros-args -p print_diagnostics:=true
```

## Related Skills

- **slam-algorithms** - SLAM with state estimation
- **ros-integration** - ROS node development
- **robot-calibration** - Sensor calibration

## References

- [robot_localization Wiki](http://docs.ros.org/en/noetic/api/robot_localization/html/)
- [REP-105 Coordinate Frames](https://www.ros.org/reps/rep-0105.html)
- [EKF Tutorial](https://www.kalmanfilter.net/default.aspx)
- [IMU Preintegration Paper](https://arxiv.org/abs/1512.02363)
- [EKF Sensor Fusion Packages](https://github.com/balamuruganky/EKF_IMU_GPS)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-009
**Category:** State Estimation
**Status:** Active
