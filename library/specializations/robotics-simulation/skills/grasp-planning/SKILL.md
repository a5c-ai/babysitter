---
name: Grasp Planning Skill
description: Grasp planning and execution for robotic manipulation tasks
slug: grasp-planning
category: Manipulation
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Grasp Planning Skill

## Overview

Expert skill for planning and executing robotic grasps, including grasp pose generation, quality metrics, and gripper control.

## Capabilities

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

## Target Processes

- moveit-manipulation-planning.js
- object-detection-pipeline.js
- rl-robot-control.js
- hri-interface.js

## Dependencies

- MoveIt grasps
- GPD (Grasp Pose Detection)
- GraspIt!
- moveit_simple_grasps

## Usage Context

This skill is invoked when processes require grasp planning for manipulation, pick-and-place operations, or bin picking tasks.

## Output Artifacts

- Grasp pose configurations
- Gripper action configurations
- Grasp quality evaluations
- Approach vector definitions
- Grasp database entries
- Collision-aware grasp selections
