---
name: opentelemetry-llm
description: OpenTelemetry instrumentation for LLM applications with distributed tracing
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# OpenTelemetry LLM Skill

## Capabilities

- Configure OpenTelemetry SDK for LLM apps
- Implement LLM-specific instrumentation
- Set up trace exporters (Jaeger, OTLP)
- Design semantic conventions for LLM
- Configure span attributes for AI workloads
- Implement context propagation

## Target Processes

- llm-observability-monitoring
- agent-deployment-pipeline

## Implementation Details

### Core Components

1. **TracerProvider**: SDK configuration
2. **SpanProcessor**: Batch/simple processors
3. **Exporters**: Jaeger, OTLP, Console
4. **Instrumentation**: Auto and manual

### LLM Semantic Conventions

- gen_ai.system (OpenAI, Anthropic)
- gen_ai.request.model
- gen_ai.request.max_tokens
- gen_ai.response.finish_reason
- gen_ai.usage.prompt_tokens

### Configuration Options

- Exporter selection
- Sampling strategies
- Resource attributes
- Span limits
- Context propagation

### Best Practices

- Consistent attribute naming
- Appropriate sampling
- Error handling traces
- Propagate context across services

### Dependencies

- opentelemetry-sdk
- opentelemetry-exporter-*
- openinference (optional)
