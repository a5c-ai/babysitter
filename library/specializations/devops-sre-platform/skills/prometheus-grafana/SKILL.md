---
name: prometheus-grafana
description: Expert skill for Prometheus metrics and Grafana dashboards. Write and validate PromQL queries, generate Grafana dashboard JSON, create alerting and recording rules, analyze metric cardinality, and debug scrape configurations.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: observability
  backlog-id: SK-003
---

# prometheus-grafana

You are **prometheus-grafana** - a specialized skill for Prometheus metrics and Grafana dashboards. This skill provides expert capabilities for building and maintaining observability infrastructure.

## Overview

This skill enables AI-powered observability operations including:
- Writing and validating PromQL queries
- Generating Grafana dashboard JSON configurations
- Creating alerting rules and recording rules
- Analyzing metric cardinality and performance
- Debugging scrape configurations
- Interpreting metric patterns and anomalies

## Prerequisites

- Prometheus server access
- Grafana instance with API access
- Optional: Alertmanager for alerting
- Optional: Thanos/Cortex for long-term storage

## Capabilities

### 1. PromQL Query Writing

Write and optimize PromQL queries:

```promql
# Request rate
rate(http_requests_total{job="api"}[5m])

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# P99 latency
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)

# Availability (SLI)
sum(rate(http_requests_total{status!~"5.."}[30d]))
/ sum(rate(http_requests_total[30d])) * 100

# Resource saturation
avg(rate(container_cpu_usage_seconds_total[5m]))
/ avg(kube_pod_container_resource_limits{resource="cpu"}) * 100
```

### 2. Recording Rules

Create recording rules for performance optimization:

```yaml
groups:
  - name: api_metrics
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)

      - record: job:http_errors:rate5m
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)

      - record: job:http_error_ratio:rate5m
        expr: |
          job:http_errors:rate5m / job:http_requests:rate5m

  - name: slo_metrics
    interval: 1m
    rules:
      - record: slo:availability:ratio_30d
        expr: |
          sum(rate(http_requests_total{status!~"5.."}[30d]))
          / sum(rate(http_requests_total[30d]))
```

### 3. Alerting Rules

Create comprehensive alerting rules:

```yaml
groups:
  - name: service_alerts
    rules:
      - alert: HighErrorRate
        expr: |
          job:http_error_ratio:rate5m > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "{{ $labels.job }} has error rate of {{ $value | humanizePercentage }}"
          runbook_url: "https://wiki.example.com/runbooks/high-error-rate"

      - alert: ServiceDown
        expr: up{job="api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} is unreachable"

      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High P99 latency"
          description: "P99 latency for {{ $labels.service }} is {{ $value }}s"
```

### 4. Grafana Dashboard Generation

Generate Grafana dashboard JSON:

```json
{
  "dashboard": {
    "title": "Service Overview",
    "uid": "service-overview",
    "tags": ["production", "api"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "panels": [
      {
        "title": "Request Rate",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{job=\"api\"}[5m])) by (status)",
            "legendFormat": "{{ status }}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps"
          }
        }
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "gridPos": { "h": 4, "w": 6, "x": 12, "y": 0 },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 1 },
                { "color": "red", "value": 5 }
              ]
            }
          }
        }
      }
    ]
  }
}
```

### 5. Scrape Configuration

Debug and generate scrape configurations:

```yaml
scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

### 6. Metric Cardinality Analysis

Analyze and optimize metric cardinality:

```promql
# Top metrics by cardinality
topk(10, count by (__name__)({__name__=~".+"}))

# Label value counts
count(count by (label_name) (metric_name))

# Memory usage by metric
prometheus_tsdb_head_series / prometheus_tsdb_head_chunks
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| mcp-grafana (Grafana Labs) | Official Grafana MCP server | [GitHub](https://github.com/grafana/mcp-grafana) |
| loki-mcp (Grafana) | Loki log integration | [GitHub](https://github.com/grafana/loki-mcp) |

## Best Practices

### PromQL

1. **Use recording rules** - Pre-compute expensive queries
2. **Limit cardinality** - Avoid unbounded labels
3. **Use appropriate ranges** - Match scrape interval
4. **Prefer rate() over increase()** - More accurate for graphs

### Alerting

1. **Multi-window alerting** - Combine short and long windows
2. **Clear runbook links** - Include in annotations
3. **Appropriate severity** - Match business impact
4. **Avoid alert fatigue** - Alert on symptoms, not causes

### Dashboards

1. **USE method** - Utilization, Saturation, Errors
2. **RED method** - Rate, Errors, Duration
3. **Consistent layout** - Follow dashboard patterns
4. **Variable templates** - Enable filtering

## Process Integration

This skill integrates with the following processes:
- `monitoring-setup.js` - Initial Prometheus/Grafana setup
- `slo-sli-tracking.js` - SLO/SLI dashboard creation
- `error-budget-management.js` - Error budget dashboards

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "create-dashboard",
  "status": "success",
  "dashboard": {
    "uid": "service-overview",
    "url": "https://grafana.example.com/d/service-overview"
  },
  "validation": {
    "queries": "valid",
    "panels": 8,
    "warnings": []
  },
  "artifacts": ["dashboard.json"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `No data` | Metric not scraped | Check scrape config and targets |
| `Many-to-many matching` | Ambiguous join | Use `on()` or `ignoring()` |
| `Query timeout` | Complex query | Use recording rules |
| `Cardinality explosion` | Unbounded labels | Add label constraints |

## Constraints

- Validate PromQL syntax before applying
- Test alerts in non-production first
- Consider cardinality impact of new metrics
- Use appropriate retention settings
