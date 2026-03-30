---
name: sensor-fusion
description: Multi-sensor fusion algorithms for perception in autonomous driving
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: automotive-engineering
  tags:
    - adas
    - autonomous-driving
    - perception
    - sensor-fusion
---

# Sensor Fusion Skill

## Purpose
Enable multi-sensor fusion algorithm development for autonomous driving perception including object detection, tracking, and environmental modeling.

## Capabilities
- Camera, radar, lidar data preprocessing
- Object detection fusion algorithms
- Tracking filter implementation (Kalman, EKF, UKF)
- Association algorithms (Hungarian, GNN, JPDA)
- Occupancy grid fusion
- Confidence estimation and sensor weighting
- Time synchronization handling
- Ground truth comparison and metrics

## Usage Guidelines
- Preprocess sensor data for consistent coordinate frames
- Select appropriate tracking filters based on object dynamics
- Implement robust association for multi-target scenarios
- Fuse sensor confidence for reliable perception
- Handle time delays and synchronization issues
- Validate fusion against ground truth data

## Dependencies
- ROS/ROS2
- TensorFlow
- PyTorch
- NVIDIA DriveWorks

## Process Integration
- ADA-001: Perception System Development
- ADA-002: Path Planning and Motion Control
- ADA-003: ADAS Feature Development
- ADA-004: Simulation and Virtual Validation
