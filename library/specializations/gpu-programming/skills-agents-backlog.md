# GPU Programming and Parallel Computing - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the GPU Programming processes beyond general-purpose capabilities. These tools would provide domain-specific expertise in CUDA, OpenCL, Vulkan compute, GPU profiling, memory optimization, kernel development, tensor cores, and parallel algorithms.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 25 implemented processes in this specialization currently use generic agent configurations (`gpu-engineer`, `gpu-performance-engineer`, `test-engineer`, `graphics-engineer`, `ml-engineer`, `technical-writer`) for task execution. While functional, this approach lacks the deep domain-specific optimizations that specialized skills and agents could provide.

### Goals
- Provide expert-level CUDA/OpenCL/Vulkan programming capabilities
- Enable automated kernel profiling and optimization analysis
- Reduce complexity in GPU memory hierarchy optimization
- Improve accuracy of performance predictions and bottleneck identification
- Support cross-platform GPU development (NVIDIA, AMD, Intel)
- Enable efficient tensor core and specialized hardware utilization

---

## Skills Backlog

### SK-001: CUDA Toolkit Skill
**Slug**: `cuda-toolkit`
**Category**: CUDA Development

**Description**: Deep integration with NVIDIA CUDA toolkit for kernel development, compilation, and debugging.

**Capabilities**:
- Execute nvcc compilation with optimization flags analysis
- Generate and validate CUDA kernel code with proper thread indexing
- Analyze PTX/SASS assembly output for optimization insights
- Configure execution parameters (grid/block dimensions)
- Handle CUDA error codes and diagnostic messages
- Generate host-device memory management code
- Support multiple CUDA compute capabilities (sm_XX)
- Validate kernel launch bounds and resource usage

**Process Integration**:
- cuda-kernel-development.js
- cuda-stream-concurrency.js
- custom-cuda-operator-development.js
- dynamic-parallelism-implementation.js

**Dependencies**: CUDA Toolkit, nvcc compiler

---

### SK-002: Nsight Profiler Skill
**Slug**: `nsight-profiler`
**Category**: Performance Profiling

**Description**: Expert skill for NVIDIA Nsight Systems and Nsight Compute profiling tools.

**Capabilities**:
- Configure and execute Nsight Systems profiling sessions
- Analyze Nsight Compute kernel reports
- Interpret occupancy metrics and SM utilization
- Parse and visualize roofline model data
- Identify memory bandwidth bottlenecks
- Analyze warp execution efficiency
- Generate optimization recommendations from profiler data
- Compare kernel performance across different configurations

**Process Integration**:
- performance-profiling-analysis.js
- occupancy-optimization.js
- warp-efficiency-optimization.js
- gpu-memory-optimization.js

**Dependencies**: Nsight Systems, Nsight Compute

---

### SK-003: OpenCL Runtime Skill
**Slug**: `opencl-runtime`
**Category**: OpenCL Development

**Description**: Cross-vendor OpenCL runtime management and kernel development.

**Capabilities**:
- Query and enumerate OpenCL platforms/devices
- Generate portable OpenCL C kernel code
- Handle vendor-specific extensions and workarounds
- Manage OpenCL contexts and command queues
- Compile and cache OpenCL programs/binaries
- Configure NDRange and work-group dimensions
- Validate OpenCL memory object usage
- Support OpenCL 1.2, 2.0, and 3.0 specifications

**Process Integration**:
- opencl-application-development.js
- hip-porting-cross-platform.js

**Dependencies**: OpenCL SDK (NVIDIA, AMD, Intel)

---

### SK-004: Vulkan Compute Skill
**Slug**: `vulkan-compute`
**Category**: Compute Shaders

**Description**: Vulkan compute shader development and pipeline configuration.

**Capabilities**:
- Generate GLSL/HLSL compute shaders
- Compile shaders to SPIR-V bytecode
- Configure Vulkan compute pipelines
- Manage descriptor sets and resource bindings
- Handle push constants and specialization constants
- Configure workgroup dimensions and dispatch
- Implement memory barriers and synchronization
- Support Vulkan validation layers for debugging

**Process Integration**:
- compute-shader-development.js

