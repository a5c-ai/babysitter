---
name: nvenc-nvdec
description: NVIDIA hardware video encoding/decoding integration. Configure NVENC encoding parameters, set up NVDEC decoding pipelines, handle codec configurations, integrate with CUDA for pre/post processing, and manage video memory surfaces.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: video-processing
  backlog-id: SK-014
---

# nvenc-nvdec

You are **nvenc-nvdec** - a specialized skill for NVIDIA hardware video encoding and decoding integration. This skill provides expert capabilities for GPU-accelerated video processing.

## Overview

This skill enables AI-powered video processing including:
- Configure NVENC encoding parameters
- Set up NVDEC decoding pipelines
- Handle codec configurations (H.264, H.265, AV1)
- Integrate with CUDA for pre/post processing
- Manage video memory surfaces
- Profile encode/decode performance
- Handle multi-stream encoding
- Support B-frame and lookahead configuration

## Prerequisites

- NVIDIA GPU with NVENC/NVDEC support
- Video Codec SDK 12.0+
- CUDA Toolkit 11.0+
- FFmpeg with NVENC support (optional)

## Capabilities

### 1. NVENC Encoder Setup

Initialize hardware encoder:

```c
#include <nvEncodeAPI.h>

// Create encoder instance
NV_ENCODE_API_FUNCTION_LIST nvenc = {NV_ENCODE_API_FUNCTION_LIST_VER};
NvEncodeAPICreateInstance(&nvenc);

void* encoder = NULL;
NV_ENC_OPEN_ENCODE_SESSION_EX_PARAMS sessionParams = {
    NV_ENC_OPEN_ENCODE_SESSION_EX_PARAMS_VER};
sessionParams.device = cudaDevice;
sessionParams.deviceType = NV_ENC_DEVICE_TYPE_CUDA;
sessionParams.apiVersion = NVENCAPI_VERSION;

nvenc.nvEncOpenEncodeSessionEx(&sessionParams, &encoder);

// Query encoder capabilities
NV_ENC_CAPS_PARAM capsParam = {NV_ENC_CAPS_PARAM_VER};
capsParam.capsToQuery = NV_ENC_CAPS_SUPPORTED_RATECONTROL_MODES;
int capsVal;
nvenc.nvEncGetEncodeCaps(encoder, NV_ENC_CODEC_H264_GUID, &capsParam, &capsVal);
```

### 2. Encoding Configuration

Configure encoder parameters:

```c
// Initialize encoder configuration
NV_ENC_INITIALIZE_PARAMS initParams = {NV_ENC_INITIALIZE_PARAMS_VER};
NV_ENC_CONFIG encodeConfig = {NV_ENC_CONFIG_VER};
initParams.encodeConfig = &encodeConfig;

// Get preset configuration
NV_ENC_PRESET_CONFIG presetConfig = {NV_ENC_PRESET_CONFIG_VER};
presetConfig.presetCfg = {NV_ENC_CONFIG_VER};
nvenc.nvEncGetEncodePresetConfigEx(encoder,
    NV_ENC_CODEC_H264_GUID,
    NV_ENC_PRESET_P4_GUID,  // Balanced preset
    NV_ENC_TUNING_INFO_HIGH_QUALITY,
    &presetConfig);

memcpy(&encodeConfig, &presetConfig.presetCfg, sizeof(NV_ENC_CONFIG));

// Set basic parameters
initParams.encodeGUID = NV_ENC_CODEC_H264_GUID;
initParams.presetGUID = NV_ENC_PRESET_P4_GUID;
initParams.encodeWidth = 1920;
initParams.encodeHeight = 1080;
initParams.frameRateNum = 60;
initParams.frameRateDen = 1;
initParams.enablePTD = 1;  // Enable picture type decision

// Rate control
encodeConfig.rcParams.rateControlMode = NV_ENC_PARAMS_RC_VBR;
encodeConfig.rcParams.averageBitRate = 8000000;  // 8 Mbps
encodeConfig.rcParams.maxBitRate = 12000000;     // 12 Mbps max

// B-frames and lookahead
encodeConfig.frameIntervalP = 3;  // I/P frame interval
encodeConfig.rcParams.lookaheadDepth = 20;
encodeConfig.rcParams.enableLookahead = 1;

// Initialize encoder
nvenc.nvEncInitializeEncoder(encoder, &initParams);
```

### 3. HEVC/H.265 Configuration

