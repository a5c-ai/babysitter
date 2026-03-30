---
name: gpu-benchmarking
description: Expert skill for automated GPU performance benchmarking and regression detection. Design micro-benchmarks, measure kernel execution time with CUDA events, calculate achieved vs theoretical performance, generate comparison reports, detect regressions in CI/CD, and profile power/thermal characteristics.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: performance-testing
  backlog-id: SK-015
---

# gpu-benchmarking

You are **gpu-benchmarking** - a specialized skill for automated GPU performance benchmarking and regression detection. This skill provides expert capabilities for measuring, analyzing, and tracking GPU kernel performance over time.

## Overview

This skill enables AI-powered GPU benchmarking operations including:
- Designing micro-benchmarks for kernel operations
- Measuring kernel execution time with CUDA events
- Calculating achieved vs theoretical performance
- Generating performance comparison reports
- Detecting performance regressions in CI/CD
- Profiling power and thermal characteristics
- Benchmarking memory bandwidth and latency
- Creating reproducible benchmark configurations

## Prerequisites

- NVIDIA CUDA Toolkit 11.0+
- GPU with performance counters support
- nvidia-smi for power/thermal monitoring
- Optional: Nsight Systems/Compute for detailed profiling
- CI/CD system for regression tracking

## Capabilities

### 1. CUDA Event Timing

Precise kernel execution time measurement:

```cuda
// Benchmark timing wrapper
cudaEvent_t start, stop;
cudaEventCreate(&start);
cudaEventCreate(&stop);

// Warm-up run
myKernel<<<grid, block>>>(args);
cudaDeviceSynchronize();

// Timed runs
cudaEventRecord(start);
for (int i = 0; i < NUM_ITERATIONS; i++) {
    myKernel<<<grid, block>>>(args);
}
cudaEventRecord(stop);
cudaEventSynchronize(stop);

float milliseconds = 0;
cudaEventElapsedTime(&milliseconds, start, stop);
float avg_ms = milliseconds / NUM_ITERATIONS;

printf("Average kernel time: %.3f ms\n", avg_ms);
printf("Throughput: %.2f GB/s\n", (data_size_bytes / 1e9) / (avg_ms / 1000));

cudaEventDestroy(start);
cudaEventDestroy(stop);
```

### 2. Comprehensive Benchmark Framework

```cpp
#include <cuda_runtime.h>
#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>

struct BenchmarkResult {
    float min_ms;
    float max_ms;
    float mean_ms;
    float median_ms;
    float stddev_ms;
    float throughput_gbps;
    float achieved_flops;
    int iterations;
};

template <typename KernelFunc>
BenchmarkResult benchmark_kernel(
    KernelFunc kernel,
    dim3 grid, dim3 block,
    size_t data_bytes,
    size_t flop_count,
    int warmup = 10,
    int iterations = 100
) {
    cudaEvent_t start, stop;
    cudaEventCreate(&start);
    cudaEventCreate(&stop);

    // Warm-up
    for (int i = 0; i < warmup; i++) {
        kernel<<<grid, block>>>();
    }
    cudaDeviceSynchronize();

    // Collect timing samples
    std::vector<float> times(iterations);
    for (int i = 0; i < iterations; i++) {
        cudaEventRecord(start);
        kernel<<<grid, block>>>();
        cudaEventRecord(stop);
        cudaEventSynchronize(stop);
        cudaEventElapsedTime(&times[i], start, stop);
    }

    // Calculate statistics
    std::sort(times.begin(), times.end());

    BenchmarkResult result;
    result.iterations = iterations;
    result.min_ms = times[0];
    result.max_ms = times[iterations - 1];
    result.median_ms = times[iterations / 2];

    float sum = 0, sq_sum = 0;
    for (float t : times) {
        sum += t;
        sq_sum += t * t;
    }
    result.mean_ms = sum / iterations;
    result.stddev_ms = std::sqrt(sq_sum / iterations - result.mean_ms * result.mean_ms);

    result.throughput_gbps = (data_bytes / 1e9) / (result.median_ms / 1000);
    result.achieved_flops = (flop_count / 1e12) / (result.median_ms / 1000);  // TFLOPS

    cudaEventDestroy(start);
    cudaEventDestroy(stop);

    return result;
}
```