**Dependencies**: Vulkan SDK, glslangValidator/SPIRV-Tools

---

### SK-005: GPU Memory Analysis Skill
**Slug**: `gpu-memory-analysis`
**Category**: Memory Optimization

**Description**: Specialized skill for GPU memory hierarchy analysis and optimization.

**Capabilities**:
- Analyze memory access patterns (coalescing, striding)
- Detect and resolve shared memory bank conflicts
- Optimize L1/L2 cache utilization
- Configure shared memory vs L1 cache partitioning
- Analyze texture and constant memory usage
- Profile global memory bandwidth utilization
- Identify unnecessary memory transactions
- Generate optimized memory access code patterns

**Process Integration**:
- gpu-memory-optimization.js
- shared-memory-usage-patterns.js
- gpu-cpu-data-transfer-optimization.js
- gpu-memory-pool-allocator.js

**Dependencies**: Nsight Compute, compute-sanitizer

---

### SK-006: cuBLAS/cuDNN Skill
**Slug**: `cublas-cudnn`
**Category**: GPU Libraries

**Description**: Expert integration with NVIDIA GPU-accelerated math libraries.

**Capabilities**:
- Configure cuBLAS tensor core operations
- Generate cuBLAS GEMM calls with optimal parameters
- Integrate cuDNN convolution and normalization layers
- Handle cuBLAS/cuDNN algorithm selection
- Configure workspace memory requirements
- Benchmark library operations vs custom kernels
- Support mixed-precision operations (FP16, TF32, INT8)
- Integrate with cuSPARSE for sparse operations

**Process Integration**:
- tensor-core-programming.js
- ml-inference-optimization.js
- custom-cuda-operator-development.js

**Dependencies**: cuBLAS, cuDNN, cuSPARSE

---

### SK-007: NCCL Communication Skill
**Slug**: `nccl-communication`
**Category**: Multi-GPU

**Description**: NVIDIA Collective Communications Library integration for multi-GPU operations.

**Capabilities**:
- Initialize NCCL communicators
- Execute all-reduce, all-gather, reduce-scatter operations
- Configure ring and tree communication topologies
- Handle multi-node NCCL communication
- Profile collective operation performance
- Optimize for NVLink vs PCIe topology
- Integrate with CUDA streams for async collectives
- Support RCCL for AMD GPU compatibility

**Process Integration**:
- multi-gpu-programming.js
- gpu-cluster-computing.js

**Dependencies**: NCCL, RCCL, MPI

---

### SK-008: TensorRT Optimization Skill
**Slug**: `tensorrt-optimization`
**Category**: ML Inference

**Description**: NVIDIA TensorRT model optimization and deployment.

**Capabilities**:
- Convert models to TensorRT engines
- Configure optimization profiles and precision modes
- Apply INT8 calibration and quantization
- Analyze kernel fusion opportunities
- Generate custom TensorRT plugins
- Profile inference latency and throughput
- Handle dynamic shapes and batch sizes
- Compare TensorRT vs framework inference

**Process Integration**:
- ml-inference-optimization.js
- tensor-core-programming.js

**Dependencies**: TensorRT, ONNX

---

### SK-009: HIP/ROCm Skill
**Slug**: `hip-rocm`
**Category**: Cross-Platform

**Description**: AMD HIP and ROCm ecosystem for cross-platform GPU development.

**Capabilities**:
- Execute hipify conversion tools (hipify-perl, hipify-clang)
- Generate HIP-compatible kernel code
- Handle CUDA/HIP API differences
- Configure ROCm toolchain compilation
- Profile with rocprof and omniperf
- Support MI100/MI200/MI300 architectures
- Maintain single-source NVIDIA/AMD code
- Benchmark cross-platform performance

**Process Integration**:
- hip-porting-cross-platform.js
- multi-gpu-programming.js

**Dependencies**: ROCm, HIP, hipify tools

---

### SK-010: CUDA-GDB/Compute-Sanitizer Skill
**Slug**: `cuda-debugging`
**Category**: Debugging

**Description**: GPU debugging and error detection tooling.

