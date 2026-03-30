# GPU Benchmarking Skill

## Overview

The `gpu-benchmarking` skill provides expert capabilities for automated GPU performance benchmarking and regression detection. It enables precise timing measurements, statistical analysis, roofline model calculations, and CI/CD integration for tracking performance over time.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - With CUDA events support
2. **nvidia-smi** - For power and thermal monitoring
3. **Python 3.8+** - For CI/CD scripts
4. **Optional**: Nsight Systems/Compute for detailed profiling

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

## Usage

### Basic Operations

```bash
# Run kernel benchmark
/skill gpu-benchmarking run --kernel matrixMul --iterations 100

# Memory bandwidth test
/skill gpu-benchmarking bandwidth --size 1024

# Generate benchmark report
/skill gpu-benchmarking report --suite all --output report.md

# Check for regressions
/skill gpu-benchmarking check-regression --baseline baseline.json
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(gpuBenchmarkingTask, {
  operation: 'benchmark-suite',
  kernels: ['matrixMul', 'convolution', 'reduction'],
  iterations: 100,
  warmup: 10,
  outputFile: 'benchmark_results.json'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **CUDA Event Timing** | Precise kernel execution measurement |
| **Statistical Analysis** | Min, max, mean, median, stddev |
| **Roofline Analysis** | Compute vs memory bound classification |
| **Memory Benchmarking** | Bandwidth and latency measurement |
| **Power Monitoring** | Track power and thermal characteristics |
| **Regression Detection** | CI/CD integration for tracking changes |

## Examples

### Example 1: Kernel Performance Benchmark

```bash
# Benchmark a specific kernel
/skill gpu-benchmarking run-kernel \
  --program ./cuda_app \
  --kernel myKernel \
  --iterations 100 \
  --warmup 10 \
  --json
```

Output:
```json
{
  "kernel": "myKernel",
  "timing": {
    "min_ms": 1.234,
    "mean_ms": 1.267,
    "max_ms": 1.312,
    "stddev_ms": 0.023
  },
  "throughput_gbps": 450.5,
  "tflops": 12.3
}
```

### Example 2: Memory Bandwidth Analysis

```bash
# Comprehensive memory bandwidth test
/skill gpu-benchmarking memory-bandwidth \
  --sizes 64,256,1024,4096 \
  --include copy,read,write \
  --output bandwidth_report.md
```

### Example 3: Roofline Model Analysis

```bash
# Generate roofline plot data
/skill gpu-benchmarking roofline \
  --kernel matrixMul \
  --flops 2147483648 \
  --bytes 16777216 \
  --output roofline_data.json
```

### Example 4: CI/CD Regression Check

```bash
# Check current results against baseline
/skill gpu-benchmarking check-regression \
  --current results.json \
  --baseline benchmarks/baseline.json \
  --threshold 5.0 \
  --fail-on-regression
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BENCHMARK_ITERATIONS` | Default iteration count | `100` |
| `BENCHMARK_WARMUP` | Default warmup iterations | `10` |
| `REGRESSION_THRESHOLD` | % change to flag regression | `5.0` |
| `CUDA_VISIBLE_DEVICES` | GPU to benchmark | `0` |

### Skill Configuration

```yaml
# .babysitter/skills/gpu-benchmarking.yaml
gpu-benchmarking:
  defaults:
    iterations: 100
    warmup: 10
    output_format: json
  regression:
    threshold_percent: 5.0
    fail_on_regression: true
    baseline_path: benchmarks/baseline.json
  environment:
    lock_clocks: true
    graphics_clock: 1500
    memory_clock: 877
```

## Benchmark Reference

### Timing Best Practices

| Practice | Reason |
|----------|--------|
| Warm-up iterations | Avoid cold-start effects |
| Multiple iterations | Capture statistical variance |
| CUDA events | GPU-side timing accuracy |
| Lock GPU clocks | Reproducible results |

### Key Metrics

| Metric | Formula | Unit |
|--------|---------|------|
| Throughput | Data Size / Time | GB/s |
| TFLOPS | FLOP Count / Time / 1e12 | TFLOPS |
| Bandwidth Efficiency | Achieved / Peak * 100 | % |
| Compute Efficiency | Achieved FLOPS / Peak FLOPS * 100 | % |

### Roofline Model

```
Arithmetic Intensity (AI) = FLOPS / Bytes Accessed

If AI < Ridge Point: Memory Bound
If AI > Ridge Point: Compute Bound

Ridge Point = Peak FLOPS / Peak Bandwidth
```

## Process Integration

### Processes Using This Skill

1. **gpu-performance-regression-testing.js** - CI/CD benchmarking
2. **performance-profiling-analysis.js** - Detailed performance analysis
3. **occupancy-optimization.js** - Resource utilization tracking

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const benchmarkSuiteTask = defineTask({
  name: 'benchmark-suite',
  description: 'Run comprehensive GPU benchmark suite',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'GPU Benchmark Suite',
      skill: {
        name: 'gpu-benchmarking',
        context: {
          operation: 'full-suite',
          kernels: inputs.kernels,
          config: {
            iterations: 100,
            warmup: 10,
            lockClocks: true
          },
          comparison: {
            baseline: inputs.baselinePath,
            threshold: 5.0
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

## CI/CD Integration

### GitHub Actions Example

```yaml
name: GPU Performance Tests

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

      - name: Run benchmarks
        run: |
          /skill gpu-benchmarking run-suite \
            --config benchmarks/config.yaml \
            --output results.json

      - name: Check regression
        run: |
          /skill gpu-benchmarking check-regression \
            --current results.json \
            --baseline benchmarks/baseline.json \
            --threshold 5.0
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| High variance | Thermal throttling | Lock clocks, add cooling |
| Inconsistent results | GPU boost variations | Disable GPU boost |
| Slow benchmarks | Too many iterations | Reduce iteration count |
| Memory errors | Insufficient VRAM | Reduce data size |

### Reproducibility Tips

```bash
# Lock GPU clocks for consistent results
sudo nvidia-smi -pm 1
sudo nvidia-smi -lgc 1500,1500
sudo nvidia-smi -lmc 877,877

# Disable MIG mode if enabled
sudo nvidia-smi -mig 0

# Run benchmark
./benchmark

# Restore defaults
sudo nvidia-smi -rgc
sudo nvidia-smi -rmc
```

## Related Skills

- **cuda-debugging** - Correctness before performance
- **nsight-profiler** - Detailed kernel analysis
- **parallel-patterns** - Algorithm optimization

## References

- [NVIDIA CUDA Events](https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__EVENT.html)
- [GPU Benchmarking Best Practices](https://developer.nvidia.com/blog/how-implement-performance-metrics-cuda-cc/)
- [Parallel Reductions Benchmark](https://github.com/ashvardanian/ParallelReductionsBenchmark)
- [NVIDIA AgentIQ MCP](https://docs.nvidia.com/agentiq/latest/components/mcp.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-015
**Category:** Performance Testing
**Status:** Active
