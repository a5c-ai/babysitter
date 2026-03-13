# GPU Programming and Parallel Computing References

## Official Documentation

### NVIDIA CUDA

#### CUDA Toolkit Documentation
- **CUDA C++ Programming Guide**
  - URL: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
  - Description: Comprehensive guide covering CUDA programming model, memory hierarchy, execution configuration, and optimization techniques
  - Topics: Thread hierarchy, memory spaces, synchronization, streams, dynamic parallelism

- **CUDA C++ Best Practices Guide**
  - URL: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
  - Description: Performance optimization strategies and best practices for CUDA applications
  - Topics: Memory optimization, execution configuration, instruction optimization, profiling

- **CUDA Runtime API Reference**
  - URL: https://docs.nvidia.com/cuda/cuda-runtime-api/
  - Description: Complete reference for CUDA runtime API functions
  - Topics: Device management, memory management, streams, events, error handling

- **CUDA Math API Reference**
  - URL: https://docs.nvidia.com/cuda/cuda-math-api/
  - Description: Mathematical functions available in CUDA device code
  - Topics: Intrinsic functions, single/double precision, special functions

#### CUDA Libraries

- **cuBLAS Documentation**
  - URL: https://docs.nvidia.com/cuda/cublas/
  - Description: GPU-accelerated Basic Linear Algebra Subprograms library
  - Topics: Matrix operations, GEMM, batched operations, mixed precision

- **cuDNN Documentation**
  - URL: https://docs.nvidia.com/deeplearning/cudnn/
  - Description: GPU-accelerated library for deep neural networks
  - Topics: Convolutions, pooling, normalization, RNNs, attention mechanisms

- **cuFFT Documentation**
  - URL: https://docs.nvidia.com/cuda/cufft/
  - Description: GPU-accelerated Fast Fourier Transform library
  - Topics: 1D/2D/3D transforms, batched FFTs, callbacks

- **Thrust Documentation**
  - URL: https://docs.nvidia.com/cuda/thrust/
  - Description: C++ parallel algorithms library for CUDA
  - Topics: Vectors, iterators, algorithms, execution policies

- **NCCL Documentation**
  - URL: https://docs.nvidia.com/deeplearning/nccl/
  - Description: Multi-GPU and multi-node collective communication library
  - Topics: All-reduce, broadcast, scatter/gather, ring algorithms

### NVIDIA Profiling Tools

- **Nsight Systems Documentation**
  - URL: https://docs.nvidia.com/nsight-systems/
  - Description: System-wide performance analysis tool
  - Topics: Timeline analysis, CPU-GPU correlation, API tracing

- **Nsight Compute Documentation**
  - URL: https://docs.nvidia.com/nsight-compute/
  - Description: Interactive kernel profiler for CUDA applications
  - Topics: Roofline analysis, memory throughput, occupancy, source correlation

### OpenCL

- **OpenCL Specification**
  - URL: https://registry.khronos.org/OpenCL/specs/3.0-unified/html/OpenCL_API.html
  - Description: Official Khronos Group OpenCL 3.0 specification
  - Topics: Platform model, execution model, memory model, programming interface

- **OpenCL C Language Specification**
  - URL: https://registry.khronos.org/OpenCL/specs/3.0-unified/html/OpenCL_C.html
  - Description: OpenCL C language specification for kernel programming
  - Topics: Data types, built-in functions, address spaces, qualifiers

- **OpenCL Reference Pages**
  - URL: https://man.opencl.org/
  - Description: Quick reference for OpenCL API functions
  - Topics: Function signatures, parameters, return values

### AMD ROCm

- **ROCm Documentation**
  - URL: https://rocm.docs.amd.com/
  - Description: AMD's open-source GPU computing platform documentation
  - Topics: HIP programming, ROCm libraries, tools, deployment

- **HIP Programming Guide**
  - URL: https://rocm.docs.amd.com/projects/HIP/
  - Description: Portable GPU programming interface documentation
  - Topics: HIP API, CUDA porting, kernel syntax, runtime functions

- **rocBLAS Documentation**
  - URL: https://rocm.docs.amd.com/projects/rocBLAS/
  - Description: AMD's GPU-accelerated BLAS library
  - Topics: BLAS levels 1-3, batched operations, mixed precision

### Intel oneAPI

- **Intel oneAPI Documentation**
  - URL: https://www.intel.com/content/www/us/en/developer/tools/oneapi/documentation.html
  - Description: Intel's unified programming model for heterogeneous computing
  - Topics: DPC++, SYCL, oneMKL, oneDNN

- **SYCL Specification**
  - URL: https://registry.khronos.org/SYCL/specs/sycl-2020/html/sycl-2020.html
  - Description: Khronos SYCL 2020 specification for C++ heterogeneous computing
  - Topics: Queues, buffers, accessors, kernels, USM

## Graphics API Compute Shaders

### Vulkan

