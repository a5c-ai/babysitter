---
name: MoveIt Motion Planning Skill
description: Deep expertise in MoveIt/MoveIt2 configuration and manipulation planning
slug: moveit-planning
category: Motion Planning
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# MoveIt Motion Planning Skill

## Overview

Expert skill for configuring and optimizing MoveIt/MoveIt2 for robotic manipulation, including kinematics solvers, motion planners, and grasp planning pipelines.

## Capabilities

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

## Target Processes

- moveit-manipulation-planning.js
- trajectory-optimization.js
- robot-system-design.js

## Dependencies

- MoveIt/MoveIt2
- OMPL (Open Motion Planning Library)
- IK solvers (KDL, IKFast, TracIK)
- FCL (Flexible Collision Library)

## Usage Context

This skill is invoked when processes require manipulation planning, arm motion planning, pick-and-place operations, or any task involving MoveIt configuration and optimization.

## Output Artifacts

- MoveIt configuration packages
- SRDF robot semantic descriptions
- OMPL planner configurations
- Kinematics solver configurations
- Planning scene configurations
- Trajectory execution parameters
