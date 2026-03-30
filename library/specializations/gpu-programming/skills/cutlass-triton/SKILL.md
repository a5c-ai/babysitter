---
name: cutlass-triton
description: High-performance kernel template libraries and DSLs. Generate CUTLASS GEMM configurations, implement Triton kernel definitions, configure epilogue operations, tune tile sizes and warp arrangements, and benchmark against cuBLAS.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: kernel-generation
  backlog-id: SK-016
---

# cutlass-triton

You are **cutlass-triton** - a specialized skill for high-performance kernel template libraries and domain-specific languages. This skill provides expert capabilities for generating optimized GPU kernels using CUTLASS and Triton.

## Overview

This skill enables AI-powered kernel generation including:
- Generate CUTLASS GEMM configurations
- Implement Triton kernel definitions
- Configure epilogue operations
- Handle tensor layout transformations
- Tune tile sizes and warp arrangements
- Support mixed-precision matrix operations
- Benchmark against cuBLAS implementations
- Generate custom attention kernels

## Prerequisites

- CUTLASS 3.0+ (header-only library)
- Triton 2.0+ (Python package)
- CUDA Toolkit 11.0+
- Python 3.8+ (for Triton)

## Capabilities

### 1. CUTLASS GEMM Configuration

Configure high-performance GEMM:

```cpp
#include <cutlass/cutlass.h>
#include <cutlass/gemm/device/gemm.h>

// Define GEMM operation types
using ElementA = cutlass::half_t;
using ElementB = cutlass::half_t;
using ElementC = cutlass::half_t;
using ElementAccumulator = float;

using LayoutA = cutlass::layout::RowMajor;
using LayoutB = cutlass::layout::ColumnMajor;
using LayoutC = cutlass::layout::RowMajor;

// Define CUTLASS GEMM
using Gemm = cutlass::gemm::device::Gemm<
    ElementA, LayoutA,
    ElementB, LayoutB,
    ElementC, LayoutC,
    ElementAccumulator,
    cutlass::arch::OpClassTensorOp,
    cutlass::arch::Sm80,
    cutlass::gemm::GemmShape<128, 256, 64>,  // Thread block shape
    cutlass::gemm::GemmShape<64, 64, 64>,    // Warp shape
    cutlass::gemm::GemmShape<16, 8, 16>,     // Instruction shape (tensor core)
    cutlass::epilogue::thread::LinearCombination<
        ElementC, 128 / cutlass::sizeof_bits<ElementC>::value,
        ElementAccumulator, ElementAccumulator>,
    cutlass::gemm::threadblock::GemmIdentityThreadblockSwizzle<>,
    3  // Stages
>;

// Run GEMM
void runGemm(int M, int N, int K,
             ElementA* A, ElementB* B, ElementC* C,
             ElementAccumulator alpha, ElementAccumulator beta) {
    Gemm gemm_op;
    Gemm::Arguments args(
        {M, N, K},
        {A, K}, {B, K}, {C, N}, {C, N},
        {alpha, beta}
    );

    cutlass::Status status = gemm_op(args);
    if (status != cutlass::Status::kSuccess) {
        // Handle error
    }
}
```

### 2. CUTLASS 3.0 (Cute) API

Modern CUTLASS with Cute:

```cpp
#include <cute/tensor.hpp>
#include <cutlass/gemm/collective/collective_mma.hpp>

using namespace cute;

// Define layouts using Cute
using SmemLayoutA = Layout<Shape<_128, _64>, Stride<_64, _1>>;
using SmemLayoutB = Layout<Shape<_64, _128>, Stride<_1, _64>>;

// Collective MMA configuration
using CollectiveMma = cutlass::gemm::collective::CollectiveMma<
    cutlass::arch::Sm90,
    Shape<_128, _256, _64>,  // Tile shape
    ElementA, cutlass::layout::RowMajor,
    ElementB, cutlass::layout::ColumnMajor,
    ElementAccumulator,
    TiledMMA<
        MMA_Atom<SM80_16x8x16_F32F16F16F32_TN>,
        Layout<Shape<_2, _2, _1>>
    >,
    GmemTiledCopyA, SmemLayoutA, SmemCopyAtomA,
    GmemTiledCopyB, SmemLayoutB, SmemCopyAtomB
>;
```

### 3. Triton Kernel Development

Write kernels in Triton DSL:

