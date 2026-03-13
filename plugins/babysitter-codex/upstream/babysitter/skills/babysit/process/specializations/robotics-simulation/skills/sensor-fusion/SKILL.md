---
name: sensor-fusion
description: Expert skill for multi-sensor fusion and state estimation using Kalman filtering. Implement EKF/UKF, configure robot_localization, fuse IMU, GPS, odometry, and visual sensors for robust localization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: state-estimation
  backlog-id: SK-009
---

# sensor-fusion

You are **sensor-fusion** - a specialized skill for multi-sensor fusion and state estimation using Kalman filtering and factor graph optimization.

## Overview

This skill enables AI-powered sensor fusion including:
- Implementing Extended Kalman Filter (EKF) for state estimation
- Configuring Unscented Kalman Filter (UKF) for nonlinear systems
- Setting up robot_localization package configuration
- Implementing IMU preintegration and bias estimation
- Configuring GPS/RTK integration with local coordinate frames
- Implementing wheel odometry fusion with slip compensation
- Setting up visual odometry integration
- Configuring outlier rejection (Mahalanobis, chi-squared)
- Tuning process and measurement noise covariances
- Implementing sensor delay compensation

## Prerequisites

- ROS2 with robot_localization package
- Calibrated sensors (IMU, cameras, wheel encoders)
- Understanding of coordinate frames (REP-105)
- Sensor noise characteristics

## Capabilities

### 1. robot_localization Configuration

Configure the ROS2 robot_localization package for EKF/UKF:

```yaml
# ekf_localization.yaml
ekf_filter_node:
  ros__parameters:
    # Coordinate frames
    map_frame: map
    odom_frame: odom
    base_link_frame: base_link
    world_frame: odom

    # Frequencies
    frequency: 50.0
    sensor_timeout: 0.1
    two_d_mode: false

    # Transform settings
    transform_time_offset: 0.0
    transform_timeout: 0.0
    print_diagnostics: true
    debug: false
    publish_tf: true
    publish_acceleration: false

    # IMU input
    imu0: /imu/data
    imu0_config: [false, false, false,  # x, y, z position
                  true,  true,  true,   # roll, pitch, yaw
                  false, false, false,  # vx, vy, vz
                  true,  true,  true,   # vroll, vpitch, vyaw
                  true,  true,  true]   # ax, ay, az
    imu0_differential: false
    imu0_relative: false
    imu0_queue_size: 10
    imu0_remove_gravitational_acceleration: true

    # Wheel odometry input
    odom0: /wheel_odom
    odom0_config: [true,  true,  false,  # x, y, z position
                   false, false, true,   # roll, pitch, yaw
                   true,  true,  false,  # vx, vy, vz
                   false, false, true,   # vroll, vpitch, vyaw
                   false, false, false]  # ax, ay, az
    odom0_differential: false
    odom0_relative: false
    odom0_queue_size: 10

    # GPS input (for map frame)
    # odom1: /gps/odom
    # odom1_config: [true,  true,  true,
    #                false, false, false,
    #                false, false, false,
    #                false, false, false,
    #                false, false, false]
    # odom1_differential: false

    # Process noise covariance (Q matrix diagonal)
    process_noise_covariance: [
      0.05,   # x
      0.05,   # y
      0.06,   # z
      0.03,   # roll
      0.03,   # pitch
      0.06,   # yaw
      0.025,  # vx
      0.025,  # vy
      0.04,   # vz
      0.01,   # vroll
      0.01,   # vpitch
      0.02,   # vyaw
      0.01,   # ax
      0.01,   # ay
      0.015   # az
    ]

    # Initial estimate covariance (P0 matrix diagonal)
    initial_estimate_covariance: [
      1e-9, 1e-9, 1e-9,     # position
      1e-9, 1e-9, 1e-9,     # orientation
      1e-9, 1e-9, 1e-9,     # velocity
      1e-9, 1e-9, 1e-9,     # angular velocity
      1e-9, 1e-9, 1e-9      # acceleration
    ]
```

### 2. Two-EKF Setup (Odom + Map Frames)

Configure two EKF instances for continuous odometry and global localization:

```yaml
# dual_ekf_navsat.yaml

# EKF for continuous odometry (odom frame)
ekf_filter_node_odom:
  ros__parameters:
    frequency: 50.0
    two_d_mode: false

    map_frame: map
    odom_frame: odom
    base_link_frame: base_link
    world_frame: odom

    # Fuse IMU and wheel odometry only
    imu0: /imu/data
    imu0_config: [false, false, false,
                  true,  true,  true,
                  false, false, false,
                  true,  true,  true,
                  true,  true,  true]
    imu0_remove_gravitational_acceleration: true

    odom0: /wheel_odom
    odom0_config: [true,  true,  false,
                   false, false, true,
                   true,  true,  false,
                   false, false, true,
                   false, false, false]

# EKF for global localization (map frame)
ekf_filter_node_map:
  ros__parameters:
    frequency: 50.0
    two_d_mode: false

    map_frame: map
    odom_frame: odom
    base_link_frame: base_link
    world_frame: map

    # Fuse odometry output and GPS
    odom0: /odometry/filtered
    odom0_config: [true,  true,  true,
                   true,  true,  true,
                   true,  true,  true,
                   true,  true,  true,
                   true,  true,  true]

    odom1: /gps/odom
    odom1_config: [true,  true,  true,
                   false, false, false,
                   false, false, false,
                   false, false, false,
                   false, false, false]
    odom1_differential: false

# NavSat transform node
navsat_transform_node:
  ros__parameters:
    frequency: 50.0
    delay: 0.0
    magnetic_declination_radians: 0.0
    yaw_offset: 0.0
    zero_altitude: true
    broadcast_utm_transform: true
    publish_filtered_gps: true
    use_odometry_yaw: false
    wait_for_datum: false
```

### 3. Custom EKF Implementation

Implement a custom EKF for state estimation:

