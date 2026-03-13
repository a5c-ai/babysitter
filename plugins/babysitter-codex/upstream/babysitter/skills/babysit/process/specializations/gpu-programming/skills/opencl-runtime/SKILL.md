---
name: opencl-runtime
description: Cross-vendor OpenCL runtime management and kernel development. Query platforms/devices, generate portable OpenCL C kernel code, handle vendor-specific extensions, manage contexts and command queues, compile and cache programs.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: opencl-development
  backlog-id: SK-003
---

# opencl-runtime

You are **opencl-runtime** - a specialized skill for cross-vendor OpenCL runtime management and kernel development. This skill provides expert capabilities for portable GPU programming across NVIDIA, AMD, and Intel platforms.

## Overview

This skill enables AI-powered OpenCL development operations including:
- Query and enumerate OpenCL platforms/devices
- Generate portable OpenCL C kernel code
- Handle vendor-specific extensions and workarounds
- Manage OpenCL contexts and command queues
- Compile and cache OpenCL programs/binaries
- Configure NDRange and work-group dimensions
- Validate OpenCL memory object usage
- Support OpenCL 1.2, 2.0, and 3.0 specifications

## Prerequisites

- OpenCL SDK (NVIDIA, AMD, or Intel)
- OpenCL ICD Loader
- OpenCL-capable GPU or CPU
- clinfo utility (for device enumeration)

## Capabilities

### 1. Platform and Device Enumeration

Query available OpenCL resources:

```c
// Query platforms
cl_uint numPlatforms;
clGetPlatformIDs(0, NULL, &numPlatforms);
cl_platform_id* platforms = malloc(numPlatforms * sizeof(cl_platform_id));
clGetPlatformIDs(numPlatforms, platforms, NULL);

// Get platform info
char platformName[128];
clGetPlatformInfo(platforms[0], CL_PLATFORM_NAME, 128, platformName, NULL);

// Query devices
cl_uint numDevices;
clGetDeviceIDs(platforms[0], CL_DEVICE_TYPE_GPU, 0, NULL, &numDevices);
cl_device_id* devices = malloc(numDevices * sizeof(cl_device_id));
clGetDeviceIDs(platforms[0], CL_DEVICE_TYPE_GPU, numDevices, devices, NULL);
```

```bash
# Using clinfo utility
clinfo --list

# Detailed device info
clinfo -a
```

### 2. OpenCL Kernel Code Generation

Generate portable kernels:

```opencl
// Basic kernel pattern
__kernel void vectorAdd(
    __global const float* a,
    __global const float* b,
    __global float* c,
    const int n)
{
    int gid = get_global_id(0);
    if (gid < n) {
        c[gid] = a[gid] + b[gid];
    }
}

// 2D kernel pattern
__kernel void matrixMultiply(
    __global const float* A,
    __global const float* B,
    __global float* C,
    const int M, const int N, const int K)
{
    int row = get_global_id(0);
    int col = get_global_id(1);

    if (row < M && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < K; k++) {
            sum += A[row * K + k] * B[k * N + col];
        }
        C[row * N + col] = sum;
    }
}

// Shared memory (local memory) kernel
__kernel void reductionSum(
    __global const float* input,
    __global float* output,
    __local float* localData,
    const int n)
{
    int gid = get_global_id(0);
    int lid = get_local_id(0);
    int groupSize = get_local_size(0);

    localData[lid] = (gid < n) ? input[gid] : 0.0f;
    barrier(CLK_LOCAL_MEM_FENCE);

    for (int stride = groupSize / 2; stride > 0; stride >>= 1) {
        if (lid < stride) {
            localData[lid] += localData[lid + stride];
        }
        barrier(CLK_LOCAL_MEM_FENCE);
    }

    if (lid == 0) {
        output[get_group_id(0)] = localData[0];
    }
}
```

### 3. Context and Command Queue Management

Create and manage OpenCL contexts:

```c
// Create context
cl_context context = clCreateContext(NULL, 1, &device, NULL, NULL, &err);

// Create command queue (OpenCL 1.x)
cl_command_queue queue = clCreateCommandQueue(context, device,
    CL_QUEUE_PROFILING_ENABLE, &err);

// Create command queue (OpenCL 2.0+)
cl_queue_properties props[] = {
    CL_QUEUE_PROPERTIES, CL_QUEUE_PROFILING_ENABLE | CL_QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE,
    0
};
cl_command_queue queue = clCreateCommandQueueWithProperties(context, device, props, &err);
```

### 4. Program Compilation and Caching

Compile and cache OpenCL programs:

```c
// Create program from source
const char* source = loadKernelSource("kernel.cl");
cl_program program = clCreateProgramWithSource(context, 1, &source, NULL, &err);

// Build with options
const char* options = "-cl-fast-relaxed-math -cl-mad-enable";
err = clBuildProgram(program, 1, &device, options, NULL, NULL);

// Get build log on error
if (err != CL_SUCCESS) {
    size_t logSize;
    clGetProgramBuildInfo(program, device, CL_PROGRAM_BUILD_LOG, 0, NULL, &logSize);
    char* log = malloc(logSize);
    clGetProgramBuildInfo(program, device, CL_PROGRAM_BUILD_LOG, logSize, log, NULL);
    printf("Build error:\n%s\n", log);
    free(log);
}

// Get compiled binary for caching
size_t binarySize;
clGetProgramInfo(program, CL_PROGRAM_BINARY_SIZES, sizeof(size_t), &binarySize, NULL);
unsigned char* binary = malloc(binarySize);
clGetProgramInfo(program, CL_PROGRAM_BINARIES, sizeof(unsigned char*), &binary, NULL);
saveBinaryToFile("kernel.bin", binary, binarySize);

// Load cached binary
cl_program programFromBinary = clCreateProgramWithBinary(
    context, 1, &device, &binarySize, (const unsigned char**)&binary, NULL, &err);
```

