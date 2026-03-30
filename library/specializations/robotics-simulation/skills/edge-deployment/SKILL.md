---
name: Edge Deployment Skill
description: ML model optimization and deployment on robot edge devices (Jetson, embedded)
slug: edge-deployment
category: Deployment
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Edge Deployment Skill

## Overview

Expert skill for optimizing and deploying machine learning models on robot edge devices including NVIDIA Jetson and embedded systems.

## Capabilities

- Configure TensorRT optimization for NVIDIA Jetson
- Set up ONNX model conversion and optimization
- Implement INT8 and FP16 quantization
- Configure DeepStream for video analytics
- Set up CUDA graph optimization
- Implement model pruning and distillation
- Configure DLA (Deep Learning Accelerator) deployment
- Set up multi-stream inference
- Implement ROS2 inference nodes
- Profile and benchmark on target hardware

## Target Processes

- nn-model-optimization.js
- object-detection-pipeline.js
- rl-robot-control.js
- field-testing-validation.js

## Dependencies

- TensorRT
- ONNX Runtime
- NVIDIA Jetson SDK
- DeepStream

## Usage Context

This skill is invoked when processes require deploying ML models on edge devices with optimized inference performance.

## Output Artifacts

- TensorRT engine files
- ONNX optimized models
- Quantization configurations
- DeepStream pipeline configs
- Inference benchmark reports
- ROS2 inference node implementations