```python
import numpy as np
from scipy.linalg import block_diag

class RobotEKF:
    """Extended Kalman Filter for robot localization."""

    def __init__(self, dt=0.02):
        self.dt = dt

        # State: [x, y, z, roll, pitch, yaw, vx, vy, vz, wx, wy, wz]
        self.n_states = 12

        # State vector
        self.x = np.zeros(self.n_states)

        # State covariance
        self.P = np.eye(self.n_states) * 0.1

        # Process noise
        self.Q = np.diag([
            0.01, 0.01, 0.01,    # position noise
            0.001, 0.001, 0.001, # orientation noise
            0.1, 0.1, 0.1,       # velocity noise
            0.01, 0.01, 0.01     # angular velocity noise
        ])

    def predict(self, u=None):
        """Predict step using motion model."""
        dt = self.dt
        x, y, z = self.x[0:3]
        roll, pitch, yaw = self.x[3:6]
        vx, vy, vz = self.x[6:9]
        wx, wy, wz = self.x[9:12]

        # State transition (constant velocity model)
        # Position update
        self.x[0] += vx * np.cos(yaw) * dt - vy * np.sin(yaw) * dt
        self.x[1] += vx * np.sin(yaw) * dt + vy * np.cos(yaw) * dt
        self.x[2] += vz * dt

        # Orientation update
        self.x[3] += wx * dt
        self.x[4] += wy * dt
        self.x[5] += wz * dt

        # Jacobian of state transition
        F = self._compute_jacobian()

        # Covariance prediction
        self.P = F @ self.P @ F.T + self.Q

    def _compute_jacobian(self):
        """Compute Jacobian of state transition."""
        dt = self.dt
        yaw = self.x[5]
        vx, vy = self.x[6:8]

        F = np.eye(self.n_states)

        # Position derivatives w.r.t. yaw
        F[0, 5] = -vx * np.sin(yaw) * dt - vy * np.cos(yaw) * dt
        F[1, 5] = vx * np.cos(yaw) * dt - vy * np.sin(yaw) * dt

        # Position derivatives w.r.t. velocity
        F[0, 6] = np.cos(yaw) * dt
        F[0, 7] = -np.sin(yaw) * dt
        F[1, 6] = np.sin(yaw) * dt
        F[1, 7] = np.cos(yaw) * dt
        F[2, 8] = dt

        # Orientation derivatives w.r.t. angular velocity
        F[3, 9] = dt
        F[4, 10] = dt
        F[5, 11] = dt

        return F

    def update_imu(self, imu_data):
        """Update with IMU measurement (orientation, angular velocity, acceleration)."""
        # Measurement: [roll, pitch, yaw, wx, wy, wz, ax, ay, az]
        z = np.array([
            imu_data['roll'], imu_data['pitch'], imu_data['yaw'],
            imu_data['wx'], imu_data['wy'], imu_data['wz']
        ])

        # Measurement matrix
        H = np.zeros((6, self.n_states))
        H[0:3, 3:6] = np.eye(3)  # Orientation
        H[3:6, 9:12] = np.eye(3)  # Angular velocity

        # Measurement noise
        R = np.diag([0.01, 0.01, 0.02, 0.001, 0.001, 0.001])

        self._ekf_update(z, H, R)

    def update_odom(self, odom_data):
        """Update with odometry measurement (velocity)."""
        z = np.array([odom_data['vx'], odom_data['vy'], odom_data['wz']])

        # Measurement matrix
        H = np.zeros((3, self.n_states))
        H[0, 6] = 1  # vx
        H[1, 7] = 1  # vy
        H[2, 11] = 1  # wz

        # Measurement noise
        R = np.diag([0.05, 0.05, 0.02])

        self._ekf_update(z, H, R)

    def update_gps(self, gps_data):
        """Update with GPS measurement (position)."""
        z = np.array([gps_data['x'], gps_data['y'], gps_data['z']])

        # Measurement matrix
        H = np.zeros((3, self.n_states))
        H[0:3, 0:3] = np.eye(3)

        # Measurement noise (GPS typically 1-5m accuracy)
        R = np.diag([2.0, 2.0, 5.0])

        # Outlier rejection using Mahalanobis distance
        y = z - H @ self.x
        S = H @ self.P @ H.T + R
        mahal_dist = np.sqrt(y.T @ np.linalg.inv(S) @ y)

        if mahal_dist < 5.0:  # Chi-squared threshold
            self._ekf_update(z, H, R)
        else:
            print(f"GPS outlier rejected: Mahalanobis distance = {mahal_dist:.2f}")

    def _ekf_update(self, z, H, R):
        """Standard EKF update step."""
        # Innovation
        y = z - H @ self.x

        # Innovation covariance
        S = H @ self.P @ H.T + R

        # Kalman gain
        K = self.P @ H.T @ np.linalg.inv(S)

        # State update
        self.x = self.x + K @ y

        # Covariance update (Joseph form for numerical stability)
        I_KH = np.eye(self.n_states) - K @ H
        self.P = I_KH @ self.P @ I_KH.T + K @ R @ K.T

    def get_state(self):
        """Return current state estimate."""
        return {
            'position': self.x[0:3],
            'orientation': self.x[3:6],
            'velocity': self.x[6:9],
            'angular_velocity': self.x[9:12],
            'covariance': np.diag(self.P)
        }
```

### 4. IMU Preintegration

Implement IMU preintegration for efficient optimization:

