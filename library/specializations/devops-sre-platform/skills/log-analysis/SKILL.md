---
name: log-analysis
description: Structured log analysis and aggregation expertise for observability and troubleshooting
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# Log Analysis Skill

## Overview

Specialized skill for log analysis, parsing, and aggregation across various logging platforms and formats. Provides deep expertise in extracting insights from logs for troubleshooting and observability.

## Capabilities

### Log Parsing
- Parse structured log formats (JSON, logfmt)
- Handle unstructured logs with pattern matching
- Extract fields and metadata from syslog
- Parse custom application log formats
- Handle multi-line log entries (stack traces)

### Query Languages
- Write and optimize Loki LogQL queries
- Generate Elasticsearch/OpenSearch queries
- Create Splunk SPL queries
- Build CloudWatch Logs Insights queries

### Pattern Detection
- Identify log patterns and anomalies
- Detect error clusters and trends
- Correlate logs across services
- Find root cause indicators in log streams

### Alerting Integration
- Create log-based alerting rules
- Configure alert thresholds and conditions
- Design alert aggregation strategies
- Implement alert suppression logic

### Pipeline Configuration
- Configure log shipping (Fluentd, Fluent Bit, Vector)
- Design log parsing pipelines
- Implement log enrichment and transformation
- Set up log routing and filtering

## Target Processes

- `log-aggregation.js` - Log aggregation system setup
- `monitoring-setup.js` - Integrated observability stack
- `incident-response.js` - Log analysis during incidents

## Usage Context

This skill is invoked when processes require:
- Setting up log aggregation pipelines
- Writing queries to analyze log data
- Troubleshooting issues using logs
- Creating log-based alerts and dashboards
- Parsing and transforming log formats

## Dependencies

- Loki/Grafana or Elasticsearch/Kibana access
- Log shipper CLI tools (fluentd, vector)
- Cloud logging APIs (CloudWatch, Stackdriver)

## Output Formats

- LogQL/ES query strings
- Log pipeline configurations
- Alert rule definitions
- Log analysis reports
- Parsed log samples