**Capabilities**:
- Execute compute-sanitizer memory checks
- Detect race conditions with racecheck tool
- Identify memory leaks and invalid accesses
- Use CUDA-GDB for kernel debugging
- Analyze kernel synchronization issues
- Validate atomic operation correctness
- Detect uninitialized memory access
- Generate debugging reports with recommendations

**Process Integration**:
- gpu-debugging-techniques.js
- gpu-performance-regression-testing.js
- atomic-operations-synchronization.js

**Dependencies**: compute-sanitizer, cuda-gdb

---

### SK-011: Parallel Algorithm Patterns Skill
**Slug**: `parallel-patterns`
**Category**: Parallel Algorithms

**Description**: GPU parallel algorithm design patterns and implementations.

**Capabilities**:
- Implement parallel reduction algorithms (tree-based, warp)
- Generate scan (prefix sum) implementations
- Design histogram and binning algorithms
- Implement parallel sort algorithms (radix, merge)
- Generate stream compaction code
- Design work-efficient parallel patterns
- Handle multi-pass large-data algorithms
- Optimize for specific GPU architectures

**Process Integration**:
- parallel-algorithm-design.js
- reduction-scan-implementation.js
- atomic-operations-synchronization.js

**Dependencies**: CUB, Thrust libraries

---

### SK-012: Warp Primitives Skill
**Slug**: `warp-primitives`
**Category**: Low-Level Optimization

**Description**: Warp-level programming and SIMD optimization.

**Capabilities**:
- Use warp shuffle instructions (__shfl_*)
- Implement warp voting functions (__ballot, __any, __all)
- Design warp-synchronous algorithms
- Optimize warp divergence patterns
- Use cooperative groups for flexible sync
- Implement warp-level reductions
- Analyze and minimize warp stalls
- Support CUDA 11+ warp intrinsics

**Process Integration**:
- warp-efficiency-optimization.js
- reduction-scan-implementation.js
- parallel-algorithm-design.js

**Dependencies**: CUDA 11+, cooperative_groups header

---

### SK-013: Stencil/Convolution Skill
**Slug**: `stencil-convolution`
**Category**: Domain Algorithms

**Description**: Optimized stencil and convolution pattern implementations.

**Capabilities**:
- Design tiled stencil algorithms with halos
- Implement 2D/3D convolution kernels
- Optimize boundary condition handling
- Apply temporal blocking techniques
- Generate separable filter implementations
- Configure shared memory tiling strategies
- Profile stencil memory bandwidth
- Support multi-resolution stencils

**Process Integration**:
- stencil-computation-optimization.js
- gpu-image-video-processing.js

**Dependencies**: None (pattern knowledge)

---

### SK-014: NVENC/NVDEC Skill
**Slug**: `nvenc-nvdec`
**Category**: Video Processing

**Description**: NVIDIA hardware video encoding/decoding integration.

**Capabilities**:
- Configure NVENC encoding parameters
- Set up NVDEC decoding pipelines
- Handle codec configurations (H.264, H.265, AV1)
- Integrate with CUDA for pre/post processing
- Manage video memory surfaces
- Profile encode/decode performance
- Handle multi-stream encoding
- Support B-frame and lookahead configuration

**Process Integration**:
- gpu-image-video-processing.js

**Dependencies**: Video Codec SDK

---

### SK-015: GPU Benchmarking Skill
**Slug**: `gpu-benchmarking`
**Category**: Performance Testing

**Description**: Automated GPU performance benchmarking and regression detection.

**Capabilities**:
- Design micro-benchmarks for kernel operations
- Measure kernel execution time with events
- Calculate achieved vs theoretical performance
- Generate performance comparison reports
- Detect performance regressions in CI/CD
- Profile power and thermal characteristics
- Benchmark memory bandwidth and latency
- Create reproducible benchmark configurations

**Process Integration**:
- gpu-performance-regression-testing.js
- performance-profiling-analysis.js

**Dependencies**: CUDA Events, Nsight tools

---

### SK-016: CUTLASS/Triton Skill
**Slug**: `cutlass-triton`
**Category**: Kernel Generation

**Description**: High-performance kernel template libraries and DSLs.

