---
name: NVIDIA Isaac Sim Skill
description: Specialized skill for NVIDIA Isaac Sim photorealistic simulation and synthetic data generation
slug: isaac-sim
category: Simulation
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# NVIDIA Isaac Sim Skill

## Overview

Expert skill for NVIDIA Isaac Sim photorealistic simulation, Omniverse integration, and synthetic data generation using Replicator.

## Capabilities

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

## Target Processes

- isaac-sim-photorealistic.js
- synthetic-data-pipeline.js
- digital-twin-development.js
- rl-robot-control.js

## Dependencies

- NVIDIA Isaac Sim
- Omniverse
- NVIDIA GPU with RTX
- USD/USDA libraries

## Usage Context

This skill is invoked when processes require photorealistic simulation environments, synthetic data generation with domain randomization, or high-fidelity physics simulation using NVIDIA's simulation stack.

## Output Artifacts

- USD scene files
- Replicator configuration scripts
- Synthetic datasets (images, annotations, ground truth)
- Domain randomization configurations
- ROS bridge configurations
