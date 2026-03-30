---
name: k6 Performance Testing
description: k6 load testing expertise for performance validation and analysis
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# k6 Performance Testing Skill

## Overview

This skill provides expert-level capabilities for k6-based performance testing, enabling load test scripting, execution, metrics analysis, and integration with monitoring systems.

## Capabilities

### Script Development
- Write k6 load test scripts in JavaScript
- Implement virtual user scenarios
- Configure data parameterization
- Handle authentication in load tests

### Load Profile Configuration
- Configure ramp-up patterns
- Define steady-state load levels
- Implement spike testing scenarios
- Configure soak testing profiles

### Metrics & Analysis
- Analyze k6 metrics (response time, throughput, errors)
- Configure thresholds and checks
- Generate PromQL queries from k6 output
- Interpret percentile distributions

### Cloud Integration
- Configure k6 Cloud execution
- Distributed load generation
- Cloud results analysis

### Dashboard Integration
- Integration with Grafana dashboards
- InfluxDB metrics export
- Real-time monitoring setup

## Target Processes

- `performance-testing.js` - Performance test implementation
- `api-testing.js` - API performance validation
- `continuous-testing.js` - CI/CD performance gates

## Dependencies

- `k6` - Load testing tool
- Grafana (optional) - Dashboards
- InfluxDB (optional) - Metrics storage

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'k6-performance',
    context: {
      action: 'execute-load-test',
      script: 'tests/performance/load.js',
      vus: 100,
      duration: '5m',
      thresholds: {
        'http_req_duration': ['p(95)<500']
      }
    }
  }
}
```

## Configuration

The skill can execute k6 scripts locally or configure cloud execution for distributed load testing.
