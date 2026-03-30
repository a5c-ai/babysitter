---
name: performance-baseline-capturer
description: Capture performance baselines before migration for regression comparison and SLA verification
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Performance Baseline Capturer Skill

Captures comprehensive performance baselines before migration to enable post-migration regression comparison and SLA verification.

## Purpose

Enable performance benchmarking for:
- Response time measurement
- Throughput baseline
- Resource utilization tracking
- Load test execution
- Percentile calculation

## Capabilities

### 1. Response Time Measurement
- Capture response times
- Measure latency percentiles
- Track by endpoint
- Document SLA targets

### 2. Throughput Baseline
- Measure requests per second
- Track concurrent users
- Document peak capacity
- Establish limits

### 3. Resource Utilization Tracking
- Monitor CPU usage
- Track memory consumption
- Measure disk I/O
- Record network usage

### 4. Load Test Execution
- Run baseline load tests
- Execute stress tests
- Perform soak tests
- Document results

### 5. Percentile Calculation
- Calculate P50/P90/P95/P99
- Track distribution
- Identify outliers
- Set thresholds

### 6. Regression Threshold Setting
- Define acceptable ranges
- Set alert thresholds
- Document tolerances
- Create comparison criteria

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| JMeter | Load testing | CLI |
| Gatling | Performance testing | CLI |
| k6 | Modern load testing | CLI |
| Locust | Python load testing | CLI |
| Artillery | Node.js testing | CLI |
| wrk | HTTP benchmarking | CLI |

## Output Schema

```json
{
  "baselineId": "string",
  "timestamp": "ISO8601",
  "environment": {
    "name": "string",
    "resources": {}
  },
  "metrics": {
    "responseTime": {
      "p50": "number",
      "p90": "number",
      "p95": "number",
      "p99": "number",
      "mean": "number"
    },
    "throughput": {
      "requestsPerSecond": "number",
      "peakRps": "number",
      "concurrentUsers": "number"
    },
    "resources": {
      "cpu": {},
      "memory": {},
      "disk": {},
      "network": {}
    }
  },
  "thresholds": {
    "responseTime": {},
    "throughput": {},
    "errors": {}
  }
}
```

## Integration with Migration Processes

- **migration-testing-strategy**: Baseline establishment
- **performance-optimization-migration**: Performance tracking

## Related Skills

- `migration-validator`: Post-migration comparison
- `test-coverage-analyzer`: Test planning

## Related Agents

- `performance-validation-agent`: Performance verification
- `migration-testing-strategist`: Test planning
