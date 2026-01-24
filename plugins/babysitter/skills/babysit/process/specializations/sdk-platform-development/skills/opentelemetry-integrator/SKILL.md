---
name: opentelemetry-integrator
description: Integrate OpenTelemetry tracing and metrics into SDKs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# OpenTelemetry Integrator Skill

## Overview

This skill integrates OpenTelemetry observability into SDKs, providing distributed tracing, metrics collection, and context propagation for comprehensive API monitoring.

## Capabilities

- Add tracing spans to SDK operations
- Export metrics (latency, errors, throughput)
- Configure context propagation (W3C Trace Context)
- Support multiple exporters (OTLP, Jaeger, Zipkin)
- Implement custom span attributes
- Configure sampling strategies
- Add semantic conventions for SDK operations
- Support baggage propagation

## Target Processes

- Observability Integration
- Telemetry and Analytics Integration
- Logging and Diagnostics

## Integration Points

- OpenTelemetry SDKs (all languages)
- Jaeger for distributed tracing
- Prometheus for metrics
- Grafana for visualization
- Cloud observability platforms

## Input Requirements

- Tracing requirements
- Metrics to collect
- Exporter configurations
- Sampling strategy
- Semantic convention mappings

## Output Artifacts

- OpenTelemetry instrumentation
- Custom span definitions
- Metrics collectors
- Exporter configurations
- Propagator setup
- Sampling configuration

## Usage Example

```yaml
skill:
  name: opentelemetry-integrator
  context:
    tracing:
      enabled: true
      propagator: w3c-trace-context
      sampling: parentBased
      sampleRate: 0.1
    metrics:
      enabled: true
      exportInterval: 30s
      metrics:
        - sdk.request.duration
        - sdk.request.count
        - sdk.error.count
    exporters:
      traces: otlp
      metrics: prometheus
    serviceName: "my-sdk"
```

## Best Practices

1. Follow OpenTelemetry semantic conventions
2. Use appropriate sampling rates
3. Propagate context across boundaries
4. Include useful span attributes
5. Avoid high-cardinality attributes
6. Configure exporters for production
