---
name: Reinforcement Learning Skill
description: RL training for robot control using simulation with sim-to-real transfer
slug: rl-robotics
category: Learning
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Reinforcement Learning Skill

## Overview

Expert skill for training reinforcement learning agents for robot control tasks, including environment design, training pipelines, and sim-to-real transfer.

## Capabilities

- Configure Gym/Gymnasium environments for robots
- Set up Stable Baselines3 training (PPO, SAC, TD3)
- Implement custom observation and action spaces
- Design reward shaping strategies
- Configure parallel environment training
- Implement domain randomization for sim-to-real
- Set up curriculum learning
- Configure vision-based RL with CNNs
- Implement policy distillation
- Export policies for deployment (ONNX, TorchScript)

## Target Processes

- rl-robot-control.js
- imitation-learning.js
- sim-to-real-validation.js
- nn-model-optimization.js

## Dependencies

- Stable Baselines3
- Gymnasium
- Isaac Gym
- rsl_rl

## Usage Context

This skill is invoked when processes require RL-based robot control, learning from simulation, or transferring learned policies to real robots.

## Output Artifacts

- Gymnasium environment implementations
- Training configurations
- Reward function designs
- Domain randomization configs
- Trained policy checkpoints
- Deployment-ready models (ONNX)
