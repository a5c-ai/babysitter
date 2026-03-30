---
name: cuda-debugging
description: Expert skill for GPU debugging using CUDA-GDB and NVIDIA Compute Sanitizer. Detect memory errors, race conditions, uninitialized memory access, validate atomic operations, analyze kernel synchronization issues, and generate debugging reports with recommendations.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: debugging
  backlog-id: SK-010
---

# cuda-debugging

You are **cuda-debugging** - a specialized skill for GPU debugging and error detection using NVIDIA's Compute Sanitizer and CUDA-GDB tools. This skill provides expert capabilities for identifying and resolving correctness issues in CUDA programs.

## Overview

This skill enables AI-powered GPU debugging operations including:
- Executing compute-sanitizer memory checks (memcheck)
- Detecting race conditions with racecheck tool
- Identifying memory leaks and invalid accesses
- Using CUDA-GDB for kernel debugging
- Analyzing kernel synchronization issues
- Validating atomic operation correctness
- Detecting uninitialized memory access (initcheck)
- Generating debugging reports with actionable recommendations

## Prerequisites

- NVIDIA CUDA Toolkit 11.0+ with compute-sanitizer
- CUDA-GDB for interactive debugging
- GPU with debugging support (compute capability 3.5+)
- Debug build of CUDA application (-G -lineinfo flags)
- Optional: Nsight Visual Studio Code Extension

## Capabilities

### 1. Memory Error Detection (Memcheck)

Detect memory access errors and leaks:

```bash
# Basic memory check
compute-sanitizer --tool memcheck ./cuda_program

# With detailed error reporting
compute-sanitizer --tool memcheck --report-api-errors all ./cuda_program

# Log errors to file
compute-sanitizer --tool memcheck --log-file memcheck.log ./cuda_program

# Check for memory leaks
compute-sanitizer --tool memcheck --leak-check full ./cuda_program

# Track allocations
compute-sanitizer --tool memcheck --track-alloc-dealloc yes ./cuda_program
```

Common memory errors detected:
- Out-of-bounds global memory access
- Misaligned memory access
- Invalid global memory access
- Memory leaks (device allocations not freed)
- Double free errors
- Invalid device pointer operations

### 2. Race Condition Detection (Racecheck)

Detect shared memory data access hazards:

```bash
# Basic race check
compute-sanitizer --tool racecheck ./cuda_program

# With detailed analysis
compute-sanitizer --tool racecheck --racecheck-report all ./cuda_program

# Save analysis to file
compute-sanitizer --tool racecheck --save racecheck.nvsanreport ./cuda_program

# Analyze previous run
compute-sanitizer --tool racecheck --import racecheck.nvsanreport --print-analysis ./cuda_program
```

Race condition types detected:
- Write-after-read (WAR) hazards
- Write-after-write (WAW) hazards
- Read-after-write (RAW) hazards
- Bank conflicts in shared memory
- Synchronization-related races

### 3. Uninitialized Memory Detection (Initcheck)

Detect uninitialized global memory access:

```bash
# Basic initcheck
compute-sanitizer --tool initcheck ./cuda_program

# Track all memory accesses
compute-sanitizer --tool initcheck --track-unused-memory yes ./cuda_program

# With error details
compute-sanitizer --tool initcheck --show-backtrace yes ./cuda_program
```

### 4. Synchronization Validation (Synccheck)

Detect illegal synchronization in CUDA code:

```bash
# Basic synccheck
compute-sanitizer --tool synccheck ./cuda_program

# With detailed reporting
compute-sanitizer --tool synccheck --show-backtrace all ./cuda_program
```

Synchronization issues detected:
- Divergent `__syncthreads()` calls
- Invalid thread block synchronization
- Illegal cooperative groups usage
- Missing synchronization barriers

### 5. CUDA-GDB Debugging Commands

Interactive debugging with CUDA-GDB:

```bash
# Launch CUDA-GDB
cuda-gdb ./cuda_program

# Common debugging commands
(cuda-gdb) set cuda memcheck on        # Enable memory checking
(cuda-gdb) set cuda break_on_launch    # Break at kernel launch
(cuda-gdb) break kernel_name           # Set breakpoint at kernel
(cuda-gdb) run                         # Start execution

# Thread navigation
(cuda-gdb) info cuda threads           # List all GPU threads
(cuda-gdb) cuda thread (0,0,0) (0,0,0) # Switch to specific thread
(cuda-gdb) cuda block                  # Show current block
(cuda-gdb) cuda kernel                 # Show current kernel

# Memory inspection
(cuda-gdb) print *d_array@10           # Print device array
(cuda-gdb) print __shared_memory__     # Inspect shared memory
(cuda-gdb) info cuda devices           # List CUDA devices

# Stepping through code
(cuda-gdb) cuda step                   # Step one warp instruction
(cuda-gdb) cuda next                   # Step over function calls
(cuda-gdb) continue                    # Continue execution
```

### 6. Common Debugging Patterns

#### Pattern 1: Memory Bounds Checking

```cuda
// Add bounds checking to kernel
__global__ void safeKernel(float* data, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;

    // Bounds check
    if (idx >= n) return;

    // Safe access
    data[idx] = data[idx] * 2.0f;
}
```

#### Pattern 2: Shared Memory Synchronization

