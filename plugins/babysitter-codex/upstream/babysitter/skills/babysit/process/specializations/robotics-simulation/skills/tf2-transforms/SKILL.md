---
name: TF2 Transforms Skill
description: Expert skill for ROS tf2 coordinate frame management and transforms
slug: tf2-transforms
category: Middleware
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# TF2 Transforms Skill

## Overview

Expert skill for managing ROS tf2 coordinate frames, transform broadcasting, and debugging transform connectivity issues.

## Capabilities

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

## Target Processes

- robot-system-design.js
- robot-calibration.js
- sensor-fusion-framework.js
- visual-slam-implementation.js

## Dependencies

- tf2_ros
- tf2_geometry_msgs
- tf_transformations

## Usage Context

This skill is invoked when processes require coordinate frame setup, transform debugging, or multi-robot TF configuration.

## Output Artifacts

- Static transform launch files
- Transform broadcaster nodes
- TF tree configurations
- Debug analysis reports
- Namespaced TF setups
- Time synchronization configs
