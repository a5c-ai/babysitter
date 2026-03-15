# GPU Programming - Skills, Agents, and Community References

This document provides references to community-created Claude skills, agents, plugins, MCPs (Model Context Protocol servers), and related tools that can enhance the GPU Programming specialization processes identified in the skills-agents-backlog.md.

---

## Table of Contents

1. [Overview](#overview)
2. [Claude Skills and Plugins](#claude-skills-and-plugins)
3. [MCP Servers and Integrations](#mcp-servers-and-integrations)
4. [AI-Powered GPU Development Tools](#ai-powered-gpu-development-tools)
5. [NVIDIA Tools and Libraries](#nvidia-tools-and-libraries)
6. [AMD ROCm Tools and Libraries](#amd-rocm-tools-and-libraries)
7. [Graphics and Shader Development](#graphics-and-shader-development)
8. [Parallel Computing Resources](#parallel-computing-resources)
9. [AI Kernel Generation and Optimization](#ai-kernel-generation-and-optimization)
10. [Community Resources and Learning](#community-resources-and-learning)
11. [Skill-to-Reference Mapping](#skill-to-reference-mapping)

---

## Overview

While the GPU programming ecosystem for Claude skills and MCPs is still emerging, several community tools and resources can support the development of GPU-focused processes. This document catalogs available resources across CUDA, OpenCL, Vulkan compute, ROCm/HIP, graphics shaders, and parallel computing domains.

### Current State

The Claude Code plugin ecosystem is growing but GPU-specific tools remain relatively limited. Key findings:
- **Direct GPU Skills**: A few specialized skills exist (Flox CUDA, WebGPU, Shader Fundamentals, Metal Shader Expert)
- **MCP Integration**: NVIDIA provides MCP integration through their NeMo Agent Toolkit and AgentIQ
- **AI-Powered Development**: Tools like RightNow CLI and GEAK (Triton AI Agent) are emerging
- **Library Ecosystem**: NVIDIA and AMD provide comprehensive SDKs that can be integrated

---

## Claude Skills and Plugins

### SK-REF-001: Flox CUDA Agent Skill

**URL**: https://claude-plugins.dev/skills/@flox/flox-agentic/flox-cuda

**Description**: CUDA and GPU development skill using Flox for reproducible development environments.

**Capabilities**:
- NVIDIA CUDA toolkit setup (versions 11.x, 12.x)
- GPU computing environment configuration
- Deep learning framework integration (PyTorch, TensorFlow)
- cuDNN, cuBLAS, cuFFT, cuRAND, NCCL package management
- Cross-platform GPU/CPU development support

**Platform Support**: Linux only (aarch64-linux, x86_64-linux)

**Process Alignment**: SK-001 (CUDA Toolkit), SK-006 (cuBLAS/cuDNN), SK-007 (NCCL)

---

### SK-REF-002: WebGPU Three.js TSL Skill

**URL**: https://github.com/dgreenheck/webgpu-claude-skill

**Description**: Claude skill for developing WebGPU applications with Three.js and TSL (Three.js Shading Language).

**Capabilities**:
- WebGPU renderer setup and configuration
- TSL (Three.js Shading Language) shader development
- WGSL custom function integration via `wgslFn()`
- Compute shader development (instanced arrays, parallel physics, particles)
- Post-processing effects (bloom, blur, FXAA, depth-of-field)
- Material system with node-based shader creation

**Installation**:
```bash
/skill install webgpu-threejs-tsl@<github-username>/webgpu-claude-skill
```

**Process Alignment**: SK-004 (Vulkan Compute), AG-008 (Graphics Compute Expert)

---

### SK-REF-003: Shader Fundamentals Skill

**URL**: https://agent-skills.md/skills/Bbeierle12/Skill-MCP-Claude/shader-fundamentals

**Description**: Comprehensive GLSL shader programming skill covering the graphics pipeline.

**Capabilities**:
- Vertex and fragment shader development
- GLSL data types, uniforms, varyings, and attributes
- Coordinate system transformations
- Built-in variables and functions
- Debugging techniques for shader code
- Math functions (trigonometric, vector operations)

**Installation**:
```bash
pnpm dlx add-skill https://github.com/Bbeierle12/Skill-MCP-Claude/shader-fundamentals
```

**Process Alignment**: SK-004 (Vulkan Compute), AG-008 (Graphics Compute Expert)

---

### SK-REF-004: Metal Shader Expert Skill

**URL**: https://mcpmarket.com/tools/skills/metal-shader-expert

**Description**: Claude Code skill specializing in Metal Shading Language (MSL) for Apple Silicon GPUs.

**Capabilities**:
- Metal Shading Language (MSL) development
- PBR rendering pipeline optimization
- Compute shaders for Apple GPUs
- Ray tracing solutions for Apple Silicon
- TBDR (Tile-Based Deferred Rendering) optimization
- GPU occupancy optimization
- iOS, macOS, and visionOS support

**Process Alignment**: AG-008 (Graphics Compute Expert), SK-004 (Vulkan Compute)

---

## MCP Servers and Integrations

### MCP-REF-001: NVIDIA NeMo Agent Toolkit MCP

**URL**: https://docs.nvidia.com/nemo/agent-toolkit/latest/workflows/mcp/mcp-server.html

**Description**: NVIDIA's official MCP integration for AI agent workflows with GPU acceleration.

**Capabilities**:
- MCP client for connecting to remote MCP servers
- MCP server publishing for tool distribution
- OAuth2 authentication support
- Streamable-http transport protocol
- Integration with NVIDIA AI infrastructure

**Documentation**: https://docs.nvidia.com/nemo/agent-toolkit/latest/components/mcp.html

**Process Alignment**: SK-008 (TensorRT), AG-009 (ML Inference Optimizer)

---

### MCP-REF-002: NVIDIA AgentIQ MCP Integration

**URL**: https://docs.nvidia.com/agentiq/latest/components/mcp.html

**Description**: Model Context Protocol integration within NVIDIA's Agent Intelligence Toolkit.

**Capabilities**:
- MCP tool wrapper configuration
- Multiple tool integration from MCP servers
- Profiling and observability
- Evaluation system for agentic workflows
- OpenTelemetry compatibility

**Documentation**: https://docs.nvidia.com/aiqtoolkit/latest/workflows/mcp/index.html

**Process Alignment**: SK-002 (Nsight Profiler), SK-015 (GPU Benchmarking)

---

### MCP-REF-003: NVIDIA Brev MCP Server

**URL**: https://skywork.ai/skypage/en/gpu-workflows-nvidia-brev-mcp/1979064355922419712

**Description**: GPU workflow management using natural language commands for cloud orchestration.

**Capabilities**:
- GPU cloud instance management
- NVIDIA NIM (Inference Microservices) deployment
- Natural language GPU workflow commands
- Multi-GPU cluster orchestration

**Process Alignment**: AG-005 (Multi-GPU Systems), SK-007 (NCCL)

---

### MCP-REF-004: Claude Code Enhanced MCP Server

**URL**: https://www.pulsemcp.com/servers/grahama1970-claude-code

**Description**: Multi-agent communication bridge for Claude Code instances.

**Capabilities**:
- WebSocket connections between Claude Code instances
- Multi-agent coordination
- Distributed workflow support

**Process Alignment**: General agent orchestration for GPU workloads

---

### MCP-REF-005: Claude Debugs For You MCP

**URL**: https://github.com/jasonjmcghee/claude-debugs-for-you

**Description**: MCP Server and VS Code extension enabling interactive debugging via Claude.

**Capabilities**:
- Language-agnostic debugging
- Interactive expression evaluation
- VS Code integration via launch.json
- Support for multiple AI models/clients

**Process Alignment**: SK-010 (CUDA Debugging), AG-010 (GPU Debugging Specialist)

---

## AI-Powered GPU Development Tools

### AI-REF-001: RightNow CLI

**URL**: https://github.com/RightNow-AI/rightnow-cli

**Description**: AI-powered CUDA development assistant described as "Claude Code for CUDA."

**Capabilities**:
- CUDA kernel code generation
- Performance optimization suggestions
- GPU debugging assistance
- Code analysis and improvement recommendations
- GPU status monitoring
- Works without GPU (CPU simulation mode)

**Specialized Agents**:
- General assistant for CUDA tasks
- Optimizer for performance tuning
- Debugger for issue identification
- Analyzer for code explanation

**Installation**:
```bash
pip install rightnow-cli
```

**AI Models**: Google Gemini 2.0 Flash (default), Meta Llama 3.2 3B, GPT-4o, Claude 3.5 Sonnet

**Process Alignment**: SK-001 (CUDA Toolkit), SK-002 (Nsight Profiler), AG-001 (CUDA Kernel Expert)

---

### AI-REF-002: GEAK (Generating Efficient AI-centric GPU Kernels)

**URL**: https://rocm.blogs.amd.com/software-tools-optimization/triton-kernel-ai/README.html

**Paper**: https://arxiv.org/html/2507.23194v1

**Description**: AMD's agentic AI system for automatic Triton kernel generation.

**Architecture**:
- Generator: Produces code from user queries
- Reflector: Analyzes error traces for correction
- Evaluator: Cascaded functionality testing
- Optimizer: Iterative performance improvement

**Performance**: 54.89% execution accuracy on TritonBench, 2.59x average speedup over reference kernels

**Process Alignment**: SK-016 (CUTLASS/Triton), AG-001 (CUDA Kernel Expert)

---

### AI-REF-003: AutoTriton

**URL**: https://arxiv.org/html/2507.05687v1

**Description**: First model dedicated to Triton programming powered by reinforcement learning.

**Capabilities**:
- Supervised fine-tuning for Triton expertise
- Reinforcement learning with GRPO algorithm
- Performance comparable to Claude-4-Sonnet and DeepSeek-R1

**Process Alignment**: SK-016 (CUTLASS/Triton)

---

### AI-REF-004: Sakana AI CUDA Engineer

**URL**: https://sakana.ai/ai-cuda-engineer/

**Description**: Agentic framework for automated CUDA kernel discovery, verification, and optimization.

**Capabilities**:
- Automated torch-to-CUDA kernel translation
- Iterative runtime optimization
- Comprehensive kernel verification
- Performance benchmarking

**Process Alignment**: SK-001 (CUDA Toolkit), AG-001 (CUDA Kernel Expert)

---

### AI-REF-005: CUDA-L1

**URL**: https://deepreinforce-ai.github.io/cudal1_blog/

**Description**: AI system using contrastive reinforcement learning for CUDA code generation.

**Capabilities**:
- Self-generated CUDA code with testing
- Learning from successful compilations
- Optimization through reinforcement

**Process Alignment**: SK-001 (CUDA Toolkit), SK-011 (Parallel Patterns)

---

### AI-REF-006: Workik AI CUDA Code Generator

**URL**: https://workik.com/cuda-code-generator

**Description**: AI-powered CUDA kernel generation and optimization tool.

**Capabilities**:
- Automated CUDA kernel creation
- Thread and block configuration recommendations
- Debugging support (warp divergence, memory misalignment)
- Performance tuning suggestions

**Process Alignment**: SK-001 (CUDA Toolkit), SK-012 (Warp Primitives)

---

### AI-REF-007: WAT-ai CUDA Kernel Optimization

**URL**: https://github.com/WAT-ai/CUDA-kernel-optimization

**Description**: Project focused on optimizing CUDA kernels using reinforcement learning.

**Capabilities**:
- RL-based kernel optimization
- Performance improvement research

**Process Alignment**: SK-001 (CUDA Toolkit), AG-002 (GPU Performance Engineer)

---

## NVIDIA Tools and Libraries

### NV-REF-001: NVIDIA Nsight Systems

**URL**: https://developer.nvidia.com/nsight-systems

**Description**: System-wide performance analysis tool for visualizing workload metrics.

**Version**: 2026.1.1 (latest)

**Capabilities**:
- Timeline visualization of system workloads
- CPU and GPU sampling and tracing
- Performance bottleneck identification
- Multi-GPU profiling support

**Process Alignment**: SK-002 (Nsight Profiler), AG-002 (GPU Performance Engineer)

---

### NV-REF-002: NVIDIA Nsight Compute

**URL**: https://developer.nvidia.com/nsight-compute

**Documentation**: https://developer.nvidia.com/tools-overview/nsight-compute/get-started-2025_3

**Description**: Interactive CUDA and OptiX kernel profiler.

**Version**: 2025.4 (supports CUDA Toolkit 13.1)

**Capabilities**:
- Detailed kernel performance metrics
- Roofline model analysis
- Scoreboard dependencies in SASS
- C2C link information on Blackwell GPUs
- Constant cache hit rates (Turing+)
- JupyterLab extension integration
- MPS application profiling

**Process Alignment**: SK-002 (Nsight Profiler), AG-002 (GPU Performance Engineer)

---

### NV-REF-003: NVIDIA Compute Sanitizer

**URL**: https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html

**Description**: Functional correctness checking suite for CUDA programs.

**Tools**:
- **Memcheck**: Memory access error and leak detection
- **Racecheck**: Shared memory data access hazard detection
- **Initcheck**: Uninitialized global memory access detection

**Usage**:
```bash
compute-sanitizer --tool <tool> ./cuda_program
```

**Process Alignment**: SK-010 (CUDA Debugging), AG-010 (GPU Debugging Specialist)

---

### NV-REF-004: NVIDIA TensorRT

**URL**: https://developer.nvidia.com/tensorrt

**Description**: SDK for high-performance deep learning inference optimization.

**Capabilities**:
- Model optimization and quantization (FP8, FP4, INT8, INT4)
- AWQ and advanced quantization techniques
- Kernel fusion optimization
- Dynamic batching support
- Custom plugin development

**Process Alignment**: SK-008 (TensorRT), AG-009 (ML Inference Optimizer)

---

### NV-REF-005: NVIDIA TensorRT-LLM

**URL**: https://github.com/NVIDIA/TensorRT-LLM

**Description**: Python API for defining and optimizing LLM inference on NVIDIA GPUs.

**Capabilities**:
- Custom attention kernels
- Inflight batching and paged KV caching
- FP8, FP4, INT4 AWQ, INT8 SmoothQuant quantization
- Speculative decoding support

**Process Alignment**: SK-008 (TensorRT), AG-009 (ML Inference Optimizer), AG-006 (Tensor Core Specialist)

---

### NV-REF-006: NVIDIA Model Optimizer

**URL**: https://github.com/NVIDIA/TensorRT-Model-Optimizer

**Description**: Unified library for model optimization techniques (formerly TensorRT Model Optimizer).

**Capabilities**:
- Quantization (multiple precision levels)
- Pruning and distillation
- Speculative decoding optimization
- Support for TensorRT-LLM, TensorRT, and vLLM

**Process Alignment**: SK-008 (TensorRT), AG-009 (ML Inference Optimizer)

---

### NV-REF-007: NVIDIA NCCL

**URL**: https://github.com/NVIDIA/nccl

**Documentation**: https://developer.nvidia.com/nccl

**Description**: Optimized primitives for collective multi-GPU communication.

**Capabilities**:
- All-reduce, all-gather, reduce, broadcast, reduce-scatter
- PCIe, NVLink, NVSwitch optimization
- InfiniBand Verbs and TCP/IP support
- Multi-node communication
- Device APIs for CUDA kernel integration

**Process Alignment**: SK-007 (NCCL), AG-005 (Multi-GPU Systems)

---

### NV-REF-008: NVIDIA CCCL (CUDA Core Compute Libraries)

**URL**: https://github.com/NVIDIA/cccl

**Thrust**: https://nvidia.github.io/cccl/thrust/

**Description**: Unified library containing Thrust, CUB, and libcudacxx.

**Components**:
- **Thrust**: C++ parallel algorithms library
- **CUB**: Low-level CUDA-specific primitives
- **libcudacxx**: CUDA standard library

**Capabilities**:
- Device-wide, block-wide, and warp-wide algorithms
- Parallel sort, scan, reduce, histogram
- Fancy iterators and PTX intrinsics
- CUDA unified memory support

**Process Alignment**: SK-011 (Parallel Patterns), SK-012 (Warp Primitives), AG-003 (Parallel Algorithm Designer)

---

### NV-REF-009: NVIDIA CUDA Samples

**URL**: https://github.com/NVIDIA/cuda-samples

**Description**: Official samples demonstrating CUDA features and optimization techniques.

**Categories**:
- Cooperative Groups examples
- CUDA Dynamic Parallelism
- CUDA Graphs
- Performance optimization samples

**Process Alignment**: SK-001 (CUDA Toolkit), SK-017 (CUDA Graphs), AG-001 (CUDA Kernel Expert)

---

### NV-REF-010: NVIDIA cuDNN

**URL**: https://developer.nvidia.com/cudnn

**Description**: GPU-accelerated primitives for deep neural networks.

**Capabilities**:
- Attention training/prefill acceleration
- Convolution and matmul optimization
- Pooling, softmax, normalization, activation
- Framework integration (PyTorch, JAX, TensorFlow, etc.)

**Process Alignment**: SK-006 (cuBLAS/cuDNN), AG-006 (Tensor Core Specialist)

---

### NV-REF-011: cuThermo GPU Memory Profiler

**URL**: https://arxiv.org/html/2507.18729v1

**Description**: Lightweight GPU memory analysis tool using heat map profiling.

**Capabilities**:
- Runtime memory inefficiency identification
- Heat map based on distinct visited warp counts
- Detection of: hot spots, shared memory abuse, false sharing, memory misalignment, strided access

**Process Alignment**: SK-005 (GPU Memory Analysis), AG-004 (GPU Memory Expert)

---

## AMD ROCm Tools and Libraries

### AMD-REF-001: AMD ROCm Software

**URL**: https://www.amd.com/en/products/software/rocm.html

**GitHub**: https://github.com/ROCm/ROCm

**Description**: AMD's open software stack for GPU computing.

**Version**: ROCm 7.0+ (2025)

**Capabilities**:
- HIP programming environment
- OpenMP and OpenCL support
- PyTorch and TensorFlow integration
- AMD Resource Manager for cluster orchestration
- AMD AI Workbench for model deployment

**Process Alignment**: SK-009 (HIP/ROCm), AG-007 (Cross-Platform GPU Expert)

---

### AMD-REF-002: HIPIFY

**URL**: https://github.com/ROCm/HIPIFY

**Documentation**: https://rocm.docs.amd.com/projects/HIPIFY/en/latest/

**Description**: Tools for converting CUDA source code to portable HIP C++.

**Tools**:
- **hipify-clang**: Clang-based parser for comprehensive conversion
- **hipify-perl**: Simple text-based replacement tool
- **hipify_torch**: PyTorch-specific conversion utility

**Process Alignment**: SK-009 (HIP/ROCm), AG-007 (Cross-Platform GPU Expert)

---

### AMD-REF-003: AMD ROCm AI Developer Hub

**URL**: https://www.amd.com/en/developer/resources/rocm-hub/dev-ai.html

**Description**: Resources for AI development on AMD GPUs.

**Features**:
- MCP tutorial: AI agent with MCPs using vLLM and PydanticAI
- RAG pipeline support
- Deep learning framework guides
- MI100/MI200/MI300 architecture support

**Process Alignment**: AG-007 (Cross-Platform GPU Expert), SK-009 (HIP/ROCm)

---

### AMD-REF-004: AMD HIP SDK

**URL**: https://www.amd.com/en/developer/resources/rocm-hub/hip-sdk.html

**Description**: SDK bringing ROCm capabilities to Windows.

**Capabilities**:
- HIP API and runtime for Windows
- GPU programming on AMD hardware
- Cross-platform development support

**Process Alignment**: SK-009 (HIP/ROCm), AG-007 (Cross-Platform GPU Expert)

---

## Graphics and Shader Development

### GFX-REF-001: Triton Language and Compiler

**URL**: https://github.com/triton-lang/triton

**Introduction**: https://openai.com/index/triton/

**Description**: Language and compiler for writing efficient GPU kernels.

**Capabilities**:
- Python-like DSL for GPU programming
- Multi-vendor support (NVIDIA, AMD, Intel)
- Automatic optimization and tuning
- Memory vs compute throughput optimization

**Process Alignment**: SK-016 (CUTLASS/Triton), AG-001 (CUDA Kernel Expert)

---

### GFX-REF-002: Triton Resources Collection

**URL**: https://github.com/rkinas/triton-resources

**Description**: Curated list of Triton GPU programming resources.

**Contents**:
- Official documentation and tutorials
- Community articles and video resources
- Tools: Triton Profiler (Proton), Triton-Viz, Triton-util, TritonBench
- Sample kernels: FlagGems, Liger-Kernel, Unsloth, Bitsandbytes
- Integration guides for JAX-Triton, Intel XPU, torch.compile

**Process Alignment**: SK-016 (CUTLASS/Triton)

---

### GFX-REF-003: Google Clspv

**URL**: https://github.com/google/clspv

**Description**: Compiler for OpenCL C to Vulkan compute shaders.

**Capabilities**:
- OpenCL C dialect to SPIR-V compilation
- Vulkan API targeting
- LLVM-based transformation passes

**Process Alignment**: SK-003 (OpenCL Runtime), SK-004 (Vulkan Compute)

---

### GFX-REF-004: Slang Shader Compiler

**URL**: https://github.com/shader-slang/slang

**Description**: Shading language for modular, extensible shader codebases.

**Capabilities**:
- Multi-target compilation: D3D12, Vulkan, Metal, CUDA, CPU
- DXIL and SPIR-V output
- Offline compilation with optional obfuscation
- Runtime linking support

**Process Alignment**: SK-004 (Vulkan Compute), AG-008 (Graphics Compute Expert)

---

### GFX-REF-005: DirectX Shader Compiler

**URL**: https://github.com/microsoft/DirectXShaderCompiler

**Description**: LLVM/Clang-based HLSL compiler for DirectX.

**Capabilities**:
- HLSL to DXIL compilation
- DirectX shader program generation
- SPIR-V output support

**Process Alignment**: SK-004 (Vulkan Compute), AG-008 (Graphics Compute Expert)

---

### GFX-REF-006: libvc (Vulkan Compute)

**URL**: https://github.com/uNetworking/libvc

**Description**: GPGPU engine based on Vulkan compute.

**Capabilities**:
- SPIR-V shader execution without graphics context
- Cross-platform GPU acceleration
- Abstract interface for rapid development

**Process Alignment**: SK-004 (Vulkan Compute)

---

### GFX-REF-007: vuh (Vulkan Compute for People)

**URL**: https://github.com/Glavnokoman/vuh

**Description**: Simplified Vulkan compute library.

**Process Alignment**: SK-004 (Vulkan Compute)

---

## Parallel Computing Resources

### PAR-REF-001: HPC Profiler Bootcamp

**URL**: https://github.com/openhackathons-org/HPC_Profiler

**Description**: Bootcamp for profiling with NVIDIA Nsight Tools.

**Contents**:
- Hands-on Nsight Systems experience
- Parallel application profiling
- Labs for various skill levels

**Process Alignment**: SK-002 (Nsight Profiler), AG-002 (GPU Performance Engineer)

---

### PAR-REF-002: ENCCS CUDA Training Materials

**URL**: https://enccs.github.io/cuda/3.01_ParallelReduction/

**Description**: Training materials for CUDA kernel optimization.

**Topics**:
- Parallel reduction optimization
- GPU feature utilization
- Kernel performance analysis

**Process Alignment**: SK-011 (Parallel Patterns), AG-003 (Parallel Algorithm Designer)

---

### PAR-REF-003: GPU-100 Days Project

**URL**: https://github.com/a-hamdi/GPU

**Description**: 100 days of building GPU kernels project.

**Focus**:
- Activation function parallelization
- Memory access pattern optimization
- CUDA performance tuning

**Process Alignment**: SK-001 (CUDA Toolkit), AG-001 (CUDA Kernel Expert)

---

### PAR-REF-004: Parallel Reductions Benchmark

**URL**: https://github.com/ashvardanian/ParallelReductionsBenchmark

**Description**: Comprehensive benchmark comparing parallel reduction implementations.

**Platforms**: Thrust, CUB, TBB, AVX2, AVX-512, CUDA, OpenCL, OpenMP, Metal, Rust

**Process Alignment**: SK-011 (Parallel Patterns), AG-003 (Parallel Algorithm Designer)

---

### PAR-REF-005: Modern GPU

**URL**: https://moderngpu.github.io/intro.html

**Description**: Educational resource for modern GPU programming.

**Process Alignment**: AG-001 (CUDA Kernel Expert), SK-011 (Parallel Patterns)

---

## AI Kernel Generation and Optimization

### AIK-REF-001: CUDA-L2 Research

**URL**: https://arxiv.org/html/2512.02551v1

**Description**: Research on surpassing cuBLAS performance through reinforcement learning.

**Achievement**: Matrix multiplication performance exceeding cuBLAS

**Process Alignment**: SK-006 (cuBLAS/cuDNN), AG-002 (GPU Performance Engineer)

---

### AIK-REF-002: OpenAI Codex HPC Evaluation

**URL**: https://arxiv.org/pdf/2306.15121

**Description**: Research evaluating AI code generation for HPC kernels.

**Kernels Tested**: AXPY, GEMV, GEMM, SpMV, Jacobi Stencil, CG

**Programming Models**: CUDA, OpenMP, OpenACC

**Process Alignment**: SK-011 (Parallel Patterns), AG-003 (Parallel Algorithm Designer)

---

## Community Resources and Learning

### COM-REF-001: Awesome Claude Code

**URL**: https://github.com/hesreallyhim/awesome-claude-code

**Description**: Curated list of Claude Code skills, hooks, commands, and plugins.

**Note**: Limited GPU-specific content as of 2026-01

**Process Alignment**: General Claude Code development

---

### COM-REF-002: Claude Code Workflows

**URL**: https://github.com/shinpr/claude-code-workflows

**Description**: Production-ready development workflows for Claude Code.

**Process Alignment**: General agent orchestration

---

### COM-REF-003: Claude-Flow

**URL**: https://github.com/ruvnet/claude-flow

**Description**: Leading agent orchestration platform for Claude with MCP support.

**Capabilities**:
- Multi-agent swarm deployment
- Distributed swarm intelligence
- RAG integration
- Native Claude Code support via MCP

**Process Alignment**: General multi-agent GPU workflows

---

### COM-REF-004: CUDA-MODE Discord

**URL**: Referenced in Triton resources

**Description**: Active developer community for GPU programming.

**Process Alignment**: General GPU programming community

---

### COM-REF-005: Kempner Institute GPU Computing Handbook

**URL**: https://handbook.eng.kempnerinstitute.harvard.edu/s5_ai_scaling_and_engineering/scalability/distributed_gpu_computing.html

**Description**: Educational resource for distributed GPU computing.

**Topics**:
- Distributed data parallelism (DDP)
- Fully sharded data parallel (FSDP)
- NCCL backend usage

**Process Alignment**: AG-005 (Multi-GPU Systems), SK-007 (NCCL)

---

### COM-REF-006: NVIDIA CUDA Cooperative Groups Documentation

**URL**: https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/cooperative-groups.html

**Description**: Official documentation for CUDA cooperative groups.

**Topics**:
- Thread group organization
- Warp-level programming
- Synchronization primitives

**Process Alignment**: SK-012 (Warp Primitives), AG-003 (Parallel Algorithm Designer)

---

### COM-REF-007: NVIDIA Warp-Level Primitives Blog

**URL**: https://developer.nvidia.com/blog/using-cuda-warp-level-primitives/

**Description**: Technical blog on warp shuffle and voting functions.

**Topics**:
- `__shfl_*` instructions
- `__ballot`, `__any`, `__all` functions
- Warp-synchronous programming

**Process Alignment**: SK-012 (Warp Primitives)

---

## Skill-to-Reference Mapping

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-001 | CUDA Toolkit | SK-REF-001, AI-REF-001, NV-REF-009 |
| SK-002 | Nsight Profiler | NV-REF-001, NV-REF-002, MCP-REF-002 |
| SK-003 | OpenCL Runtime | GFX-REF-003, AMD-REF-001 |
| SK-004 | Vulkan Compute | SK-REF-002, SK-REF-003, GFX-REF-003, GFX-REF-004 |
| SK-005 | GPU Memory Analysis | NV-REF-011, NV-REF-003 |
| SK-006 | cuBLAS/cuDNN | SK-REF-001, NV-REF-010, AIK-REF-001 |
| SK-007 | NCCL Communication | SK-REF-001, NV-REF-007, MCP-REF-003 |
| SK-008 | TensorRT Optimization | NV-REF-004, NV-REF-005, NV-REF-006, MCP-REF-001 |
| SK-009 | HIP/ROCm | AMD-REF-001, AMD-REF-002, AMD-REF-003 |
| SK-010 | CUDA Debugging | NV-REF-003, MCP-REF-005 |
| SK-011 | Parallel Algorithm Patterns | NV-REF-008, PAR-REF-002, AIK-REF-002 |
| SK-012 | Warp Primitives | NV-REF-008, COM-REF-006, COM-REF-007 |
| SK-013 | Stencil/Convolution | PAR-REF-002 |
| SK-014 | NVENC/NVDEC | (Limited references found) |
| SK-015 | GPU Benchmarking | MCP-REF-002, PAR-REF-004 |
| SK-016 | CUTLASS/Triton | GFX-REF-001, GFX-REF-002, AI-REF-002, AI-REF-003 |
| SK-017 | CUDA Graphs | NV-REF-009 |
| SK-018 | Unified Memory | NV-REF-008 |

| Agent ID | Agent Name | Primary References |
|----------|------------|-------------------|
| AG-001 | CUDA Kernel Expert | AI-REF-001, AI-REF-004, GFX-REF-001 |
| AG-002 | GPU Performance Engineer | NV-REF-001, NV-REF-002, AI-REF-007 |
| AG-003 | Parallel Algorithm Designer | NV-REF-008, PAR-REF-002, AIK-REF-002 |
| AG-004 | GPU Memory Expert | NV-REF-011, NV-REF-003 |
| AG-005 | Multi-GPU Systems Expert | NV-REF-007, MCP-REF-003, COM-REF-005 |
| AG-006 | Tensor Core Specialist | NV-REF-005, NV-REF-010 |
| AG-007 | Cross-Platform GPU Expert | AMD-REF-001, AMD-REF-002, AMD-REF-003 |
| AG-008 | Graphics Compute Expert | SK-REF-002, SK-REF-003, SK-REF-004, GFX-REF-004 |
| AG-009 | ML Inference Optimizer | NV-REF-004, NV-REF-005, NV-REF-006, MCP-REF-001 |
| AG-010 | GPU Debugging Specialist | NV-REF-003, MCP-REF-005 |
| AG-011 | Real-Time Processing Agent | (Limited references found) |
| AG-012 | HPC Domain Expert | PAR-REF-001, COM-REF-005 |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Claude Skills/Plugins | 4 |
| MCP Servers/Integrations | 5 |
| AI-Powered GPU Tools | 7 |
| NVIDIA Tools/Libraries | 11 |
| AMD ROCm Tools | 4 |
| Graphics/Shader Tools | 7 |
| Parallel Computing Resources | 5 |
| AI Kernel Generation | 2 |
| Community Resources | 7 |
| **Total References** | **52** |

---

## Gaps Identified

The following areas have limited community tool support:

1. **NVENC/NVDEC** (SK-014): No Claude skills or MCPs found for video encoding/decoding
2. **Real-Time Processing** (AG-011): Limited agent-specific tools for GPU video/image pipelines
3. **Stencil Computation** (SK-013): No dedicated tools beyond general CUDA resources
4. **CUDA Graphs** (SK-017): Limited tooling beyond NVIDIA samples
5. **Unified Memory** (SK-018): Integrated into Thrust but no dedicated Claude skills

---

## Recommendations

1. **Prioritize Integration**: Start with RightNow CLI (AI-REF-001) and Flox CUDA (SK-REF-001) for immediate CUDA development support
2. **MCP Development**: Leverage NVIDIA NeMo Agent Toolkit (MCP-REF-001) for GPU-accelerated AI agent workflows
3. **Cross-Platform**: Use HIPIFY tools (AMD-REF-002) for CUDA-to-HIP portability
4. **Shader Development**: Combine WebGPU skill (SK-REF-002) with Shader Fundamentals (SK-REF-003) for graphics compute
5. **Performance Analysis**: Integrate Nsight tools (NV-REF-001, NV-REF-002) with Claude debugging MCP (MCP-REF-005)

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Compiled
**Total References Found**: 52
**Categories Covered**: 9