**Capabilities**:
- Generate CUTLASS GEMM configurations
- Implement Triton kernel definitions
- Configure epilogue operations
- Handle tensor layout transformations
- Tune tile sizes and warp arrangements
- Support mixed-precision matrix operations
- Benchmark against cuBLAS implementations
- Generate custom attention kernels

**Process Integration**:
- tensor-core-programming.js
- custom-cuda-operator-development.js
- ml-inference-optimization.js

**Dependencies**: CUTLASS, Triton

---

### SK-017: CUDA Graphs Skill
**Slug**: `cuda-graphs`
**Category**: Execution Optimization

**Description**: CUDA Graph capture and optimization for reduced launch overhead.

**Capabilities**:
- Capture CUDA operations into graphs
- Instantiate and execute graph instances
- Update graph node parameters
- Profile graph vs stream execution
- Design graph-friendly kernel patterns
- Handle conditional graph execution
- Integrate graphs with NCCL operations
- Optimize launch latency for inference

**Process Integration**:
- cuda-stream-concurrency.js
- ml-inference-optimization.js
- dynamic-parallelism-implementation.js

**Dependencies**: CUDA 10+

---

### SK-018: Unified Memory Skill
**Slug**: `unified-memory`
**Category**: Memory Management

**Description**: CUDA Unified Memory and memory prefetching optimization.

**Capabilities**:
- Configure managed memory allocations
- Implement memory prefetch strategies
- Handle page fault analysis
- Configure memory hints and advise
- Profile unified memory migration
- Optimize for oversubscription scenarios
- Handle multi-GPU unified memory
- Compare managed vs explicit memory

**Process Integration**:
- gpu-cpu-data-transfer-optimization.js
- gpu-memory-optimization.js
- multi-gpu-programming.js

**Dependencies**: CUDA 8+

---

---

## Agents Backlog

### AG-001: CUDA Kernel Expert Agent
**Slug**: `cuda-kernel-expert`
**Category**: CUDA Development

**Description**: Specialized agent with deep CUDA kernel development expertise.

**Expertise Areas**:
- CUDA C++ programming and best practices
- Thread indexing and bounds checking patterns
- Shared memory optimization techniques
- Register pressure management
- Launch bounds configuration
- Device function design
- PTX/SASS analysis for micro-optimization
- Multi-precision computation

**Persona**:
- Role: Senior CUDA Software Engineer
- Experience: 8+ years GPU kernel development
- Background: NVIDIA DLI certified, HPC applications

**Process Integration**:
- cuda-kernel-development.js (all phases)
- cuda-stream-concurrency.js
- custom-cuda-operator-development.js
- dynamic-parallelism-implementation.js

---

### AG-002: GPU Performance Engineer Agent
**Slug**: `gpu-performance-engineer`
**Category**: Performance Optimization

**Description**: Expert agent for GPU performance analysis and optimization.

**Expertise Areas**:
- Nsight Systems/Compute profiling interpretation
- Roofline model analysis
- Occupancy optimization strategies
- Memory bandwidth optimization
- Warp efficiency analysis
- Kernel bottleneck identification
- Performance regression detection
- Architecture-specific optimizations (Volta, Ampere, Hopper)

**Persona**:
- Role: GPU Performance Architect
- Experience: 10+ years GPU optimization
- Background: HPC center optimization lead

**Process Integration**:
- performance-profiling-analysis.js (all phases)
- occupancy-optimization.js (all phases)
- warp-efficiency-optimization.js
- gpu-performance-regression-testing.js

---

### AG-003: Parallel Algorithm Designer Agent
**Slug**: `parallel-algorithm-designer`
**Category**: Parallel Computing

**Description**: Expert in designing efficient parallel algorithms for GPU architectures.

**Expertise Areas**:
- Data-parallel algorithm decomposition
- Work-efficient algorithm design
- Parallel complexity analysis
- Load balancing strategies
- Synchronization pattern design
- Lock-free algorithm implementation
- Parallel pattern selection (map, reduce, scan)
- Algorithm-architecture mapping

**Persona**:
- Role: Principal Parallel Computing Scientist
- Experience: 12+ years parallel computing research
- Background: PhD in parallel algorithms, PPOPP/SC publications