Setup HEVC encoding:

```c
// HEVC-specific configuration
initParams.encodeGUID = NV_ENC_CODEC_HEVC_GUID;

NV_ENC_CONFIG_HEVC* hevcConfig = &encodeConfig.encodeCodecConfig.hevcConfig;
hevcConfig->chromaFormatIDC = 1;  // 4:2:0
hevcConfig->pixelBitDepthMinus8 = 0;  // 8-bit
hevcConfig->idrPeriod = encodeConfig.gopLength;
hevcConfig->enableIntraRefresh = 0;
hevcConfig->maxCUSize = NV_ENC_HEVC_CUSIZE_32x32;
hevcConfig->minCUSize = NV_ENC_HEVC_CUSIZE_8x8;

// 10-bit HDR
hevcConfig->pixelBitDepthMinus8 = 2;  // 10-bit
hevcConfig->chromaFormatIDC = 1;

// Tier and level
hevcConfig->tier = NV_ENC_TIER_HEVC_MAIN;
hevcConfig->level = NV_ENC_LEVEL_HEVC_51;
```

### 4. NVDEC Decoder Setup

Initialize hardware decoder:

```c
#include <nvcuvid.h>

// Create CUDA video parser
CUVIDPARSERPARAMS parserParams = {};
parserParams.CodecType = cudaVideoCodec_H264;
parserParams.ulMaxNumDecodeSurfaces = 4;
parserParams.ulMaxDisplayDelay = 2;
parserParams.pUserData = this;
parserParams.pfnSequenceCallback = HandleVideoSequence;
parserParams.pfnDecodePicture = HandlePictureDecode;
parserParams.pfnDisplayPicture = HandlePictureDisplay;

CUvideoparser parser;
cuvidCreateVideoParser(&parser, &parserParams);

// Sequence callback - create decoder
int HandleVideoSequence(void* userData, CUVIDEOFORMAT* format) {
    CUVIDDECODECREATEINFO createInfo = {};
    createInfo.CodecType = format->codec;
    createInfo.ulWidth = format->coded_width;
    createInfo.ulHeight = format->coded_height;
    createInfo.ulNumDecodeSurfaces = 8;
    createInfo.ChromaFormat = format->chroma_format;
    createInfo.OutputFormat = cudaVideoSurfaceFormat_NV12;
    createInfo.DeinterlaceMode = cudaVideoDeinterlaceMode_Adaptive;
    createInfo.ulTargetWidth = format->display_area.right;
    createInfo.ulTargetHeight = format->display_area.bottom;
    createInfo.ulNumOutputSurfaces = 2;

    CUvideodecoder decoder;
    cuvidCreateDecoder(&decoder, &createInfo);

    return 1;  // Return number of decode surfaces
}
```

### 5. CUDA Integration

Process video frames with CUDA:

```c
// Map decoded frame to CUDA
CUVIDPROCPARAMS procParams = {};
procParams.progressive_frame = 1;
procParams.output_stream = cudaStream;

unsigned int pitch;
CUdeviceptr framePtr;
cuvidMapVideoFrame(decoder, pictureIndex, &framePtr, &pitch, &procParams);

// Process with CUDA kernel
processFrameKernel<<<blocks, threads, 0, cudaStream>>>(
    (unsigned char*)framePtr, pitch, width, height);

// Unmap
cuvidUnmapVideoFrame(decoder, framePtr);

// For encoding: register CUDA resource
NV_ENC_REGISTER_RESOURCE registerResource = {NV_ENC_REGISTER_RESOURCE_VER};
registerResource.resourceType = NV_ENC_INPUT_RESOURCE_TYPE_CUDADEVICEPTR;
registerResource.resourceToRegister = (void*)cudaFrame;
registerResource.width = width;
registerResource.height = height;
registerResource.pitch = pitch;
registerResource.bufferFormat = NV_ENC_BUFFER_FORMAT_NV12;
registerResource.bufferUsage = NV_ENC_INPUT_IMAGE;

nvenc.nvEncRegisterResource(encoder, &registerResource);
```

### 6. Encode Frame

Submit frames for encoding:

```c
// Map input buffer
NV_ENC_MAP_INPUT_RESOURCE mapInput = {NV_ENC_MAP_INPUT_RESOURCE_VER};
mapInput.registeredResource = registeredResource;
nvenc.nvEncMapInputResource(encoder, &mapInput);

// Configure picture parameters
NV_ENC_PIC_PARAMS picParams = {NV_ENC_PIC_PARAMS_VER};
picParams.inputBuffer = mapInput.mappedResource;
picParams.bufferFmt = mapInput.mappedBufferFmt;
picParams.inputWidth = width;
picParams.inputHeight = height;
picParams.outputBitstream = bitstreamBuffer;
picParams.pictureStruct = NV_ENC_PIC_STRUCT_FRAME;
picParams.inputTimeStamp = frameNumber;

// Encode
nvenc.nvEncEncodePicture(encoder, &picParams);

// Lock and retrieve bitstream
NV_ENC_LOCK_BITSTREAM lockBitstream = {NV_ENC_LOCK_BITSTREAM_VER};
lockBitstream.outputBitstream = bitstreamBuffer;
nvenc.nvEncLockBitstream(encoder, &lockBitstream);

// Copy encoded data
memcpy(outputBuffer, lockBitstream.bitstreamBufferPtr,
       lockBitstream.bitstreamSizeInBytes);

nvenc.nvEncUnlockBitstream(encoder, bitstreamBuffer);
nvenc.nvEncUnmapInputResource(encoder, mapInput.mappedResource);
```

### 7. Multi-Stream Encoding

Handle multiple encode sessions:

```c
// Query max encode sessions
NV_ENC_CAPS_PARAM capsParam = {NV_ENC_CAPS_PARAM_VER};
capsParam.capsToQuery = NV_ENC_CAPS_NUM_MAX_TEMPORAL_LAYERS;

// Create multiple encoders for concurrent encoding
std::vector<void*> encoders(numStreams);
for (int i = 0; i < numStreams; i++) {
    NV_ENC_OPEN_ENCODE_SESSION_EX_PARAMS sessionParams = {
        NV_ENC_OPEN_ENCODE_SESSION_EX_PARAMS_VER};
    sessionParams.device = cudaDevice;
    sessionParams.deviceType = NV_ENC_DEVICE_TYPE_CUDA;
    nvenc.nvEncOpenEncodeSessionEx(&sessionParams, &encoders[i]);
}

// Encode streams in parallel using CUDA streams
for (int i = 0; i < numStreams; i++) {
    // Each encoder uses its own CUDA stream
    cudaStreamCreate(&streams[i]);
    // Submit frames asynchronously
}
```

### 8. FFmpeg Integration

Use NVENC with FFmpeg:

```bash
# Encode with NVENC
ffmpeg -hwaccel cuda -hwaccel_output_format cuda \
    -i input.mp4 \
    -c:v h264_nvenc \
    -preset p4 \
    -tune hq \
    -rc vbr \
    -b:v 8M \
    -maxrate 12M \
    -bufsize 16M \
    output.mp4

# HEVC encoding
ffmpeg -hwaccel cuda -i input.mp4 \
    -c:v hevc_nvenc \
    -preset p7 \
    -rc constqp \
    -qp 23 \
    output_hevc.mp4

# Decode with NVDEC, process, encode with NVENC
ffmpeg -hwaccel cuda -hwaccel_output_format cuda \
    -i input.mp4 \
    -vf "scale_cuda=1280:720" \
    -c:v h264_nvenc \
    output_720p.mp4

# AV1 encoding (RTX 40 series)
ffmpeg -hwaccel cuda -i input.mp4 \
    -c:v av1_nvenc \
    -preset p4 \
    -b:v 5M \
    output_av1.mp4
```

## Process Integration

This skill integrates with the following processes:
- `gpu-image-video-processing.js` - Video processing workflows

## Output Format

```json
{
  "operation": "encode-session",
  "status": "success",
  "configuration": {
    "codec": "H.265/HEVC",
    "resolution": "1920x1080",
    "framerate": 60,
    "bitrate_mbps": 8,
    "preset": "P4",
    "rc_mode": "VBR"
  },
  "performance": {
    "fps": 245,
    "latency_ms": 4.1,
    "gpu_utilization_pct": 35
  },
  "output": {
    "format": "HEVC",
    "file": "output.hevc",
    "size_mb": 125.4
  }
}
```

## Dependencies

- Video Codec SDK 12.0+
- CUDA Toolkit 11.0+
- FFmpeg (optional)

## Constraints

- NVENC sessions limited per GPU (check nvidia-smi)
- Some presets not available on all GPUs
- AV1 requires RTX 40 series or newer
- B-frame count limited by hardware
