---
name: early-warning-monitor
description: Continuous supplier and supply chain risk monitoring with automated alerts
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: risk-management
  priority: medium
---

# Early Warning Monitor

## Overview

The Early Warning Monitor provides continuous monitoring of supplier and supply chain risk indicators. It integrates multiple data sources to detect early signs of potential disruptions and generates automated alerts for proactive risk mitigation.

## Capabilities

- **Financial Indicator Monitoring**: Credit scores, payment behavior, financial news
- **News and Media Sentiment Tracking**: Real-time news and social media monitoring
- **Regulatory Change Detection**: Policy and regulation change tracking
- **Natural Disaster Monitoring**: Weather and geological event tracking
- **Geopolitical Event Tracking**: Political and trade disruption monitoring
- **Quality Alert Aggregation**: Quality issue and recall tracking
- **Custom Threshold Alerting**: Configurable alert rules
- **Early Warning Dashboard**: Real-time risk visibility

## Input Schema

```yaml
monitoring_request:
  monitored_entities:
    suppliers: array
    locations: array
    categories: array
  monitoring_sources:
    financial: boolean
    news: boolean
    regulatory: boolean
    weather: boolean
    geopolitical: boolean
    quality: boolean
  alert_thresholds:
    financial_score_drop: integer
    sentiment_threshold: float
    severity_levels: object
  notification_preferences:
    channels: array
    recipients: array
    frequency: string
```

## Output Schema

```yaml
monitoring_output:
  alerts: array
    - alert_id: string
      timestamp: datetime
      entity: string
      entity_type: string
      alert_type: string
      severity: string            # Low, Medium, High, Critical
      source: string
      description: string
      indicators: array
      recommended_actions: array
  dashboard:
    active_alerts: integer
    by_severity: object
    by_type: object
    by_entity: object
    trends: object
  risk_signals:
    financial: array
    operational: array
    geopolitical: array
    environmental: array
  monitoring_status:
    sources_active: array
    last_update: datetime
    coverage: object
```

## Usage

### Financial Risk Monitoring

```
Input: Supplier list, credit monitoring feeds
Process: Track credit score changes, payment behavior
Output: Financial risk alerts when thresholds breached
```

### News Sentiment Analysis

```
Input: Supplier names, news and social media feeds
Process: Monitor sentiment, detect negative trends
Output: Reputation and operational risk alerts
```

### Weather and Natural Disaster Tracking

```
Input: Supplier locations, weather service feeds
Process: Monitor severe weather, assess supply impact
Output: Natural disaster alerts with affected suppliers
```

## Integration Points

- **Risk Data Providers**: Resilinc, Riskpulse, D&B
- **News APIs**: News aggregation, social media APIs
- **Weather Services**: NOAA, commercial weather feeds
- **Financial Feeds**: Credit agency data streams
- **Tools/Libraries**: News APIs, risk monitoring platforms

## Process Dependencies

- Supplier Risk Monitoring and Early Warning
- Supply Chain Disruption Response
- Supply Chain Risk Assessment

## Best Practices

1. Define clear alert escalation procedures
2. Calibrate thresholds to avoid alert fatigue
3. Validate alerts before escalation
4. Document response to each significant alert
5. Review and tune monitoring rules regularly
6. Maintain 24/7 monitoring for critical suppliers