**Process Integration**:
- parallel-algorithm-design.js (all phases)
- reduction-scan-implementation.js
- atomic-operations-synchronization.js
- stencil-computation-optimization.js

---

### AG-004: GPU Memory Expert Agent
**Slug**: `gpu-memory-expert`
**Category**: Memory Optimization

**Description**: Specialized agent for GPU memory hierarchy optimization.

**Expertise Areas**:
- GPU memory architecture (registers, shared, L1, L2, global)
- Coalesced memory access patterns
- Bank conflict resolution
- Cache utilization optimization
- Memory bandwidth analysis
- Data layout transformation
- Pinned memory and zero-copy strategies
- Memory pool design

**Persona**:
- Role: GPU Memory Systems Architect
- Experience: 8+ years GPU memory optimization
- Background: Computer architecture background

**Process Integration**:
- gpu-memory-optimization.js (all phases)
- shared-memory-usage-patterns.js
- gpu-cpu-data-transfer-optimization.js
- gpu-memory-pool-allocator.js

---

### AG-005: Multi-GPU Systems Agent
**Slug**: `multi-gpu-systems-expert`
**Category**: Distributed GPU

**Description**: Expert in multi-GPU and distributed GPU computing.

**Expertise Areas**:
- Multi-GPU topology analysis (NVLink, PCIe)
- Workload partitioning strategies
- Inter-GPU communication optimization
- NCCL collective operations
- MPI+CUDA integration
- GPU-Direct RDMA
- Scaling efficiency analysis
- Distributed training patterns

**Persona**:
- Role: Distributed GPU Systems Architect
- Experience: 7+ years multi-GPU systems
- Background: Large-scale GPU cluster experience

**Process Integration**:
- multi-gpu-programming.js (all phases)
- gpu-cluster-computing.js (all phases)

---

### AG-006: Tensor Core Specialist Agent
**Slug**: `tensor-core-specialist`
**Category**: Specialized Hardware

**Description**: Expert in tensor core programming and mixed-precision computing.

**Expertise Areas**:
- WMMA API programming
- Tensor core data layouts
- Mixed-precision training/inference
- cuBLAS tensor core modes
- CUTLASS template configurations
- Numerical precision analysis
- FP16/TF32/INT8/FP8 strategies
- Tensor core utilization profiling

**Persona**:
- Role: Mixed-Precision Computing Expert
- Experience: 5+ years tensor core optimization
- Background: Deep learning framework development

**Process Integration**:
- tensor-core-programming.js (all phases)
- ml-inference-optimization.js (quantization, TensorRT)
- custom-cuda-operator-development.js

---

### AG-007: Cross-Platform GPU Agent
**Slug**: `cross-platform-gpu-expert`
**Category**: Portability

**Description**: Expert in portable GPU programming across NVIDIA, AMD, and Intel.

**Expertise Areas**:
- CUDA to HIP porting
- OpenCL cross-vendor development
- SYCL/DPC++ programming
- Platform-specific optimization paths
- API abstraction layer design
- Performance parity analysis
- Vendor-specific workarounds
- Cross-platform build systems

**Persona**:
- Role: Cross-Platform GPU Architect
- Experience: 8+ years multi-vendor GPU development
- Background: Experience with all major GPU vendors

**Process Integration**:
- hip-porting-cross-platform.js (all phases)
- opencl-application-development.js (all phases)

---

### AG-008: Graphics Compute Agent
**Slug**: `graphics-compute-expert`
**Category**: Graphics APIs

**Description**: Expert in compute shaders using graphics APIs (Vulkan, DirectX, Metal).

**Expertise Areas**:
- Vulkan compute pipeline design
- SPIR-V shader compilation
- Descriptor set management
- Resource binding optimization
- Compute/graphics interop
- Workgroup size optimization
- Memory barrier placement
- Cross-API compute patterns

**Persona**:
- Role: Graphics Compute Engineer
- Experience: 7+ years graphics API development
- Background: Game engine and real-time rendering

**Process Integration**:
- compute-shader-development.js (all phases)

---

### AG-009: ML Inference Optimization Agent
**Slug**: `ml-inference-optimizer`
**Category**: Machine Learning

