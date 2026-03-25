# Perception Engineer Agent

## Overview

The `perception-engineer` agent is a specialized AI agent embodying the expertise of a Senior Perception Engineer. It provides deep knowledge for robot perception including SLAM, object detection, point cloud processing, sensor fusion, and deep learning model deployment.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Perception Engineer |
| **Experience** | 10+ years computer vision/robotics |
| **Background** | Autonomous vehicles, warehouse robots, drones |
| **Publications** | SLAM, object detection, sensor fusion |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Visual SLAM** | ORB-SLAM3, RTAB-Map, VIO tuning |
| **LiDAR SLAM** | Cartographer, LIO-SAM, SLAM Toolbox |
| **Sensor Fusion** | EKF/UKF, factor graphs, IMU integration |
| **Object Detection** | YOLO, Detectron2, 3D detection |
| **Point Cloud** | Filtering, segmentation, registration |
| **Calibration** | Intrinsic, stereo, camera-LiDAR |
| **Edge Deployment** | TensorRT, ONNX, Jetson optimization |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(perceptionEngineerTask, {
  agentName: 'perception-engineer',
  prompt: {
    role: 'Senior Perception Engineer',
    task: 'Design perception pipeline for warehouse robot',
    context: {
      robot: 'AGV',
      sensors: ['rgbd_camera', 'lidar_2d', 'imu'],
      requirements: {
        localization_accuracy: 0.05,  // meters
        detection_classes: ['person', 'forklift', 'pallet'],
        real_time: true
      }
    },
    instructions: [
      'Recommend SLAM algorithm',
      'Design object detection pipeline',
      'Configure sensor fusion',
      'Optimize for edge deployment',
      'Define evaluation metrics'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# SLAM algorithm selection
/agent perception-engineer select-slam \
  --sensors "rgbd,imu" \
  --environment warehouse \
  --accuracy-requirement 0.05

# Detection pipeline design
/agent perception-engineer design-detection \
  --classes "person,forklift,pallet" \
  --platform jetson_orin \
  --latency-requirement 50ms

# Diagnose perception issues
/agent perception-engineer diagnose \
  --issue "high_slam_drift" \
  --metrics ate_rmse=0.45,tracking_loss=0.08
```

## Common Tasks

### 1. SLAM Configuration

```bash
/agent perception-engineer configure-slam \
  --algorithm rtabmap \
  --sensors "rgbd,lidar_2d,imu" \
  --environment indoor_warehouse \
  --output config/slam_params.yaml
```

Output includes:
- Algorithm parameters optimized for environment
- Sensor configuration
- Loop closure settings
- Performance expectations

### 2. Sensor Fusion Setup

```bash
/agent perception-engineer setup-fusion \
  --sensors "imu:200hz,wheel_odom:50hz,visual_odom:30hz" \
  --filter-type ekf \
  --two-stage true \
  --output config/localization.yaml
```

Provides:
- Filter configuration
- Noise covariance tuning
- Sensor fusion architecture
- Outlier rejection settings

### 3. Detection Model Optimization

```bash
/agent perception-engineer optimize-detection \
  --model yolov8m \
  --target jetson_orin \
  --precision fp16 \
  --target-fps 30
```

Delivers:
- TensorRT conversion steps
- Quantization recommendations
- Benchmark results
- Deployment code

### 4. Calibration Procedures

```bash
/agent perception-engineer calibration-guide \
  --sensors "stereo_camera,lidar" \
  --calibration-type extrinsic \
  --output calibration_procedure.md
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `visual-slam-implementation.js` | SLAM configuration |
| `lidar-mapping-localization.js` | LiDAR SLAM setup |
| `object-detection-pipeline.js` | Detection deployment |
| `sensor-fusion-framework.js` | Fusion architecture |
| `robot-calibration.js` | Calibration guidance |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const perceptionSetupTask = defineTask({
  name: 'perception-setup',
  description: 'Setup robot perception system',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Configure Perception System',
      agent: {
        name: 'perception-engineer',
        prompt: {
          role: 'Senior Perception Engineer',
          task: 'Configure complete perception system',
          context: {
            sensors: inputs.sensors,
            requirements: inputs.requirements,
            computePlatform: inputs.platform
          },
          instructions: [
            'Select and configure SLAM algorithm',
            'Design sensor fusion architecture',
            'Setup object detection pipeline',
            'Define calibration procedures',
            'Create evaluation benchmarks'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['slam_config', 'fusion_config', 'detection_config'],
          properties: {
            slam_config: { type: 'object' },
            fusion_config: { type: 'object' },
            detection_config: { type: 'object' },
            calibration_procedures: { type: 'array' }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Knowledge Base

### SLAM Algorithm Reference

| Algorithm | Sensors | Real-Time | Best For |
|-----------|---------|-----------|----------|
| ORB-SLAM3 | Mono/Stereo/RGBD+IMU | Yes | Research, accuracy |
| RTAB-Map | RGBD/Stereo/LiDAR | Yes | Production, multi-sensor |
| Cartographer | LiDAR+IMU | Yes | Large-scale |
| LIO-SAM | LiDAR+IMU | Yes | Outdoor, high-speed |
| SLAM Toolbox | 2D LiDAR | Yes | Indoor mobile |

### Detection Model Reference

| Model | Speed | Accuracy | Platform |
|-------|-------|----------|----------|
| YOLOv8n | Fast | Good | Edge |
| YOLOv8m | Medium | Better | Jetson |
| YOLOv8l | Slow | Best | GPU server |
| PointPillars | Fast | Good | LiDAR 3D |

### Accuracy Metrics

| Metric | Description | Good Value |
|--------|-------------|------------|
| ATE RMSE | Absolute trajectory error | < 0.1m |
| RPE | Relative pose error | < 1% |
| mAP@50 | Detection accuracy | > 0.8 |
| Latency | Processing time | < 100ms |

## Debugging Decision Tree

```
SLAM Issue
├── Tracking Loss
│   ├── Fast motion → Add IMU, increase features
│   ├── Poor lighting → Adjust exposure, use LiDAR
│   └── Texture-poor → Lower FAST threshold, use LiDAR
├── High Drift
│   ├── No loop closure → Lower threshold, extend radius
│   ├── Scale drift → Use stereo/depth/IMU
│   └── Bad calibration → Recalibrate camera
└── Wrong Scale
    ├── Monocular → Use depth/stereo
    └── Stereo → Check baseline calibration

Detection Issue
├── False Positives
│   ├── Increase confidence threshold
│   └── Add class-specific rules
├── False Negatives
│   ├── Lower confidence threshold
│   ├── Retrain on domain data
│   └── Check input preprocessing
└── Slow Inference
    ├── Use smaller model
    ├── Apply TensorRT optimization
    └── Reduce input resolution
```

## Interaction Guidelines

### What to Expect

- **Data-driven analysis** with specific metrics and thresholds
- **Practical solutions** considering deployment constraints
- **Code examples** for implementation
- **Evaluation procedures** for validation

### Best Practices

1. Provide sensor specifications and configurations
2. Include environment description (indoor/outdoor, lighting)
3. Specify compute platform and constraints
4. Share accuracy requirements and metrics
5. Describe any observed issues with data

## Related Resources

- [slam-algorithms skill](../../skills/slam-algorithms/) - SLAM configuration
- [sensor-fusion skill](../../skills/sensor-fusion/) - Fusion setup
- [robotics-architect agent](../robotics-architect/) - System architecture

## References

- [ORB-SLAM3](https://github.com/UZ-SLAMLab/ORB_SLAM3)
- [RTAB-Map](http://introlab.github.io/rtabmap/)
- [Open3D](http://www.open3d.org/)
- [OpenCV](https://opencv.org/)
- [TensorRT](https://developer.nvidia.com/tensorrt)
- [VisionCraft MCP Server](https://github.com/augmentedstartups/VisionCraft-MCP-Server)
- [OpenCV MCP Server](https://github.com/GongRzhe/opencv-mcp-server)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-002
**Category:** Perception
**Status:** Active