```python
import triton
import triton.language as tl

@triton.jit
def matmul_kernel(
    a_ptr, b_ptr, c_ptr,
    M, N, K,
    stride_am, stride_ak,
    stride_bk, stride_bn,
    stride_cm, stride_cn,
    BLOCK_M: tl.constexpr, BLOCK_N: tl.constexpr, BLOCK_K: tl.constexpr,
):
    # Program ID
    pid_m = tl.program_id(0)
    pid_n = tl.program_id(1)

    # Block offsets
    offs_m = pid_m * BLOCK_M + tl.arange(0, BLOCK_M)
    offs_n = pid_n * BLOCK_N + tl.arange(0, BLOCK_N)
    offs_k = tl.arange(0, BLOCK_K)

    # Pointers to first block
    a_ptrs = a_ptr + offs_m[:, None] * stride_am + offs_k[None, :] * stride_ak
    b_ptrs = b_ptr + offs_k[:, None] * stride_bk + offs_n[None, :] * stride_bn

    # Initialize accumulator
    acc = tl.zeros((BLOCK_M, BLOCK_N), dtype=tl.float32)

    # Main loop
    for k in range(0, K, BLOCK_K):
        # Load blocks
        a = tl.load(a_ptrs, mask=offs_k[None, :] < K - k, other=0.0)
        b = tl.load(b_ptrs, mask=offs_k[:, None] < K - k, other=0.0)

        # Compute
        acc += tl.dot(a, b)

        # Advance pointers
        a_ptrs += BLOCK_K * stride_ak
        b_ptrs += BLOCK_K * stride_bk

    # Store result
    c_ptrs = c_ptr + offs_m[:, None] * stride_cm + offs_n[None, :] * stride_cn
    tl.store(c_ptrs, acc, mask=(offs_m[:, None] < M) & (offs_n[None, :] < N))


def matmul(a, b):
    M, K = a.shape
    K, N = b.shape
    c = torch.empty((M, N), device=a.device, dtype=a.dtype)

    grid = lambda meta: (
        triton.cdiv(M, meta['BLOCK_M']),
        triton.cdiv(N, meta['BLOCK_N'])
    )

    matmul_kernel[grid](
        a, b, c,
        M, N, K,
        a.stride(0), a.stride(1),
        b.stride(0), b.stride(1),
        c.stride(0), c.stride(1),
        BLOCK_M=64, BLOCK_N=64, BLOCK_K=32
    )
    return c
```

### 4. Triton Auto-tuning

Automatic kernel tuning:

```python
@triton.autotune(
    configs=[
        triton.Config({'BLOCK_M': 64, 'BLOCK_N': 64, 'BLOCK_K': 32}, num_stages=3, num_warps=4),
        triton.Config({'BLOCK_M': 128, 'BLOCK_N': 64, 'BLOCK_K': 32}, num_stages=3, num_warps=4),
        triton.Config({'BLOCK_M': 64, 'BLOCK_N': 128, 'BLOCK_K': 32}, num_stages=3, num_warps=4),
        triton.Config({'BLOCK_M': 128, 'BLOCK_N': 128, 'BLOCK_K': 32}, num_stages=3, num_warps=8),
        triton.Config({'BLOCK_M': 128, 'BLOCK_N': 256, 'BLOCK_K': 64}, num_stages=4, num_warps=8),
    ],
    key=['M', 'N', 'K']
)
@triton.jit
def matmul_autotune(
    a_ptr, b_ptr, c_ptr,
    M, N, K,
    stride_am, stride_ak,
    stride_bk, stride_bn,
    stride_cm, stride_cn,
    BLOCK_M: tl.constexpr, BLOCK_N: tl.constexpr, BLOCK_K: tl.constexpr,
):
    # Same kernel body...
    pass
```

### 5. Epilogue Operations

Custom post-processing:

```cpp
// CUTLASS epilogue with activation
using EpilogueOp = cutlass::epilogue::thread::LinearCombinationRelu<
    ElementC,
    128 / cutlass::sizeof_bits<ElementC>::value,
    ElementAccumulator,
    ElementAccumulator
>;

// Fused bias + activation
using EpilogueWithBias = cutlass::epilogue::thread::LinearCombinationBias<
    ElementC,
    128 / cutlass::sizeof_bits<ElementC>::value,
    ElementAccumulator,
    ElementAccumulator,
    cutlass::epilogue::thread::ReLu
>;
```

