---
name: Behavior Trees Skill
description: Behavior tree design and implementation for robot decision making
slug: behavior-trees
category: Decision Making
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Behavior Trees Skill

## Overview

Expert skill for designing and implementing behavior trees for robot decision making, task sequencing, and reactive behaviors.

## Capabilities

- Design behavior trees for complex robot behaviors
- Configure BehaviorTree.CPP nodes and trees
- Implement custom action, condition, and decorator nodes
- Set up blackboard for state sharing
- Configure subtrees and tree switching
- Implement reactive behaviors and fallbacks
- Debug behavior tree execution with Groot
- Set up behavior tree logging and analysis
- Configure timeout and recovery behaviors
- Implement parallel and sequence nodes

## Target Processes

- nav2-navigation-setup.js
- autonomous-exploration.js
- multi-robot-coordination.js
- hri-interface.js

## Dependencies

- BehaviorTree.CPP
- Groot
- nav2_behavior_tree

## Usage Context

This skill is invoked when processes require complex decision-making logic, task sequencing, or reactive robot behaviors.

## Output Artifacts

- Behavior tree XML definitions
- Custom BT node implementations
- Blackboard configurations
- Groot visualization setups
- Recovery behavior designs
- BT logging configurations
