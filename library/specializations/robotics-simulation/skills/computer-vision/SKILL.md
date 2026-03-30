---
name: Computer Vision Skill
description: Specialized skill for robot vision including feature detection, tracking, and camera calibration
slug: computer-vision
category: Perception
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Computer Vision Skill

## Overview

Expert skill for robot vision applications including camera calibration, feature detection and tracking, stereo vision, and visual servoing.

## Capabilities

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

## Target Processes

- robot-calibration.js
- visual-slam-implementation.js
- object-detection-pipeline.js
- digital-twin-development.js

## Dependencies

- OpenCV
- cv_bridge
- image_geometry
- camera_calibration

## Usage Context

This skill is invoked when processes require camera calibration, feature detection, visual tracking, or image processing for robot vision applications.

## Output Artifacts

- Camera calibration files (YAML)
- Stereo calibration parameters
- Feature detection configurations
- Visual servoing controllers
- Image processing pipelines
- Marker detection configurations