```python
import numpy as np
from scipy.spatial.transform import Rotation

class IMUPreintegration:
    """IMU preintegration for factor graph optimization."""

    def __init__(self, acc_noise=0.01, gyro_noise=0.001,
                 acc_bias_noise=0.0001, gyro_bias_noise=0.00001):
        self.acc_noise = acc_noise
        self.gyro_noise = gyro_noise
        self.acc_bias_noise = acc_bias_noise
        self.gyro_bias_noise = gyro_bias_noise

        self.reset()

    def reset(self):
        """Reset preintegration."""
        self.delta_R = np.eye(3)
        self.delta_v = np.zeros(3)
        self.delta_p = np.zeros(3)
        self.delta_t = 0.0

        # Jacobians for bias correction
        self.dR_dbg = np.zeros((3, 3))
        self.dv_dba = np.zeros((3, 3))
        self.dv_dbg = np.zeros((3, 3))
        self.dp_dba = np.zeros((3, 3))
        self.dp_dbg = np.zeros((3, 3))

        # Covariance
        self.cov = np.zeros((9, 9))

    def integrate(self, acc, gyro, dt, acc_bias=None, gyro_bias=None):
        """Integrate IMU measurement."""
        if acc_bias is None:
            acc_bias = np.zeros(3)
        if gyro_bias is None:
            gyro_bias = np.zeros(3)

        # Remove bias
        acc_unbiased = acc - acc_bias
        gyro_unbiased = gyro - gyro_bias

        # Rotation increment
        theta = gyro_unbiased * dt
        dR = Rotation.from_rotvec(theta).as_matrix()

        # Update preintegrated measurements
        self.delta_p += self.delta_v * dt + 0.5 * self.delta_R @ acc_unbiased * dt**2
        self.delta_v += self.delta_R @ acc_unbiased * dt
        self.delta_R = self.delta_R @ dR
        self.delta_t += dt

        # Update Jacobians
        self._update_jacobians(acc_unbiased, gyro_unbiased, dt)

        # Update covariance
        self._update_covariance(dt)

    def _update_jacobians(self, acc, gyro, dt):
        """Update bias Jacobians."""
        # Skew-symmetric matrix
        def skew(v):
            return np.array([
                [0, -v[2], v[1]],
                [v[2], 0, -v[0]],
                [-v[1], v[0], 0]
            ])

        theta = gyro * dt
        Jr = self._right_jacobian(theta)

        # Update rotation Jacobian
        self.dR_dbg = self.delta_R.T @ self.dR_dbg - Jr * dt

        # Update velocity Jacobians
        self.dv_dba = self.dv_dba - self.delta_R * dt
        self.dv_dbg = self.dv_dbg - self.delta_R @ skew(acc) @ self.dR_dbg * dt

        # Update position Jacobians
        self.dp_dba = self.dp_dba + self.dv_dba * dt - 0.5 * self.delta_R * dt**2
        self.dp_dbg = self.dp_dbg + self.dv_dbg * dt - 0.5 * self.delta_R @ skew(acc) @ self.dR_dbg * dt**2

    def _right_jacobian(self, theta):
        """Compute right Jacobian of SO(3)."""
        angle = np.linalg.norm(theta)
        if angle < 1e-8:
            return np.eye(3)

        axis = theta / angle
        s = np.sin(angle)
        c = np.cos(angle)

        return (s / angle) * np.eye(3) + \
               (1 - s / angle) * np.outer(axis, axis) + \
               ((1 - c) / angle) * self._skew(axis)

    def _skew(self, v):
        """Skew-symmetric matrix."""
        return np.array([
            [0, -v[2], v[1]],
            [v[2], 0, -v[0]],
            [-v[1], v[0], 0]
        ])

    def _update_covariance(self, dt):
        """Update preintegration covariance."""
        # Simplified covariance propagation
        A = np.eye(9)
        B = np.eye(9) * dt

        noise_cov = np.diag([
            self.gyro_noise**2, self.gyro_noise**2, self.gyro_noise**2,
            self.acc_noise**2, self.acc_noise**2, self.acc_noise**2,
            self.gyro_bias_noise**2, self.gyro_bias_noise**2, self.gyro_bias_noise**2
        ])

        self.cov = A @ self.cov @ A.T + B @ noise_cov @ B.T

    def get_preintegrated(self):
        """Return preintegrated measurements."""
        return {
            'delta_R': self.delta_R,
            'delta_v': self.delta_v,
            'delta_p': self.delta_p,
            'delta_t': self.delta_t,
            'covariance': self.cov,
            'jacobians': {
                'dR_dbg': self.dR_dbg,
                'dv_dba': self.dv_dba,
                'dv_dbg': self.dv_dbg,
                'dp_dba': self.dp_dba,
                'dp_dbg': self.dp_dbg
            }
        }
```

### 5. Noise Covariance Tuning

Guidelines for tuning process and measurement noise:

