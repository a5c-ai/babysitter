---
name: Kinematics/Dynamics Skill
description: Robot kinematics and dynamics computation including forward/inverse kinematics and dynamics
slug: kinematics-dynamics
category: Control
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Kinematics/Dynamics Skill

## Overview

Expert skill for computing robot kinematics and dynamics, including forward/inverse kinematics, Jacobians, and dynamic equations of motion.

## Capabilities

- Implement forward kinematics from DH parameters
- Set up analytical and numerical inverse kinematics
- Compute Jacobian matrices for velocity kinematics
- Implement forward and inverse dynamics
- Configure mass matrix and Coriolis computation
- Set up gravity compensation
- Implement singularity detection and avoidance
- Configure workspace analysis and limits
- Set up force/torque sensor integration
- Implement impedance and admittance control

## Target Processes

- robot-system-design.js
- moveit-manipulation-planning.js
- mpc-controller-design.js
- robot-calibration.js

## Dependencies

- KDL (Kinematics and Dynamics Library)
- Pinocchio
- RBDL (Rigid Body Dynamics Library)
- Eigen

## Usage Context

This skill is invoked when processes require kinematic chain analysis, dynamics computation, Jacobian-based control, or force/torque control implementations.

## Output Artifacts

- DH parameter configurations
- Kinematics solver implementations
- Dynamics model code
- Jacobian computation routines
- Singularity analysis reports
- Impedance controller configurations
