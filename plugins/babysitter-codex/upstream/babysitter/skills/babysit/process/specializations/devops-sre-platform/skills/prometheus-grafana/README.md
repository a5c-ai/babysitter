# Prometheus/Grafana Monitoring Skill

## Overview

The `prometheus-grafana` skill provides expert capabilities for Prometheus metrics and Grafana dashboards. It enables AI-powered observability including PromQL query writing, dashboard generation, alerting rules, and metric analysis.

## Quick Start

### Prerequisites

1. **Prometheus** - Running Prometheus server with API access
2. **Grafana** - Grafana instance with API key
3. **Optional** - Alertmanager, Thanos, Loki for extended functionality

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For MCP server integration:

```bash
# Install Grafana MCP server
npm install -g @grafana/mcp-grafana

# Or via Claude MCP
claude mcp add grafana
```

## Usage

### Basic Operations

```bash
# Generate PromQL for SLI
/skill prometheus-grafana generate-query --type error-rate --service api

# Create dashboard
/skill prometheus-grafana create-dashboard --template service-overview --service api

# Validate alerting rules
/skill prometheus-grafana validate-alerts --file alerts.yaml
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(prometheusGrafanaTask, {
  operation: 'create-recording-rules',
  metrics: ['http_requests_total', 'http_request_duration_seconds'],
  aggregations: ['rate5m', 'rate1h'],
  outputFile: 'recording-rules.yaml'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **PromQL Writing** | Generate and validate PromQL queries |
| **Recording Rules** | Create optimized recording rules |
| **Alerting Rules** | Design multi-window alerts with runbooks |
| **Dashboard Generation** | Generate Grafana JSON dashboards |
| **Scrape Config** | Debug and generate scrape configurations |
| **Cardinality Analysis** | Analyze and optimize metric cardinality |

## Examples

### Example 1: SLO Dashboard Generation

```bash
# Generate an SLO tracking dashboard
/skill prometheus-grafana create-slo-dashboard \
  --service api-gateway \
  --slo-target 99.9 \
  --error-budget-window 30d \
  --output dashboard-slo.json
```

Generated dashboard includes:
- Availability SLI gauge
- Error budget burn rate
- Request latency histograms
- Error rate over time

### Example 2: Alerting Rule Set

```bash
# Generate comprehensive alerting rules
/skill prometheus-grafana generate-alerts \
  --service payment-service \
  --include error-rate,latency,saturation \
  --severity-levels warning,critical \
  --output alerts.yaml
```

### Example 3: PromQL Optimization

```bash
# Analyze and optimize PromQL query
/skill prometheus-grafana optimize-query \
  --query "sum(rate(http_requests_total[5m])) by (service, instance, pod, method)" \
  --cardinality-limit 1000
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMETHEUS_URL` | Prometheus server URL | `http://localhost:9090` |
| `GRAFANA_URL` | Grafana server URL | `http://localhost:3000` |
| `GRAFANA_API_KEY` | Grafana API key | - |
| `ALERTMANAGER_URL` | Alertmanager URL | `http://localhost:9093` |

### Skill Configuration

```yaml
# .babysitter/skills/prometheus-grafana.yaml
prometheus-grafana:
  prometheus:
    url: https://prometheus.example.com
    timeout: 30s
  grafana:
    url: https://grafana.example.com
    apiKey: ${GRAFANA_API_KEY}
    defaultFolder: "Generated"
  defaults:
    scrapeInterval: 30s
    evaluationInterval: 30s
```

## PromQL Reference

### Common Patterns

```promql
# Request rate
rate(http_requests_total[5m])

# Error percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m])) * 100

# P99 latency
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Availability over 30 days
sum_over_time(up[30d]) / count_over_time(up[30d]) * 100

# CPU saturation
sum(rate(container_cpu_usage_seconds_total[5m]))
  / sum(kube_pod_container_resource_limits{resource="cpu"}) * 100
```

### Aggregation Operators

| Operator | Description |
|----------|-------------|
| `sum()` | Sum values |
| `avg()` | Average values |
| `max()` | Maximum value |
| `min()` | Minimum value |
| `count()` | Count elements |
| `topk(k, ...)` | Top k elements |
| `bottomk(k, ...)` | Bottom k elements |

## Process Integration

### Processes Using This Skill

1. **monitoring-setup.js** - Initial Prometheus and Grafana configuration
2. **slo-sli-tracking.js** - SLO dashboard and alert creation
3. **error-budget-management.js** - Error budget monitoring

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const createMonitoringTask = defineTask({
  name: 'create-monitoring',
  description: 'Set up monitoring for a service',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Create monitoring for ${inputs.serviceName}`,
      skill: {
        name: 'prometheus-grafana',
        context: {
          operation: 'setup-service-monitoring',
          serviceName: inputs.serviceName,
          metrics: inputs.metrics,
          alerting: {
            enabled: true,
            channels: inputs.alertChannels
          },
          dashboard: {
            create: true,
            folder: 'Services'
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

## MCP Server Reference

### mcp-grafana (Grafana Labs)

Official Grafana MCP server for dashboard and data source management.

**Features:**
- Query Prometheus metadata
- Search and modify dashboards
- Manage alert rules
- Access Loki logs (with datasource configured)

**GitHub:** https://github.com/grafana/mcp-grafana

### loki-mcp (Grafana)

Go-based MCP server for Grafana Loki.

**Features:**
- LogQL query execution
- Log pattern analysis
- Intelligent troubleshooting

**GitHub:** https://github.com/grafana/loki-mcp

## Dashboard Templates

### USE Method Dashboard

Utilization, Saturation, Errors for resource-based services.

### RED Method Dashboard

Rate, Errors, Duration for request-based services.

### SLO Dashboard

Availability, latency percentiles, error budget burn rate.

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `No data points` | Verify metric exists with `/api/v1/labels` |
| `Query timeout` | Create recording rules for complex queries |
| `Missing labels` | Check relabeling in scrape config |
| `High cardinality` | Use `topk()` or add label filters |

### Debug Mode

```bash
# Enable query debugging
/skill prometheus-grafana debug-query \
  --query "rate(http_requests_total[5m])" \
  --explain
```

## Related Skills

- **log-analysis** - Loki log analysis integration
- **slo-sli-tracking** - SLO/SLI management
- **incident-platforms** - PagerDuty/Opsgenie alerting

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Documentation](https://grafana.com/docs/)
- [mcp-grafana](https://github.com/grafana/mcp-grafana)
- [SLO with Prometheus](https://sre.google/workbook/implementing-slos/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-003
**Category:** Observability
**Status:** Active
