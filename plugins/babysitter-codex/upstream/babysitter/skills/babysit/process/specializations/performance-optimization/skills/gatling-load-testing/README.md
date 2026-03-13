# Gatling Load Testing Skill

## Overview

The `gatling-load-testing` skill provides expert capabilities for Gatling simulation development and performance analysis. It enables AI-powered load testing including simulation writing, injection profile design, feeder configuration, and comprehensive result analysis.

## Quick Start

### Prerequisites

1. **Java 11+** - JDK 11 or higher (Java 17 recommended)
2. **Gatling Bundle** - Download from gatling.io or use Maven/Gradle
3. **Scala Knowledge** - Basic understanding of Scala DSL
4. **Optional** - Gatling Enterprise for advanced features

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For Gatling installation:

```bash
# Using Maven archetype
mvn archetype:generate -DarchetypeGroupId=io.gatling.highcharts \
  -DarchetypeArtifactId=gatling-highcharts-maven-archetype

# Or download bundle
wget https://repo1.maven.org/maven2/io/gatling/highcharts/gatling-charts-highcharts-bundle/3.10.3/gatling-charts-highcharts-bundle-3.10.3.zip
```

## Usage

### Basic Operations

```bash
# Generate simulation from API spec
/skill gatling-load-testing generate-simulation --openapi api-spec.yaml --output ApiSimulation.scala

# Run simulation
/skill gatling-load-testing run --simulation ApiLoadSimulation

# Analyze results
/skill gatling-load-testing analyze-report --report target/gatling/latest
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(gatlingTask, {
  operation: 'create-simulation',
  baseUrl: 'https://api.example.com',
  scenarios: [
    {
      name: 'User Journey',
      requests: ['login', 'search', 'checkout'],
      users: 1000,
      duration: '5m'
    }
  ],
  outputFile: 'ApiSimulation.scala'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Simulation Writing** | Generate Gatling Scala simulations |
| **Injection Profiles** | Design load patterns (ramp, constant, spike) |
| **Feeder Configuration** | Set up CSV, JSON, JDBC feeders |
| **Session Management** | Handle correlation and dynamic values |
| **Assertions** | Define performance thresholds |
| **Report Analysis** | Parse and interpret HTML reports |

## Examples

### Example 1: Basic API Load Test

```bash
# Generate and run a basic load test
/skill gatling-load-testing create-test \
  --name "API Smoke Test" \
  --base-url "https://api.example.com" \
  --endpoints "/health,/users,/products" \
  --users 100 \
  --duration 2m \
  --output ApiSmokeTest.scala
```

Generated simulation includes:
- HTTP protocol configuration
- Basic request chain
- Ramp-up injection profile
- Standard assertions

### Example 2: Stress Test Design

```bash
# Design stress test with increasing load
/skill gatling-load-testing create-stress-test \
  --simulation existing/ApiSimulation.scala \
  --start-users 10 \
  --increment 10 \
  --levels 10 \
  --level-duration 2m \
  --output StressTestSimulation.scala
```

### Example 3: Report Analysis

```bash
# Analyze Gatling report and generate summary
/skill gatling-load-testing analyze-report \
  --report target/gatling/apisimulation-20260124 \
  --format markdown \
  --include-recommendations
```

Output includes:
- Response time percentiles
- Error rate analysis
- Throughput metrics
- Performance recommendations

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GATLING_HOME` | Gatling installation directory | - |
| `JAVA_OPTS` | JVM options for Gatling | `-Xms1g -Xmx4g` |
| `GATLING_CONF` | Configuration directory | `conf/` |

### Skill Configuration

```yaml
# .babysitter/skills/gatling-load-testing.yaml
gatling-load-testing:
  gatling:
    home: /opt/gatling
    jvmArgs: "-Xms2g -Xmx8g"
  defaults:
    baseUrl: https://staging.example.com
    rampDuration: 60s
    steadyDuration: 300s
  assertions:
    maxResponseTime: 5000
    p95ResponseTime: 1000
    successRate: 99.5
  reporting:
    outputDir: target/gatling
    generateGraphs: true
```

## Injection Profile Reference

### Common Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Ramp** | Gradual load increase | `rampUsers(100).during(1.minute)` |
| **Constant** | Steady load | `constantUsersPerSec(50).during(5.minutes)` |
| **Spike** | Sudden traffic surge | `stressPeakUsers(500).during(30.seconds)` |
| **Increment** | Step-wise increase | `incrementUsersPerSec(10).times(5)` |
| **Nothing** | Wait period | `nothingFor(10.seconds)` |

### Load Profile Examples

```scala
// Smoke test
rampUsers(10).during(30.seconds)

// Load test
rampUsers(100).during(1.minute),
constantUsersPerSec(50).during(5.minutes)

// Stress test
incrementUsersPerSec(10)
  .times(10)
  .eachLevelLasting(2.minutes)

// Soak test
constantUsersPerSec(30).during(4.hours)
```

## Process Integration

### Processes Using This Skill

1. **load-testing-framework-setup.js** - Initial Gatling project setup
2. **load-test-execution.js** - Test execution and monitoring
3. **stress-testing-analysis.js** - Stress test scenario design

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const runLoadTestTask = defineTask({
  name: 'run-gatling-load-test',
  description: 'Execute Gatling load test simulation',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Run Gatling: ${inputs.simulationName}`,
      skill: {
        name: 'gatling-load-testing',
        context: {
          operation: 'run-simulation',
          simulation: inputs.simulationName,
          jvmArgs: inputs.jvmArgs || '-Xms2g -Xmx8g',
          systemProperties: {
            'gatling.core.outputDirectoryBaseName': inputs.outputName
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

## Feeder Types

### CSV Feeder

```scala
// Basic CSV
csv("users.csv").circular

// With custom separator
separatedValues("data.tsv", '\t').random

// Batch loading
csv("large-data.csv").batch(1000).random
```

### JSON Feeder

```scala
// Array of objects
jsonFile("products.json").random

// With transformation
jsonFile("data.json")
  .convert { case (k, v) => (k, v.toString.toUpperCase) }
```

### JDBC Feeder

```scala
jdbcFeeder(
  "jdbc:postgresql://localhost/db",
  "user", "pass",
  "SELECT id, email FROM users"
)
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `OutOfMemoryError` | Increase JVM heap: `-Xmx8g` |
| `Connection pool exhausted` | Reduce concurrent users or increase pool size |
| `Feeder empty` | Use `.circular` or provide more data |
| `Scala compilation errors` | Check Scala version compatibility |
| `Report not generated` | Verify write permissions to output directory |

### Debug Mode

```bash
# Enable debug logging
/skill gatling-load-testing run \
  --simulation ApiSimulation \
  --log-level DEBUG \
  --trace-requests
```

## Related Skills

- **k6-load-testing** - Alternative JavaScript-based load testing
- **prometheus-grafana** - Metrics visualization during tests
- **apm-instrumentation** - Application performance correlation

## References

- [Gatling Documentation](https://gatling.io/docs/gatling/)
- [Gatling Academy](https://gatling.io/academy/)
- [Gatling Cheat Sheet](https://gatling.io/docs/gatling/reference/current/cheat-sheet/)
- [Scala DSL Reference](https://gatling.io/docs/gatling/reference/current/core/simulation/)
- [Locust MCP Server](https://github.com/QAInsights/locust-mcp-server) - Alternative load testing

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-006
**Category:** Load Testing
**Status:** Active