### 5. NDRange Configuration

Configure work dimensions:

```c
// 1D NDRange
size_t globalSize = ((n + 255) / 256) * 256;  // Round up to multiple of work-group size
size_t localSize = 256;
clEnqueueNDRangeKernel(queue, kernel, 1, NULL, &globalSize, &localSize, 0, NULL, NULL);

// 2D NDRange
size_t globalSize2D[2] = {width, height};
size_t localSize2D[2] = {16, 16};
clEnqueueNDRangeKernel(queue, kernel, 2, NULL, globalSize2D, localSize2D, 0, NULL, NULL);

// Query max work-group size
size_t maxWorkGroupSize;
clGetDeviceInfo(device, CL_DEVICE_MAX_WORK_GROUP_SIZE, sizeof(size_t), &maxWorkGroupSize, NULL);
```

### 6. Memory Object Management

Create and manage buffers:

```c
// Create buffers
cl_mem bufferA = clCreateBuffer(context, CL_MEM_READ_ONLY, size, NULL, &err);
cl_mem bufferB = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR,
    size, hostDataB, &err);
cl_mem bufferC = clCreateBuffer(context, CL_MEM_WRITE_ONLY, size, NULL, &err);

// Write to buffer
clEnqueueWriteBuffer(queue, bufferA, CL_TRUE, 0, size, hostDataA, 0, NULL, NULL);

// Read from buffer
clEnqueueReadBuffer(queue, bufferC, CL_TRUE, 0, size, hostResult, 0, NULL, NULL);

// Map buffer for direct access
float* mappedPtr = clEnqueueMapBuffer(queue, bufferA, CL_TRUE, CL_MAP_WRITE,
    0, size, 0, NULL, NULL, &err);
// ... modify data ...
clEnqueueUnmapMemObject(queue, bufferA, mappedPtr, 0, NULL, NULL);
```

### 7. Vendor Extensions

Handle vendor-specific features:

```c
// Check for extension
char extensions[4096];
clGetDeviceInfo(device, CL_DEVICE_EXTENSIONS, sizeof(extensions), extensions, NULL);

if (strstr(extensions, "cl_khr_fp16")) {
    // Half precision available
}

if (strstr(extensions, "cl_nv_device_attribute_query")) {
    // NVIDIA-specific queries available
    cl_uint smCount;
    clGetDeviceInfo(device, CL_DEVICE_COMPUTE_CAPABILITY_MAJOR_NV,
        sizeof(cl_uint), &smCount, NULL);
}

// AMD-specific
if (strstr(extensions, "cl_amd_device_attribute_query")) {
    cl_uint simdPerCU;
    clGetDeviceInfo(device, CL_DEVICE_SIMD_PER_COMPUTE_UNIT_AMD,
        sizeof(cl_uint), &simdPerCU, NULL);
}
```

### 8. OpenCL Version Support

Support multiple OpenCL versions:

```c
// Query OpenCL version
char version[128];
clGetDeviceInfo(device, CL_DEVICE_VERSION, sizeof(version), version, NULL);

// OpenCL 2.0+ features
#ifdef CL_VERSION_2_0
// Shared Virtual Memory
cl_device_svm_capabilities svmCaps;
clGetDeviceInfo(device, CL_DEVICE_SVM_CAPABILITIES, sizeof(svmCaps), &svmCaps, NULL);

if (svmCaps & CL_DEVICE_SVM_COARSE_GRAIN_BUFFER) {
    void* svmPtr = clSVMAlloc(context, CL_MEM_READ_WRITE, size, 0);
    clEnqueueSVMMap(queue, CL_TRUE, CL_MAP_WRITE, svmPtr, size, 0, NULL, NULL);
}
#endif

// OpenCL 3.0 optional features
#ifdef CL_VERSION_3_0
cl_device_atomic_capabilities atomicCaps;
clGetDeviceInfo(device, CL_DEVICE_ATOMIC_MEMORY_CAPABILITIES,
    sizeof(atomicCaps), &atomicCaps, NULL);
#endif
```

## Process Integration

This skill integrates with the following processes:
- `opencl-application-development.js` - OpenCL application development
- `hip-porting-cross-platform.js` - Cross-platform porting

## Output Format

```json
{
  "operation": "enumerate-devices",
  "status": "success",
  "platforms": [
    {
      "name": "NVIDIA CUDA",
      "version": "OpenCL 3.0 CUDA",
      "devices": [
        {
          "name": "NVIDIA GeForce RTX 4090",
          "type": "GPU",
          "computeUnits": 128,
          "maxWorkGroupSize": 1024,
          "globalMemory": "24 GB",
          "extensions": ["cl_khr_fp16", "cl_khr_fp64"]
        }
      ]
    }
  ]
}
```

## Dependencies

- OpenCL SDK (NVIDIA, AMD, or Intel)
- OpenCL ICD Loader
- clinfo utility

## Constraints

- OpenCL 2.0+ features not available on all platforms
- Vendor extensions are not portable
- Binary caching requires same device/driver
- SVM requires OpenCL 2.0+ and device support
