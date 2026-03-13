---
name: Motion Planning Skill
description: Sampling-based and optimization-based motion planning algorithms
slug: motion-planning
category: Planning
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Motion Planning Skill

## Overview

Expert skill for implementing and configuring motion planning algorithms, including sampling-based planners (OMPL) and optimization-based trajectory planners.

## Capabilities

- Configure OMPL planners (RRT, RRT*, RRT-Connect, PRM, FMT*)
- Implement hybrid A* for car-like robots
- Set up lattice-based planners
- Configure trajectory optimization (TrajOpt, CHOMP, STOMP)
- Implement time-optimal trajectory planning
- Set up path smoothing algorithms
- Configure state space and validity checking
- Implement kinodynamic planning
- Set up multi-query planning with roadmaps
- Configure asymptotically optimal planners

## Target Processes

- path-planning-algorithm.js
- trajectory-optimization.js
- moveit-manipulation-planning.js
- nav2-navigation-setup.js

## Dependencies

- OMPL (Open Motion Planning Library)
- MoveIt
- TrajOpt
- FCL (Flexible Collision Library)

## Usage Context

This skill is invoked when processes require path planning algorithm selection, trajectory optimization, or custom motion planning solutions.

## Output Artifacts

- OMPL planner configurations
- State space definitions
- Validity checker implementations
- Trajectory optimization setups
- Path smoothing configurations
- Planning benchmark results
