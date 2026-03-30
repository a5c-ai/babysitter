---
name: performance-benchmark-suite
description: SDK performance benchmarking and regression detection
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Performance Benchmark Suite Skill

## Overview

This skill implements comprehensive SDK performance benchmarking, tracking latency, throughput, memory usage, and detecting performance regressions across versions.

## Capabilities

- Measure latency percentiles (p50, p95, p99)
- Track memory usage and allocation patterns
- Detect performance regressions automatically
- Generate visual benchmark reports
- Compare performance across SDK versions
- Implement microbenchmarks for critical paths
- Configure continuous benchmarking in CI
- Support load testing scenarios

## Target Processes

- Performance Benchmarking
- SDK Testing Strategy
- SDK Versioning and Release Management

## Integration Points

- k6 for load testing
- Artillery for HTTP benchmarking
- hyperfine for CLI benchmarking
- Benchmark.js for JavaScript
- pytest-benchmark for Python
- Continuous benchmark systems (Bencher)

## Input Requirements

- Performance requirements (SLOs)
- Benchmark scenarios
- Baseline versions for comparison
- Environment specifications
- Reporting requirements

## Output Artifacts

- Benchmark test suite
- Performance baseline data
- Regression detection rules
- Visual benchmark reports
- CI benchmark configuration
- Historical trend analysis

## Usage Example

```yaml
skill:
  name: performance-benchmark-suite
  context:
    tool: k6
    scenarios:
      - name: basic-crud
        operations: ["create", "read", "update", "delete"]
        vus: 10
        duration: "30s"
      - name: high-load
        vus: 100
        duration: "5m"
    slos:
      p95_latency: "100ms"
      p99_latency: "500ms"
      error_rate: "0.1%"
    compareWith: "v1.0.0"
    regressionThreshold: "10%"
```

## Best Practices

1. Establish baselines before optimization
2. Track percentiles, not just averages
3. Run benchmarks in consistent environments
4. Automate regression detection in CI
5. Monitor memory alongside latency
6. Document benchmark methodology