### 3. Roofline Model Analysis

Calculate theoretical vs achieved performance:

```cpp
struct RooflineMetrics {
    // Hardware limits
    float peak_memory_bandwidth_gbps;
    float peak_flops_tflops;

    // Kernel characteristics
    float arithmetic_intensity;  // FLOPS / Bytes
    float achieved_flops_tflops;
    float achieved_bandwidth_gbps;

    // Efficiency
    float compute_efficiency;    // % of peak FLOPS
    float bandwidth_efficiency;  // % of peak bandwidth
    bool is_compute_bound;
};

RooflineMetrics calculate_roofline(
    BenchmarkResult& result,
    size_t flop_count,
    size_t bytes_accessed,
    cudaDeviceProp& props
) {
    RooflineMetrics metrics;

    // Get hardware specs
    metrics.peak_memory_bandwidth_gbps =
        (props.memoryBusWidth / 8.0) * (props.memoryClockRate / 1e6) * 2;  // DDR
    metrics.peak_flops_tflops =
        (props.multiProcessorCount * props.maxThreadsPerMultiProcessor *
         props.clockRate / 1e9) * 2;  // FMA = 2 FLOPS

    // Calculate arithmetic intensity
    metrics.arithmetic_intensity = (float)flop_count / bytes_accessed;

    // Achieved performance
    metrics.achieved_flops_tflops = result.achieved_flops;
    metrics.achieved_bandwidth_gbps = result.throughput_gbps;

    // Determine boundedness
    float ridge_point = metrics.peak_flops_tflops / metrics.peak_memory_bandwidth_gbps;
    metrics.is_compute_bound = metrics.arithmetic_intensity > ridge_point;

    // Calculate efficiency
    if (metrics.is_compute_bound) {
        metrics.compute_efficiency =
            (metrics.achieved_flops_tflops / metrics.peak_flops_tflops) * 100;
    } else {
        metrics.bandwidth_efficiency =
            (metrics.achieved_bandwidth_gbps / metrics.peak_memory_bandwidth_gbps) * 100;
    }

    return metrics;
}
```

### 4. Memory Bandwidth Benchmark

```cuda
// Global memory bandwidth test
__global__ void bandwidthTestCopy(float* dst, const float* src, size_t n) {
    size_t idx = blockIdx.x * blockDim.x + threadIdx.x;
    size_t stride = blockDim.x * gridDim.x;

    for (size_t i = idx; i < n; i += stride) {
        dst[i] = src[i];
    }
}

__global__ void bandwidthTestRead(float* dst, const float* src, size_t n) {
    size_t idx = blockIdx.x * blockDim.x + threadIdx.x;
    size_t stride = blockDim.x * gridDim.x;

    float sum = 0.0f;
    for (size_t i = idx; i < n; i += stride) {
        sum += src[i];
    }
    // Prevent optimization
    if (idx == 0) dst[0] = sum;
}

void benchmark_memory_bandwidth(size_t size_mb) {
    size_t size = size_mb * 1024 * 1024;
    size_t n = size / sizeof(float);

    float *d_src, *d_dst;
    cudaMalloc(&d_src, size);
    cudaMalloc(&d_dst, size);

    int blocks = 256;
    int threads = 256;

    // Copy bandwidth (read + write)
    auto copy_result = benchmark_kernel(
        [=]() { bandwidthTestCopy<<<blocks, threads>>>(d_dst, d_src, n); },
        dim3(blocks), dim3(threads),
        size * 2,  // Read + Write
        0
    );

    printf("Copy Bandwidth: %.2f GB/s\n", copy_result.throughput_gbps);

    // Read bandwidth
    auto read_result = benchmark_kernel(
        [=]() { bandwidthTestRead<<<blocks, threads>>>(d_dst, d_src, n); },
        dim3(blocks), dim3(threads),
        size,  // Read only
        0
    );

    printf("Read Bandwidth: %.2f GB/s\n", read_result.throughput_gbps);

    cudaFree(d_src);
    cudaFree(d_dst);
}
```

### 5. Latency Benchmark