- **Vulkan Specification**
  - URL: https://registry.khronos.org/vulkan/specs/1.3-extensions/html/
  - Description: Official Vulkan API specification
  - Topics: Compute pipelines, shader modules, descriptor sets, synchronization

- **Vulkan Tutorial - Compute Shaders**
  - URL: https://vulkan-tutorial.com/Compute_Shader
  - Description: Step-by-step tutorial for Vulkan compute shaders
  - Topics: Pipeline creation, dispatch, buffer management

### DirectX

- **DirectCompute Programming Guide**
  - URL: https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-compute-shader
  - Description: Microsoft's guide to compute shaders in Direct3D
  - Topics: Thread groups, UAVs, structured buffers, dispatch

- **HLSL Documentation**
  - URL: https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl
  - Description: High-Level Shading Language reference
  - Topics: Shader semantics, intrinsic functions, resource binding

### Metal

- **Metal Shading Language Specification**
  - URL: https://developer.apple.com/metal/Metal-Shading-Language-Specification.pdf
  - Description: Apple's Metal shading language specification
  - Topics: Compute functions, address spaces, atomic operations

- **Metal Best Practices Guide**
  - URL: https://developer.apple.com/library/archive/documentation/3DDrawing/Conceptual/MTLBestPracticesGuide/
  - Description: Performance optimization for Metal applications
  - Topics: Resource management, command encoding, GPU-CPU synchronization

## Academic Papers and Research

### Foundational Papers

- **CUDA: Scalable Parallel Programming for High-Performance Scientific Computing**
  - Authors: John Nickolls, Ian Buck, Michael Garland, Kevin Skadron
  - Publication: IEEE Transactions on Parallel and Distributed Systems, 2008
  - Topics: CUDA programming model introduction, scalability, scientific applications

- **Parallel Prefix Sum (Scan) with CUDA**
  - Authors: Mark Harris, Shubhabrata Sengupta, John D. Owens
  - Publication: GPU Gems 3, Chapter 39
  - Topics: Work-efficient scan, bank conflict avoidance, large array handling

- **Optimizing Parallel Reduction in CUDA**
  - Authors: Mark Harris
  - Publication: NVIDIA Developer Technology
  - Topics: Sequential addressing, warp-level optimization, template metaprogramming

### Performance Optimization

- **Roofline: An Insightful Visual Performance Model for Multicore Architectures**
  - Authors: Samuel Williams, Andrew Waterman, David Patterson
  - Publication: Communications of the ACM, 2009
  - Topics: Performance modeling, memory bandwidth, computational intensity

- **Memory Bandwidth and Machine Balance in Current High Performance Computers**
  - Authors: John D. McCalpin
  - Publication: IEEE Technical Committee on Computer Architecture Newsletter, 1995
  - Topics: STREAM benchmark, memory bandwidth measurement

### Algorithm Design

- **GPU Computing Gems (Jade and Emerald Editions)**
  - Editor: Wen-mei W. Hwu
  - Publisher: Morgan Kaufmann
  - Topics: Scientific computing, image processing, finance, simulation

- **Programming Massively Parallel Processors**
  - Authors: David B. Kirk, Wen-mei W. Hwu
  - Publisher: Morgan Kaufmann
  - Topics: CUDA programming, parallel patterns, optimization, applications

## Online Courses and Tutorials

### Video Courses

- **NVIDIA Deep Learning Institute (DLI)**
  - URL: https://www.nvidia.com/en-us/training/
  - Description: Official NVIDIA training courses on GPU computing
  - Topics: CUDA fundamentals, optimization, deep learning, HPC

- **Coursera: Heterogeneous Parallel Programming**
  - URL: https://www.coursera.org/learn/heterogeneous
  - Description: University of Illinois course on GPU programming
  - Instructor: Wen-mei W. Hwu
  - Topics: CUDA programming model, memory optimization, algorithms

- **Udacity: Intro to Parallel Programming**
  - URL: https://www.udacity.com/course/intro-to-parallel-programming--cs344
  - Description: Introduction to GPU programming with CUDA
  - Topics: GPU architecture, CUDA basics, parallel algorithms

### Interactive Tutorials

- **NVIDIA CUDA Samples**
  - URL: https://github.com/NVIDIA/cuda-samples
  - Description: Official CUDA code samples demonstrating various features
  - Topics: Basic operations, libraries, advanced features, utilities

- **GPU Programming Tutorial (Oak Ridge National Laboratory)**
  - URL: https://www.olcf.ornl.gov/cuda-training-series/
  - Description: HPC-focused CUDA training materials
  - Topics: HPC optimization, multi-GPU, profiling, debugging

## Community Resources

### Forums and Discussion

- **NVIDIA Developer Forums**
  - URL: https://forums.developer.nvidia.com/
  - Description: Official NVIDIA developer community forums
  - Topics: CUDA, graphics, deep learning, autonomous vehicles