```python
# Triton epilogue
@triton.jit
def fused_matmul_relu(
    a_ptr, b_ptr, bias_ptr, c_ptr,
    M, N, K,
    # ... strides ...
    BLOCK_M: tl.constexpr, BLOCK_N: tl.constexpr, BLOCK_K: tl.constexpr,
):
    # ... matmul computation ...

    # Epilogue: add bias and ReLU
    bias = tl.load(bias_ptr + offs_n)
    acc = acc + bias[None, :]
    acc = tl.maximum(acc, 0.0)

    tl.store(c_ptrs, acc, mask=mask)
```

### 6. Flash Attention in Triton

Optimized attention kernel:

```python
@triton.jit
def flash_attention_kernel(
    Q, K, V, Out,
    stride_qz, stride_qh, stride_qm, stride_qk,
    stride_kz, stride_kh, stride_kn, stride_kk,
    stride_vz, stride_vh, stride_vn, stride_vk,
    stride_oz, stride_oh, stride_om, stride_ok,
    Z, H, M, N,
    BLOCK_M: tl.constexpr, BLOCK_N: tl.constexpr, BLOCK_K: tl.constexpr,
):
    pid_m = tl.program_id(0)
    pid_z = tl.program_id(1)
    pid_h = tl.program_id(2)

    # Initialize
    offs_m = pid_m * BLOCK_M + tl.arange(0, BLOCK_M)
    offs_n = tl.arange(0, BLOCK_N)
    offs_k = tl.arange(0, BLOCK_K)

    # Load Q block
    q_ptrs = Q + pid_z * stride_qz + pid_h * stride_qh + \
             offs_m[:, None] * stride_qm + offs_k[None, :] * stride_qk
    q = tl.load(q_ptrs, mask=offs_m[:, None] < M)

    # Running max and sum for online softmax
    m_i = tl.zeros([BLOCK_M], dtype=tl.float32) - float('inf')
    l_i = tl.zeros([BLOCK_M], dtype=tl.float32)
    acc = tl.zeros([BLOCK_M, BLOCK_K], dtype=tl.float32)

    # Iterate over K, V blocks
    for start_n in range(0, N, BLOCK_N):
        # Load K, V blocks
        # Compute attention scores
        # Online softmax update
        # Accumulate output
        pass

    # Store output
    o_ptrs = Out + pid_z * stride_oz + pid_h * stride_oh + \
             offs_m[:, None] * stride_om + offs_k[None, :] * stride_ok
    tl.store(o_ptrs, acc, mask=offs_m[:, None] < M)
```

### 7. Benchmarking

Compare performance:

```python
import torch
import triton

def benchmark_matmul(M, N, K, dtype=torch.float16):
    a = torch.randn((M, K), device='cuda', dtype=dtype)
    b = torch.randn((K, N), device='cuda', dtype=dtype)

    # Triton
    triton_fn = lambda: triton_matmul(a, b)
    triton_ms = triton.testing.do_bench(triton_fn)

    # cuBLAS
    cublas_fn = lambda: torch.matmul(a, b)
    cublas_ms = triton.testing.do_bench(cublas_fn)

    # TFLOPS
    tflops = 2 * M * N * K / 1e12
    print(f"Triton: {triton_ms:.2f} ms ({tflops/triton_ms*1e3:.1f} TFLOPS)")
    print(f"cuBLAS: {cublas_ms:.2f} ms ({tflops/cublas_ms*1e3:.1f} TFLOPS)")
    print(f"Ratio: {cublas_ms/triton_ms:.2f}x")

# Benchmark different sizes
for size in [1024, 2048, 4096, 8192]:
    print(f"\n=== {size}x{size}x{size} ===")
    benchmark_matmul(size, size, size)
```

## Process Integration

This skill integrates with the following processes:
- `tensor-core-programming.js` - Tensor core workflows
- `custom-cuda-operator-development.js` - Custom operators
- `ml-inference-optimization.js` - ML inference

## Output Format

```json
{
  "operation": "generate-kernel",
  "framework": "triton",
  "kernel_type": "matmul",
  "configuration": {
    "BLOCK_M": 128,
    "BLOCK_N": 128,
    "BLOCK_K": 32,
    "num_stages": 3,
    "num_warps": 8
  },
  "performance": {
    "tflops": 145.2,
    "vs_cublas": 0.95,
    "memory_bound": false
  },
  "generated_files": ["matmul_kernel.py"]
}
```

## Dependencies

- CUTLASS 3.0+
- Triton 2.0+
- CUDA Toolkit 11.0+
- PyTorch (for Triton integration)

## Constraints

- CUTLASS templates increase compile time
- Triton requires Python environment
- Tensor cores need specific data types/alignments
- Performance varies by GPU architecture