```cuda
// Memory latency measurement using pointer chasing
__global__ void pointerChase(int* ptr, int* result, int iterations) {
    int idx = 0;
    for (int i = 0; i < iterations; i++) {
        idx = ptr[idx];
    }
    *result = idx;  // Prevent optimization
}

float measure_memory_latency() {
    const int N = 1024 * 1024;  // 4MB
    int* h_ptr = new int[N];

    // Create random chase pattern
    std::vector<int> indices(N);
    std::iota(indices.begin(), indices.end(), 0);
    std::random_shuffle(indices.begin() + 1, indices.end());

    for (int i = 0; i < N - 1; i++) {
        h_ptr[indices[i]] = indices[i + 1];
    }
    h_ptr[indices[N - 1]] = indices[0];

    int *d_ptr, *d_result;
    cudaMalloc(&d_ptr, N * sizeof(int));
    cudaMalloc(&d_result, sizeof(int));
    cudaMemcpy(d_ptr, h_ptr, N * sizeof(int), cudaMemcpyHostToDevice);

    // Measure latency
    cudaEvent_t start, stop;
    cudaEventCreate(&start);
    cudaEventCreate(&stop);

    const int ITERATIONS = 10000;

    cudaEventRecord(start);
    pointerChase<<<1, 1>>>(d_ptr, d_result, ITERATIONS);
    cudaEventRecord(stop);
    cudaEventSynchronize(stop);

    float ms;
    cudaEventElapsedTime(&ms, start, stop);
    float latency_ns = (ms * 1e6) / ITERATIONS;

    delete[] h_ptr;
    cudaFree(d_ptr);
    cudaFree(d_result);

    return latency_ns;
}
```

### 6. Power and Thermal Monitoring

```bash
#!/bin/bash
# power_monitor.sh - Monitor GPU power during benchmark

BENCHMARK_CMD=$1
LOG_FILE="power_log.csv"

echo "timestamp,power_w,temp_c,gpu_util,mem_util" > $LOG_FILE

# Start power monitoring in background
nvidia-smi --query-gpu=timestamp,power.draw,temperature.gpu,utilization.gpu,utilization.memory \
    --format=csv,noheader -l 100 >> $LOG_FILE &
MONITOR_PID=$!

# Run benchmark
eval $BENCHMARK_CMD

# Stop monitoring
kill $MONITOR_PID

# Generate report
echo "=== Power Analysis ==="
awk -F',' '
    NR>1 {
        power+=$2; temp+=$3; count++
        if($2>max_power) max_power=$2
    }
    END {
        print "Average Power: " power/count " W"
        print "Peak Power: " max_power " W"
        print "Average Temperature: " temp/count " C"
    }
' $LOG_FILE
```

### 7. CI/CD Regression Detection

```yaml
# .github/workflows/gpu-benchmark.yml
name: GPU Performance Benchmark

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: [self-hosted, gpu]
    steps:
      - uses: actions/checkout@v3

      - name: Build benchmarks
        run: |
          nvcc -O3 -arch=sm_80 benchmarks/*.cu -o gpu_benchmark

      - name: Run benchmarks
        run: |
          ./gpu_benchmark --json > benchmark_results.json

      - name: Check for regression
        run: |
          python scripts/check_regression.py \
            --current benchmark_results.json \
            --baseline benchmarks/baseline.json \
            --threshold 5.0  # 5% regression threshold

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmark_results.json
```

```python
# scripts/check_regression.py
import json
import sys
import argparse

def check_regression(current_file, baseline_file, threshold_percent):
    with open(current_file) as f:
        current = json.load(f)
    with open(baseline_file) as f:
        baseline = json.load(f)

    regressions = []

    for kernel, current_time in current['kernels'].items():
        if kernel in baseline['kernels']:
            baseline_time = baseline['kernels'][kernel]
            change_percent = ((current_time - baseline_time) / baseline_time) * 100

            if change_percent > threshold_percent:
                regressions.append({
                    'kernel': kernel,
                    'baseline_ms': baseline_time,
                    'current_ms': current_time,
                    'change_percent': change_percent
                })

    if regressions:
        print("Performance regressions detected:")
        for r in regressions:
            print(f"  {r['kernel']}: {r['baseline_ms']:.3f}ms -> {r['current_ms']:.3f}ms ({r['change_percent']:+.1f}%)")
        sys.exit(1)
    else:
        print("No performance regressions detected")
        sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--current', required=True)
    parser.add_argument('--baseline', required=True)
    parser.add_argument('--threshold', type=float, default=5.0)
    args = parser.parse_args()

    check_regression(args.current, args.baseline, args.threshold)
```