- **Stack Overflow - CUDA Tag**
  - URL: https://stackoverflow.com/questions/tagged/cuda
  - Description: Q&A for CUDA programming questions
  - Topics: Troubleshooting, best practices, code review

- **Reddit r/CUDA**
  - URL: https://www.reddit.com/r/CUDA/
  - Description: Community discussion on CUDA programming
  - Topics: News, questions, project showcases

### Blogs and Articles

- **NVIDIA Technical Blog**
  - URL: https://developer.nvidia.com/blog/
  - Description: Technical articles from NVIDIA engineers
  - Topics: New features, optimization techniques, case studies

- **Lei Mao's Log Book**
  - URL: https://leimao.github.io/
  - Description: Technical blog with in-depth CUDA articles
  - Topics: CUDA internals, optimization, tensor cores

- **Bruce Dawson's Blog**
  - URL: https://randomascii.wordpress.com/
  - Description: Performance analysis and GPU programming insights
  - Topics: Profiling, debugging, performance optimization

## Tools and Utilities

### Profilers

- **NVIDIA Nsight Graphics**
  - URL: https://developer.nvidia.com/nsight-graphics
  - Description: Graphics debugging and profiling tool
  - Topics: Frame debugging, shader profiling, GPU trace

- **AMD Radeon GPU Profiler**
  - URL: https://gpuopen.com/rgp/
  - Description: Low-level GPU profiler for AMD GPUs
  - Topics: Wavefront occupancy, memory access, barriers

- **PIX for Windows**
  - URL: https://devblogs.microsoft.com/pix/
  - Description: Microsoft's GPU profiler for DirectX
  - Topics: GPU capture, timing, shader debugging

### Compilers and Build Tools

- **NVCC Documentation**
  - URL: https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/
  - Description: NVIDIA CUDA Compiler documentation
  - Topics: Compilation phases, flags, PTX generation

- **LLVM/Clang CUDA Support**
  - URL: https://llvm.org/docs/CompileCudaWithLLVM.html
  - Description: Compiling CUDA with Clang
  - Topics: Alternative compilation, cross-compilation

### Libraries and Frameworks

- **CUB**
  - URL: https://nvlabs.github.io/cub/
  - Description: Cooperative primitives for CUDA kernel authors
  - Topics: Block-wide primitives, device-wide algorithms, warp operations

- **ModernGPU**
  - URL: https://moderngpu.github.io/
  - Description: High-performance GPU computing primitives
  - Topics: Merge, sorted operations, segmented operations

- **CUTLASS**
  - URL: https://github.com/NVIDIA/cutlass
  - Description: CUDA Templates for Linear Algebra Subroutines
  - Topics: GEMM, convolution, tensor core utilization

## Hardware Architecture References

### NVIDIA GPU Architecture

- **NVIDIA GPU Architecture Whitepapers**
  - URL: https://www.nvidia.com/en-us/geforce/technologies/
  - Description: Technical overviews of NVIDIA GPU architectures
  - Topics: SM architecture, memory subsystem, tensor cores, RT cores

- **CUDA Binary Utilities**
  - URL: https://docs.nvidia.com/cuda/cuda-binary-utilities/
  - Description: Tools for inspecting CUDA binaries
  - Topics: cuobjdump, nvdisasm, PTX analysis

### AMD GPU Architecture

- **AMD RDNA Architecture Whitepaper**
  - URL: https://www.amd.com/en/technologies/rdna
  - Description: Technical overview of AMD RDNA architecture
  - Topics: Compute units, cache hierarchy, wave management

- **AMD CDNA Architecture**
  - URL: https://www.amd.com/en/technologies/cdna
  - Description: AMD data center GPU architecture documentation
  - Topics: Matrix cores, infinity fabric, HBM memory

## Benchmarks and Testing

### Standard Benchmarks

- **SPEC ACCEL**
  - URL: https://www.spec.org/accel/
  - Description: Standard Performance Evaluation Corporation GPU benchmarks
  - Topics: Application benchmarking, performance comparison

- **Rodinia Benchmark Suite**
  - URL: http://lava.cs.virginia.edu/Rodinia/
  - Description: Benchmark suite for heterogeneous computing
  - Topics: Diverse workloads, OpenMP/CUDA/OpenCL implementations

- **Parboil Benchmark Suite**
  - URL: http://impact.crhc.illinois.edu/parboil/parboil.aspx
  - Description: Throughput computing benchmarks
  - Topics: Scientific computing, media processing

### Testing Tools

- **compute-sanitizer**
  - URL: https://docs.nvidia.com/cuda/compute-sanitizer/
  - Description: Functional correctness checking tool for CUDA
  - Topics: Memory errors, race conditions, initialization checks

- **AMD ROCm Validation Suite**
  - URL: https://github.com/ROCm/ROCmValidationSuite
  - Description: Validation tools for AMD ROCm platform
  - Topics: GPU diagnostics, stress testing, qualification
