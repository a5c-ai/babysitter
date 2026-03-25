# Real-Time Processing Expert Agent

## Overview

The `realtime-processing-expert` agent embodies the expertise of a Real-Time GPU Systems Engineer specializing in video and image processing pipelines. It provides guidance on latency optimization, NVENC/NVDEC integration, multi-stream processing, and computer vision on GPU.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Real-Time GPU Systems Engineer |
| **Experience** | 7+ years in video/image processing |
| **Background** | Computer vision, streaming media |
| **Philosophy** | "Every millisecond counts" |

## Core Principles

1. **Deterministic Timing** - Bounded, predictable latency
2. **Pipeline Efficiency** - Maximize throughput within deadlines
3. **Zero-Copy** - Minimize memory transfers
4. **Hardware Acceleration** - Leverage NVENC/NVDEC
5. **Graceful Degradation** - Handle overload gracefully
6. **End-to-End** - Optimize the full pipeline

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Real-Time Design** | Latency budgets, deadline management |
| **Image Processing** | Optimized kernels, NPP integration |
| **Video Codecs** | NVENC/NVDEC pipelines |
| **Frame Processing** | Multi-stage pipeline design |
| **Multi-Stream** | Parallel camera/video processing |
| **Computer Vision** | Detection, tracking on GPU |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(realtimeProcessingTask, {
  agentName: 'realtime-processing-expert',
  prompt: {
    role: 'Real-Time GPU Systems Engineer',
    task: 'Design low-latency video analytics pipeline',
    context: {
      inputResolution: '1920x1080',
      targetFps: 30,
      processingSteps: ['decode', 'detection', 'tracking', 'encode'],
      latencyBudget: '33ms'
    },
    instructions: [
      'Design pipeline architecture',
      'Allocate latency budget',
      'Recommend hardware utilization',
      'Identify optimization opportunities'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Design video pipeline
/agent realtime-processing-expert design-pipeline \
  --input 1080p@30fps \
  --processing "decode,detection,encode" \
  --latency-target 33ms

# Optimize existing pipeline
/agent realtime-processing-expert optimize \
  --profile profile_data.json \
  --bottleneck inference

# Multi-stream configuration
/agent realtime-processing-expert multi-stream \
  --cameras 4 \
  --resolution 720p \
  --fps 30
```

## Common Tasks

### 1. Pipeline Design

```bash
/agent realtime-processing-expert design-pipeline \
  --stages "decode,preprocess,inference,postprocess,encode" \
  --input-spec "h264,1080p,30fps" \
  --latency-budget 50ms
```

Provides:
- Stage-by-stage latency allocation
- Buffer configuration
- Stream parallelism design
- Hardware utilization plan

### 2. Latency Optimization

```bash
/agent realtime-processing-expert optimize-latency \
  --profile pipeline_profile.json \
  --target-reduction 30%
```

Provides:
- Bottleneck identification
- Optimization recommendations
- Expected improvements
- Implementation priorities

### 3. NVENC/NVDEC Integration

```bash
/agent realtime-processing-expert codec-integration \
  --input h264 \
  --output h265 \
  --processing "resize,inference"
```

Provides:
- Decoder configuration
- Encoder settings
- Zero-copy data flow
- Quality/latency tradeoffs

### 4. Multi-Camera Processing

```bash
/agent realtime-processing-expert multi-camera \
  --num-cameras 8 \
  --resolution 1080p \
  --fps 30 \
  --processing detection
```

Provides:
- Stream allocation strategy
- GPU resource distribution
- Priority management
- Scaling recommendations

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `gpu-image-video-processing.js` | All processing phases |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const designVideoPipelineTask = defineTask({
  name: 'design-video-pipeline',
  description: 'Design real-time video processing pipeline',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Design pipeline for ${inputs.application}`,
      agent: {
        name: 'realtime-processing-expert',
        prompt: {
          role: 'Real-Time GPU Systems Engineer',
          task: 'Design optimized video processing pipeline',
          context: {
            inputSpec: inputs.inputSpec,
            processingRequirements: inputs.requirements,
            latencyBudget: inputs.latencyBudget,
            hardwareTarget: inputs.gpu
          },
          instructions: [
            'Analyze input requirements',
            'Design pipeline stages',
            'Allocate latency budget',
            'Recommend buffer configuration',
            'Identify hardware acceleration opportunities'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['pipeline', 'latencyBudget', 'recommendations'],
          properties: {
            pipeline: { type: 'object' },
            latencyBudget: { type: 'object' },
            recommendations: { type: 'array' }
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

## Real-Time Reference

### Latency Budget Template

| Stage | Typical Budget | Notes |
|-------|----------------|-------|
| Decode (HW) | 2-5 ms | NVDEC dedicated |
| Preprocess | 1-3 ms | Resize, normalize |
| Inference | 5-20 ms | Model dependent |
| Postprocess | 1-3 ms | NMS, overlay |
| Encode (HW) | 3-8 ms | NVENC dedicated |
| Transfer | 1-3 ms | PCIe overhead |
| **Total (30fps)** | **<33 ms** | With margin |

### Hardware Acceleration

| Component | Dedicated HW | Benefit |
|-----------|--------------|---------|
| Video Decode | NVDEC | Frees GPU compute |
| Video Encode | NVENC | Frees GPU compute |
| JPEG Decode | NVJPEG | Accelerated decode |
| Image Processing | NPP | Optimized primitives |

### Pipeline Strategies

| Strategy | Latency | Throughput | Use Case |
|----------|---------|------------|----------|
| Sequential | Highest | Lowest | Simple apps |
| Double Buffer | Medium | Medium | Balanced |
| Triple Buffer | Lowest | Highest | Max throughput |
| Multi-Stream | Variable | Highest | Multi-camera |

## Interaction Guidelines

### What to Expect

- **Deadline-aware** recommendations
- **Full pipeline** analysis
- **Hardware-optimized** solutions
- **Production-ready** configurations

### Best Practices

1. Specify exact latency requirements
2. Describe input specifications
3. List all processing stages
4. Mention hardware constraints
5. Describe load characteristics

## Related Resources

- [stencil-convolution skill](../skills/stencil-convolution/) - Image kernels
- [cuda-graphs skill](../skills/cuda-graphs/) - Pipeline optimization
- [gpu-benchmarking skill](../skills/gpu-benchmarking/) - Latency measurement

## References

- [NVIDIA Video Codec SDK](https://developer.nvidia.com/nvidia-video-codec-sdk)
- [NVIDIA Performance Primitives (NPP)](https://developer.nvidia.com/npp)
- [DeepStream SDK](https://developer.nvidia.com/deepstream-sdk)
- [NVIDIA Multimedia API](https://docs.nvidia.com/jetson/l4t-multimedia/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-011
**Category:** Real-Time Systems
**Status:** Active