```python
def tune_noise_covariances(sensor_data_log, initial_Q, initial_R):
    """
    Autotuning for noise covariances using innovation analysis.

    Parameters:
    - sensor_data_log: List of sensor measurements
    - initial_Q: Initial process noise covariance
    - initial_R: Initial measurement noise covariance

    Returns:
    - Tuned Q and R matrices
    """
    from scipy.optimize import minimize

    def compute_nees(Q_diag, R_diag, data):
        """Compute Normalized Estimation Error Squared."""
        ekf = RobotEKF()
        ekf.Q = np.diag(Q_diag)

        nees_values = []
        for measurement in data:
            ekf.predict()

            # Compute innovation
            z = measurement['z']
            H = measurement['H']
            R = np.diag(R_diag[:len(z)])

            y = z - H @ ekf.x
            S = H @ ekf.P @ H.T + R

            # NEES
            nees = y.T @ np.linalg.inv(S) @ y / len(z)
            nees_values.append(nees)

            ekf._ekf_update(z, H, R)

        return np.mean(nees_values)

    def objective(params):
        n_Q = len(initial_Q)
        Q_diag = params[:n_Q]
        R_diag = params[n_Q:]

        nees = compute_nees(Q_diag, R_diag, sensor_data_log)
        # NEES should be close to 1 for consistent estimation
        return (nees - 1.0)**2

    initial_params = np.concatenate([np.diag(initial_Q), np.diag(initial_R)])

    result = minimize(objective, initial_params,
                     method='L-BFGS-B',
                     bounds=[(1e-6, 10)] * len(initial_params))

    n_Q = len(initial_Q)
    Q_tuned = np.diag(result.x[:n_Q])
    R_tuned = np.diag(result.x[n_Q:])

    return Q_tuned, R_tuned
```

### 6. Launch Configuration

Launch robot_localization with sensor fusion:

```python
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.substitutions import PathJoinSubstitution
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    pkg_share = FindPackageShare('my_robot_localization')

    ekf_config = PathJoinSubstitution([pkg_share, 'config', 'ekf.yaml'])

    return LaunchDescription([
        # EKF for odometry frame
        Node(
            package='robot_localization',
            executable='ekf_node',
            name='ekf_filter_node_odom',
            output='screen',
            parameters=[ekf_config],
            remappings=[
                ('odometry/filtered', 'odometry/local'),
                ('accel/filtered', 'accel/local')
            ]
        ),

        # EKF for map frame (with GPS)
        Node(
            package='robot_localization',
            executable='ekf_node',
            name='ekf_filter_node_map',
            output='screen',
            parameters=[ekf_config],
            remappings=[
                ('odometry/filtered', 'odometry/global'),
                ('accel/filtered', 'accel/global')
            ]
        ),

        # NavSat transform for GPS
        Node(
            package='robot_localization',
            executable='navsat_transform_node',
            name='navsat_transform_node',
            output='screen',
            parameters=[ekf_config],
            remappings=[
                ('odometry/filtered', 'odometry/global'),
                ('gps/fix', 'gps/data'),
                ('imu/data', 'imu/data')
            ]
        )
    ])
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Reference |
|--------|-------------|-----------|
| ros-mcp-server | ROS topic access | [GitHub](https://github.com/robotmcp/ros-mcp-server) |

## Best Practices

1. **Sensor calibration** - Accurate calibration is essential for fusion quality
2. **Noise characterization** - Measure actual sensor noise statistics
3. **Frame conventions** - Follow REP-105 for coordinate frames
4. **Outlier rejection** - Implement Mahalanobis distance checks
5. **Time synchronization** - Ensure sensors are time-synchronized
6. **Graceful degradation** - Handle sensor failures gracefully

## Process Integration

This skill integrates with the following processes:
- `sensor-fusion-framework.js` - Primary fusion framework
- `visual-slam-implementation.js` - VIO fusion
- `lidar-mapping-localization.js` - LiDAR-inertial fusion
- `robot-calibration.js` - Sensor calibration

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "configure-fusion",
  "filterType": "EKF",
  "status": "success",
  "sensors": {
    "imu": {"fused": true, "rate": 200},
    "odom": {"fused": true, "rate": 50},
    "gps": {"fused": true, "rate": 5}
  },
  "artifacts": [
    "config/ekf_localization.yaml",
    "launch/localization.launch.py"
  ],
  "tuningRecommendations": [
    "Consider increasing IMU trust (lower R values)",
    "GPS noise may need adjustment for urban environments"
  ]
}
```

## Constraints

- Verify sensor time synchronization before fusion
- Ensure coordinate frame consistency (REP-105)
- Monitor filter divergence indicators
- Test outlier rejection with ground truth
- Validate covariance growth during sensor dropout