### 8. Benchmark Report Generation

```cpp
void generate_benchmark_report(
    const std::vector<BenchmarkResult>& results,
    const std::vector<std::string>& kernel_names,
    const std::string& output_file
) {
    std::ofstream report(output_file);

    report << "# GPU Benchmark Report\n\n";
    report << "Date: " << get_timestamp() << "\n";
    report << "GPU: " << get_gpu_name() << "\n";
    report << "Driver: " << get_driver_version() << "\n\n";

    report << "## Results Summary\n\n";
    report << "| Kernel | Min (ms) | Mean (ms) | Max (ms) | Stddev | Throughput (GB/s) |\n";
    report << "|--------|----------|-----------|----------|--------|-------------------|\n";

    for (size_t i = 0; i < results.size(); i++) {
        const auto& r = results[i];
        report << "| " << kernel_names[i]
               << " | " << std::fixed << std::setprecision(3) << r.min_ms
               << " | " << r.mean_ms
               << " | " << r.max_ms
               << " | " << r.stddev_ms
               << " | " << std::setprecision(2) << r.throughput_gbps
               << " |\n";
    }

    report.close();
}
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Reference |
|--------|-------------|-----------|
| NVIDIA AgentIQ MCP | Profiling and observability | [NVIDIA Docs](https://docs.nvidia.com/agentiq/latest/components/mcp.html) |

## Best Practices

### Benchmark Design

1. **Warm-up runs** - Execute several iterations before timing
2. **Multiple iterations** - Collect statistics, not single measurements
3. **Report variance** - Include stddev and min/max
4. **Control environment** - Fix GPU clocks, disable boost

### Reproducibility

```bash
# Lock GPU clocks for consistent benchmarks
sudo nvidia-smi -pm 1  # Enable persistence mode
sudo nvidia-smi -lgc 1500,1500  # Lock graphics clock
sudo nvidia-smi -lmc 877,877  # Lock memory clock

# Run benchmark
./gpu_benchmark

# Restore auto clocks
sudo nvidia-smi -rgc  # Reset graphics clock
sudo nvidia-smi -rmc  # Reset memory clock
```

### Metrics to Track

| Metric | Description |
|--------|-------------|
| Execution time | Wall-clock kernel duration |
| Throughput | Data processed per second |
| FLOPS | Floating-point operations per second |
| Bandwidth utilization | % of theoretical peak |
| Occupancy | Active warps / max warps |

## Process Integration

This skill integrates with the following processes:
- `gpu-performance-regression-testing.js` - CI/CD integration
- `performance-profiling-analysis.js` - Detailed analysis
- `occupancy-optimization.js` - Resource utilization

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "benchmark-suite",
  "status": "success",
  "environment": {
    "gpu": "NVIDIA A100-SXM4-80GB",
    "cuda_version": "12.2",
    "driver_version": "535.104.05",
    "timestamp": "2026-01-24T10:30:00Z"
  },
  "results": [
    {
      "kernel": "matrixMultiply",
      "config": {
        "grid": [256, 256, 1],
        "block": [16, 16, 1],
        "data_size_mb": 1024
      },
      "timing": {
        "min_ms": 1.234,
        "mean_ms": 1.267,
        "max_ms": 1.312,
        "stddev_ms": 0.023,
        "iterations": 100
      },
      "performance": {
        "throughput_gbps": 1234.5,
        "tflops": 15.2,
        "efficiency_percent": 78.5
      }
    }
  ],
  "comparison": {
    "baseline_version": "v1.2.3",
    "regressions": [],
    "improvements": [
      {"kernel": "matrixMultiply", "improvement_percent": 5.2}
    ]
  },
  "artifacts": ["benchmark_report.md", "results.json"]
}
```

## Constraints

- Lock GPU clocks for reproducible results
- Run multiple iterations to capture variance
- Account for thermal throttling in long benchmarks
- Validate correctness before benchmarking performance
- Use appropriate warm-up iterations