```cuda
__global__ void reductionKernel(float* input, float* output, int n) {
    __shared__ float sdata[256];

    int tid = threadIdx.x;
    int idx = blockIdx.x * blockDim.x + threadIdx.x;

    // Load to shared memory
    sdata[tid] = (idx < n) ? input[idx] : 0.0f;
    __syncthreads();  // Required before reading shared memory

    // Reduction in shared memory
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (tid < s) {
            sdata[tid] += sdata[tid + s];
        }
        __syncthreads();  // Required after each reduction step
    }

    if (tid == 0) {
        output[blockIdx.x] = sdata[0];
    }
}
```

#### Pattern 3: Atomic Operation Validation

```cuda
// Validate atomic operations
__global__ void atomicTest(int* counter, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        // Use atomicAdd for thread-safe increment
        atomicAdd(counter, 1);
    }
}

// Verify result on host
int h_counter;
cudaMemcpy(&h_counter, d_counter, sizeof(int), cudaMemcpyDeviceToHost);
assert(h_counter == n);  // Should equal number of threads
```

### 7. Error Code Handling

Comprehensive CUDA error checking:

```cuda
// Error checking macro
#define CUDA_CHECK(call) \
    do { \
        cudaError_t err = call; \
        if (err != cudaSuccess) { \
            fprintf(stderr, "CUDA Error at %s:%d: %s\n", \
                    __FILE__, __LINE__, cudaGetErrorString(err)); \
            exit(EXIT_FAILURE); \
        } \
    } while(0)

// Usage
CUDA_CHECK(cudaMalloc(&d_data, size));
CUDA_CHECK(cudaMemcpy(d_data, h_data, size, cudaMemcpyHostToDevice));

// Check for kernel errors
myKernel<<<blocks, threads>>>(d_data, n);
CUDA_CHECK(cudaGetLastError());       // Check launch errors
CUDA_CHECK(cudaDeviceSynchronize());  // Check execution errors
```

### 8. Debugging Report Generation

Generate comprehensive debugging reports:

```bash
# Full debugging session
compute-sanitizer --tool memcheck \
    --report-api-errors all \
    --show-backtrace yes \
    --log-file debug_report.txt \
    ./cuda_program 2>&1 | tee debug_output.log

# Summary report generation
echo "=== CUDA Debugging Report ===" > debug_summary.md
echo "Date: $(date)" >> debug_summary.md
echo "" >> debug_summary.md
echo "## Memory Check Results" >> debug_summary.md
compute-sanitizer --tool memcheck ./cuda_program 2>&1 >> debug_summary.md
echo "" >> debug_summary.md
echo "## Race Check Results" >> debug_summary.md
compute-sanitizer --tool racecheck ./cuda_program 2>&1 >> debug_summary.md
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| claude-debugs-for-you | Interactive debugging via Claude | [GitHub](https://github.com/jasonjmcghee/claude-debugs-for-you) |

## Best Practices

### Debugging Build Configuration

```makefile
# Debug build flags
DEBUG_FLAGS = -G -lineinfo -Xcompiler -rdynamic -O0

# Release build with symbols
RELEASE_FLAGS = -O3 -lineinfo

# Compile for debugging
nvcc $(DEBUG_FLAGS) -o program_debug program.cu

# Compile for profiling (with symbols)
nvcc $(RELEASE_FLAGS) -o program_release program.cu
```

### Debugging Strategy

1. **Start with memcheck** - Catches most common errors
2. **Run racecheck if results are inconsistent** - Finds synchronization bugs
3. **Use initcheck for data corruption** - Finds uninitialized reads
4. **Profile after correctness** - Don't optimize buggy code

### Common Pitfalls

| Issue | Symptom | Solution |
|-------|---------|----------|
| Uncoalesced access | Memory errors at specific offsets | Align data to 128 bytes |
| Missing sync | Intermittent wrong results | Add `__syncthreads()` |
| Out of bounds | Access violation errors | Add bounds checking |
| Uninitialized shared memory | Random values | Initialize before use |

## Process Integration

This skill integrates with the following processes:
- `gpu-debugging-techniques.js` - Comprehensive debugging workflows
- `gpu-performance-regression-testing.js` - Correctness verification
- `atomic-operations-synchronization.js` - Synchronization validation

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "memory-check",
  "status": "errors_found",
  "tool": "compute-sanitizer",
  "summary": {
    "total_errors": 3,
    "memory_errors": 2,
    "leak_errors": 1
  },
  "errors": [
    {
      "type": "Invalid __global__ read",
      "size": 4,
      "address": "0x7f1234567890",
      "location": {
        "file": "kernel.cu",
        "line": 42,
        "function": "processData"
      },
      "thread": "(128, 0, 0)",
      "block": "(3, 0, 0)"
    }
  ],
  "recommendations": [
    "Add bounds check at line 42",
    "Verify array size matches grid dimensions"
  ],
  "artifacts": ["debug_report.txt", "memcheck.log"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invalid __global__ read` | Out-of-bounds access | Add bounds checking |
| `Potential WAW hazard` | Missing synchronization | Add `__syncthreads()` |
| `Memory leak` | Missing cudaFree | Free all allocations |
| `Uninitialized __global__ read` | Reading before write | Initialize memory |

## Constraints

- Debug builds are significantly slower than release builds
- Compute-sanitizer adds overhead; don't use in production
- Some race conditions may not appear consistently
- GPU must support debugging (sm_35+)
- CUDA-GDB requires X11 forwarding for remote debugging
