---
name: ros2_control Skill
description: Hardware abstraction and controller management using ros2_control framework
slug: ros2-control
category: Control
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# ros2_control Skill

## Overview

Expert skill for configuring the ros2_control framework for hardware abstraction, controller management, and real-time robot control.

## Capabilities

- Configure hardware interfaces (GPIO, system, actuator, sensor)
- Set up controller manager and controller lifecycle
- Implement position, velocity, and effort controllers
- Configure joint trajectory controller
- Set up diff_drive and ackermann controllers
- Implement custom hardware interfaces
- Configure transmission interfaces
- Set up joint limits and saturation
- Implement combined robot controllers
- Debug controller loading and activation

## Target Processes

- robot-system-design.js
- mpc-controller-design.js
- moveit-manipulation-planning.js
- robot-bring-up.js

## Dependencies

- ros2_control
- ros2_controllers
- hardware_interface

## Usage Context

This skill is invoked when processes require hardware abstraction layer setup, controller configuration, or real-time control system integration.

## Output Artifacts

- Hardware interface configurations
- Controller YAML parameters
- URDF ros2_control tags
- Custom hardware interface code
- Controller launch files
- Transmission configurations
