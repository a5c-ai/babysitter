---
name: MPC Controller Skill
description: Expert skill for Model Predictive Control implementation and tuning
slug: mpc-controller
category: Control
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# MPC Controller Skill

## Overview

Expert skill for designing, implementing, and tuning Model Predictive Controllers for robotic systems, including both linear and nonlinear MPC.

## Capabilities

- Derive kinematic and dynamic robot models
- Formulate MPC optimization problems (QP, NLP)
- Configure CasADi for symbolic differentiation
- Set up ACADO code generation for real-time MPC
- Implement constraint handling (velocity, acceleration, collision)
- Configure cost function weights (tracking, control effort)
- Implement warm starting for fast convergence
- Set up NMPC for nonlinear systems
- Configure terminal constraints and costs
- Optimize solver parameters for real-time execution

## Target Processes

- mpc-controller-design.js
- trajectory-optimization.js
- dynamic-obstacle-avoidance.js
- path-planning-algorithm.js

## Dependencies

- CasADi
- ACADO Toolkit
- OSQP
- qpOASES
- Ipopt

## Usage Context

This skill is invoked when processes require advanced model-based control, trajectory tracking with constraints, or real-time optimization-based control strategies.

## Output Artifacts

- MPC formulation code
- CasADi symbolic models
- ACADO generated code
- QP/NLP solver configurations
- Cost function tuning parameters
- Constraint specifications