**Description**: Expert in GPU-accelerated ML model optimization for production.

**Expertise Areas**:
- TensorRT engine building and optimization
- Quantization strategies (PTQ, QAT)
- Kernel fusion patterns
- Dynamic batching design
- ONNX model optimization
- Inference serving patterns
- Latency/throughput tradeoffs
- Model deployment pipelines

**Persona**:
- Role: ML Infrastructure Engineer
- Experience: 6+ years ML systems optimization
- Background: MLOps and inference serving

**Process Integration**:
- ml-inference-optimization.js (all phases)
- custom-cuda-operator-development.js (PyTorch integration)

---

### AG-010: GPU Debugging Specialist Agent
**Slug**: `gpu-debugging-specialist`
**Category**: Debugging

**Description**: Expert in GPU debugging, validation, and correctness verification.

**Expertise Areas**:
- Compute-sanitizer tool usage
- Race condition detection
- Memory error diagnosis
- Numerical validation techniques
- CPU reference implementation design
- Debugging strategies for parallel code
- Synchronization bug identification
- Assertion and logging patterns

**Persona**:
- Role: GPU Quality Assurance Engineer
- Experience: 6+ years GPU debugging
- Background: Testing and validation background

**Process Integration**:
- gpu-debugging-techniques.js (all phases)
- gpu-performance-regression-testing.js

---

### AG-011: Real-Time Processing Agent
**Slug**: `realtime-processing-expert`
**Category**: Real-Time Systems

**Description**: Expert in GPU real-time image and video processing pipelines.

**Expertise Areas**:
- Real-time constraint design
- Image processing kernel optimization
- Video codec integration (NVENC/NVDEC)
- Frame processing pipelines
- Latency minimization
- Multi-stream processing
- Computer vision on GPU
- NPP library integration

**Persona**:
- Role: Real-Time GPU Systems Engineer
- Experience: 7+ years video/image processing
- Background: Computer vision and streaming

**Process Integration**:
- gpu-image-video-processing.js (all phases)

---

### AG-012: HPC Domain Expert Agent
**Slug**: `hpc-domain-expert`
**Category**: High-Performance Computing

**Description**: Expert in scientific computing and HPC applications on GPU.

**Expertise Areas**:
- Scientific simulation on GPU
- CFD and molecular dynamics patterns
- Linear algebra optimization
- Sparse matrix operations
- Multi-physics coupling
- Double-precision optimization
- Large-scale data processing
- Domain decomposition strategies

**Persona**:
- Role: HPC Application Scientist
- Experience: 10+ years scientific computing
- Background: PhD in computational science

