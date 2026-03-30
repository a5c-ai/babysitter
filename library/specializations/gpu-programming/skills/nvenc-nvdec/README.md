# NVENC/NVDEC Skill

## Overview

The `nvenc-nvdec` skill provides NVIDIA hardware video encoding and decoding integration for GPU-accelerated video processing.

## Quick Start

### Prerequisites

1. **Video Codec SDK 12.0+** - NVENC/NVDEC APIs
2. **CUDA Toolkit 11.0+** - GPU compute
3. **NVIDIA GPU** - With encoder/decoder hardware

### Installation

```bash
# Check NVENC support
nvidia-smi -q | grep Encoder

# FFmpeg with NVENC
ffmpeg -encoders | grep nvenc
```

## Usage

### Basic Operations

```bash
# Configure encoder
/skill nvenc-nvdec configure --codec h265 --preset p4 --bitrate 8M

# Decode video
/skill nvenc-nvdec decode --input video.mp4 --output frames/

# Transcode
/skill nvenc-nvdec transcode --input 4k.mp4 --output 1080p.mp4
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(nvencTask, {
  operation: 'encode',
  codec: 'HEVC',
  preset: 'P4',
  bitrate: 8000000,
  inputFormat: 'NV12'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **NVENC** | Hardware encoding |
| **NVDEC** | Hardware decoding |
| **Codecs** | H.264, H.265, AV1 |
| **CUDA Integration** | Frame processing |

## Supported Codecs

| Codec | Encode | Decode | Notes |
|-------|--------|--------|-------|
| H.264/AVC | All GPUs | All GPUs | Universal |
| H.265/HEVC | Pascal+ | Pascal+ | HDR support |
| AV1 | RTX 40+ | RTX 30+ | Latest |
| VP9 | - | Pascal+ | Decode only |

## FFmpeg Commands

```bash
# High quality encode
ffmpeg -hwaccel cuda -i input.mp4 -c:v h264_nvenc -preset p7 output.mp4

# Fast encode
ffmpeg -hwaccel cuda -i input.mp4 -c:v h264_nvenc -preset p1 output.mp4
```

## Process Integration

1. **gpu-image-video-processing.js** - Video workflows

## Related Skills

- **realtime-processing-expert** - Real-time agent
- **stencil-convolution** - Image processing

## References

- [Video Codec SDK](https://developer.nvidia.com/video-codec-sdk)
- [NVENC Programming Guide](https://docs.nvidia.com/video-technologies/video-codec-sdk/nvenc-video-encoder-api-prog-guide/)

---

**Backlog ID:** SK-014
**Category:** Video Processing
**Status:** Active
