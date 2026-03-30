---
name: Point Cloud Processing Skill
description: Specialized skill for 3D point cloud processing and analysis using PCL and Open3D
slug: point-cloud-processing
category: Perception
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Point Cloud Processing Skill

## Overview

Expert skill for processing, analyzing, and manipulating 3D point cloud data using PCL (Point Cloud Library) and Open3D.

## Capabilities

- Implement point cloud filtering (voxel grid, statistical outlier, passthrough)
- Configure ground plane segmentation (RANSAC, SAC)
- Implement clustering algorithms (Euclidean, DBSCAN)
- Set up surface reconstruction (Poisson, ball pivoting)
- Configure feature extraction (FPFH, SHOT, PFH)
- Implement registration algorithms (ICP, NDT, GICP)
- Set up octree and KD-tree spatial indexing
- Process organized and unorganized point clouds
- Implement point cloud downsampling strategies
- Configure LiDAR-camera fusion

## Target Processes

- lidar-mapping-localization.js
- object-detection-pipeline.js
- sensor-fusion-framework.js
- synthetic-data-pipeline.js

## Dependencies

- PCL (Point Cloud Library)
- Open3D
- pcl_ros
- laser_geometry

## Usage Context

This skill is invoked when processes require 3D point cloud manipulation, LiDAR data processing, surface reconstruction, or point cloud registration tasks.

## Output Artifacts

- Point cloud processing pipelines
- Filter chain configurations
- Registration parameters
- Segmentation algorithms
- Feature extraction configurations
- Fusion pipeline code