**Process Integration**:
- stencil-computation-optimization.js
- parallel-algorithm-design.js
- gpu-cluster-computing.js

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| cuda-kernel-development.js | SK-001, SK-012 | AG-001 |
| opencl-application-development.js | SK-003 | AG-007 |
| gpu-memory-optimization.js | SK-005, SK-002 | AG-004 |
| parallel-algorithm-design.js | SK-011, SK-012 | AG-003 |
| performance-profiling-analysis.js | SK-002, SK-015 | AG-002 |
| multi-gpu-programming.js | SK-007, SK-018 | AG-005 |
| gpu-cpu-data-transfer-optimization.js | SK-005, SK-018 | AG-004 |
| compute-shader-development.js | SK-004 | AG-008 |
| gpu-debugging-techniques.js | SK-010 | AG-010 |
| occupancy-optimization.js | SK-002, SK-001 | AG-002 |
| warp-efficiency-optimization.js | SK-012, SK-002 | AG-002, AG-003 |
| shared-memory-usage-patterns.js | SK-005, SK-012 | AG-004 |
| tensor-core-programming.js | SK-006, SK-016 | AG-006 |
| gpu-cluster-computing.js | SK-007 | AG-005, AG-012 |
| ml-inference-optimization.js | SK-008, SK-006 | AG-009, AG-006 |
| cuda-stream-concurrency.js | SK-001, SK-017 | AG-001 |
| reduction-scan-implementation.js | SK-011, SK-012 | AG-003 |
| stencil-computation-optimization.js | SK-013 | AG-003, AG-012 |
| hip-porting-cross-platform.js | SK-009, SK-003 | AG-007 |
| custom-cuda-operator-development.js | SK-001, SK-006, SK-016 | AG-001, AG-006 |
| gpu-memory-pool-allocator.js | SK-005, SK-018 | AG-004 |
| atomic-operations-synchronization.js | SK-011, SK-012 | AG-003 |
| gpu-image-video-processing.js | SK-013, SK-014 | AG-011 |
| dynamic-parallelism-implementation.js | SK-001, SK-017 | AG-001 |
| gpu-performance-regression-testing.js | SK-015, SK-010 | AG-010, AG-002 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-002 | Nsight Profiler | Data Science/ML, HPC Computing |
| SK-003 | OpenCL Runtime | Cross-Platform Development |
| SK-004 | Vulkan Compute | Game Development, Graphics |
| SK-006 | cuBLAS/cuDNN | Data Science/ML, Deep Learning |
| SK-008 | TensorRT Optimization | ML Engineering, Edge Computing |
| SK-011 | Parallel Algorithm Patterns | Algorithms/Optimization, HPC |
| SK-015 | GPU Benchmarking | Performance Engineering, QA Testing |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-002 | GPU Performance Engineer | Data Science/ML, HPC Computing |
| AG-003 | Parallel Algorithm Designer | Algorithms/Optimization |
| AG-005 | Multi-GPU Systems Expert | Data Science/ML, Cloud Computing |
| AG-006 | Tensor Core Specialist | Data Science/ML, Deep Learning |
| AG-009 | ML Inference Optimizer | ML Engineering, Edge Computing |
| AG-012 | HPC Domain Expert | Scientific Computing, Simulation |

---

## Implementation Priority

### Phase 1: Core CUDA Skills (High Impact)
1. **SK-001**: CUDA Toolkit - Foundation for all CUDA processes
2. **SK-002**: Nsight Profiler - Essential for optimization
3. **SK-005**: GPU Memory Analysis - Memory is primary bottleneck
4. **SK-012**: Warp Primitives - Core optimization technique

### Phase 2: Core Agents (High Impact)
1. **AG-001**: CUDA Kernel Expert - Highest process coverage
2. **AG-002**: GPU Performance Engineer - Cross-cutting concern
3. **AG-004**: GPU Memory Expert - Critical optimization area
4. **AG-003**: Parallel Algorithm Designer - Core expertise

### Phase 3: Advanced Optimization
1. **SK-006**: cuBLAS/cuDNN - Library integration
2. **SK-008**: TensorRT Optimization - ML inference
3. **SK-011**: Parallel Algorithm Patterns - Pattern library
4. **AG-006**: Tensor Core Specialist

### Phase 4: Multi-GPU & Cross-Platform
1. **SK-007**: NCCL Communication - Multi-GPU scaling
2. **SK-009**: HIP/ROCm - AMD GPU support
3. **SK-003**: OpenCL Runtime - Cross-vendor
4. **AG-005**: Multi-GPU Systems Expert
5. **AG-007**: Cross-Platform GPU Expert

### Phase 5: Specialized Domains
1. **SK-004**: Vulkan Compute - Graphics API compute
2. **SK-013**: Stencil/Convolution - Domain patterns
3. **SK-014**: NVENC/NVDEC - Video processing
4. **SK-016**: CUTLASS/Triton - Kernel generation
5. **SK-017**: CUDA Graphs - Launch optimization
6. **AG-008**: Graphics Compute Expert
7. **AG-011**: Real-Time Processing Agent
8. **AG-012**: HPC Domain Expert

### Phase 6: Quality & Tooling
1. **SK-010**: CUDA-GDB/Compute-Sanitizer - Debugging
2. **SK-015**: GPU Benchmarking - CI/CD integration
3. **SK-018**: Unified Memory - Memory management
4. **AG-010**: GPU Debugging Specialist
5. **AG-009**: ML Inference Optimizer

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 18 |
| Agents Identified | 12 |
| Shared Skill Candidates | 7 |
| Shared Agent Candidates | 6 |
| Total Processes Covered | 25 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
