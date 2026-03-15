# Observability Expert Agent

## Overview

The `observability-expert` agent provides expert guidance on metrics, logs, and traces for full-stack observability. It specializes in the Prometheus ecosystem, Grafana stack, OpenTelemetry instrumentation, distributed tracing, alert design, and observability-driven development.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Observability Engineer |
| **Experience** | 6+ years monitoring/observability |
| **Background** | High-scale systems monitoring |
| **Philosophy** | "You can't fix what you can't see" |

## Three Pillars of Observability

| Pillar | Purpose | Primary Tools |
|--------|---------|---------------|
| **Metrics** | Aggregated numerical data | Prometheus, Mimir |
| **Logs** | Discrete events with context | Loki, Elasticsearch |
| **Traces** | Request flow across services | Tempo, Jaeger |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Prometheus** | PromQL, alerting rules, federation, Thanos |
| **Grafana Stack** | Dashboards, Loki, Tempo, Mimir |
| **OpenTelemetry** | Auto/manual instrumentation, exporters |
| **Tracing** | Distributed tracing analysis, TraceQL |
| **Alerting** | Multi-window alerts, noise reduction |
| **Observability-Driven Dev** | Instrumentation-first approach |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(observabilityExpertTask, {
  agentName: 'observability-expert',
  prompt: {
    role: 'Senior Observability Engineer',
    task: 'Design observability stack for microservices platform',
    context: {
      services: serviceList,
      currentStack: existingTools,
      requirements: observabilityRequirements
    },
    instructions: [
      'Assess current observability gaps',
      'Design metrics collection strategy',
      'Plan distributed tracing implementation',
      'Create alerting strategy'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Design observability stack
/agent observability-expert design-stack \
  --services 15 \
  --requirements high-availability,compliance

# Analyze trace patterns
/agent observability-expert analyze-traces \
  --service payment-api \
  --time-range 1h

# Optimize alert configuration
/agent observability-expert optimize-alerts \
  --config alerts.yaml \
  --reduce-noise
```

## Common Tasks

### 1. Observability Stack Design

```bash
/agent observability-expert design-stack \
  --platform kubernetes \
  --scale medium \
  --budget moderate
```

Provides:
- Tool selection rationale
- Architecture diagram
- Resource requirements
- Implementation roadmap

### 2. Dashboard Creation

```bash
/agent observability-expert create-dashboard \
  --service api-gateway \
  --type service-overview \
  --include slo-tracking
```

Generates:
- Grafana dashboard JSON
- Variable templates
- Panel configurations
- Query optimizations

### 3. Alert Design

```bash
/agent observability-expert design-alerts \
  --service payment-api \
  --slos availability,latency \
  --method burn-rate
```

Creates:
- Multi-window burn rate alerts
- Symptom-based alerting rules
- Runbook templates
- Escalation recommendations

### 4. Instrumentation Review

```bash
/agent observability-expert review-instrumentation \
  --service user-api \
  --framework nodejs
```

Identifies:
- Coverage gaps
- Cardinality issues
- Context propagation problems
- Best practice violations

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `monitoring-setup.js` | Stack design, configuration |
| `log-aggregation.js` | Loki setup, LogQL queries |
| `slo-sli-tracking.js` | Metrics selection, dashboards |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const designObservabilityTask = defineTask({
  name: 'design-observability',
  description: 'Design observability stack for services',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Design observability for ${inputs.platform}`,
      agent: {
        name: 'observability-expert',
        prompt: {
          role: 'Senior Observability Engineer',
          task: 'Design comprehensive observability stack',
          context: {
            platform: inputs.platform,
            services: inputs.services,
            existingTools: inputs.existingTools,
            requirements: inputs.requirements,
            constraints: inputs.constraints
          },
          instructions: [
            'Evaluate current observability maturity',
            'Select appropriate tools for each pillar',
            'Design metrics naming conventions',
            'Plan trace sampling strategy',
            'Create log aggregation architecture',
            'Design alerting hierarchy'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['architecture', 'tools', 'implementation'],
          properties: {
            architecture: { type: 'object' },
            tools: { type: 'array' },
            implementation: { type: 'object' }
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

## Observability Stack Reference

### Prometheus Ecosystem

| Component | Purpose |
|-----------|---------|
| Prometheus | Metrics collection and alerting |
| Alertmanager | Alert routing and silencing |
| Thanos | Long-term storage, global query |
| Mimir | Scalable Prometheus backend |

### Grafana Stack (LGTM)

| Component | Purpose |
|-----------|---------|
| Loki | Log aggregation |
| Grafana | Visualization |
| Tempo | Distributed tracing |
| Mimir | Metrics backend |

### OpenTelemetry

| Component | Purpose |
|-----------|---------|
| SDK | Application instrumentation |
| Collector | Data collection/processing |
| Protocol | OTLP for data export |

## Query Language Reference

### PromQL Examples

```promql
# Request rate
rate(http_requests_total[5m])

# Error percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# P99 latency
histogram_quantile(0.99, sum(rate(http_duration_bucket[5m])) by (le))
```

### LogQL Examples

```logql
# Error logs from service
{service="payment-api"} |= "error"

# JSON parsing and filtering
{service="api"} | json | level="error" | line_format "{{.message}}"

# Log rate
sum(rate({service="api"}[1m])) by (level)
```

### TraceQL Examples

```traceql
# Slow traces
{ duration > 2s }

# Error traces
{ status = error }

# Specific service errors
{ resource.service.name = "payment-api" && status = error }
```

## Alerting Best Practices

### Multi-Window Burn Rate

| Window | Burn Rate | Severity | Action |
|--------|-----------|----------|--------|
| 5m/1h | 14.4x | Critical | Page |
| 30m/6h | 6x | Warning | Ticket |
| 2h/24h | 3x | Info | Monitor |

### Alert Annotations

```yaml
annotations:
  summary: "Service {{ $labels.service }} error rate high"
  description: "Error rate is {{ $value | humanizePercentage }}"
  runbook_url: "https://wiki/runbooks/high-error-rate"
  dashboard_url: "https://grafana/d/service"
```

## Troubleshooting Patterns

### High Latency Investigation

1. Check trace spans for slowest operations
2. Identify database/external call patterns
3. Review resource saturation metrics
4. Check for lock contention

### Missing Data

1. Verify scrape targets are up
2. Check network connectivity
3. Review relabeling rules
4. Check storage capacity

## Related Resources

- [prometheus-grafana skill](../skills/prometheus-grafana/) - Metrics/dashboards
- [log-analysis skill](../skills/log-analysis/) - Log querying
- [sre-expert agent](../agents/sre-expert/) - SLO/SLI expertise

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Distributed Tracing](https://www.jaegertracing.io/docs/)
- [Observability Engineering](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-006
**Category:** Observability
**Status:** Active
