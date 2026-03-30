# Performance Baseline Capturer Skill

## Overview

The Performance Baseline Capturer skill establishes performance benchmarks before migration. It captures response times, throughput, and resource utilization for post-migration comparison.

## Quick Start

### Prerequisites

- Load testing tool installed
- Access to target system
- Monitoring capabilities

### Basic Usage

1. **Define test scenarios**
   - Identify key workflows
   - Set load levels
   - Define duration

2. **Execute baseline tests**
   ```bash
   # Using k6
   k6 run --vus 100 --duration 10m baseline.js
   ```

3. **Capture metrics**
   - Record response times
   - Document throughput
   - Save resource usage

## Features

### Metrics Captured

| Metric | Description | Typical Target |
|--------|-------------|----------------|
| P50 Latency | Median response | < 200ms |
| P99 Latency | Tail latency | < 1s |
| Throughput | Requests/second | Varies |
| Error Rate | Failed requests | < 1% |

### Test Types

- Baseline load test
- Stress test
- Soak test
- Spike test

## Configuration

```json
{
  "test": {
    "type": "baseline",
    "duration": "10m",
    "virtualUsers": 100,
    "rampUp": "1m"
  },
  "targets": [
    {
      "name": "API",
      "url": "https://api.example.com",
      "scenarios": ["./scenarios/*.js"]
    }
  ],
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.01"]
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [k6](https://k6.io/)
- [JMeter](https://jmeter.apache.org/)
