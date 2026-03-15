---
name: usage-analytics-collector
description: Privacy-respecting SDK usage analytics collection
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Usage Analytics Collector Skill

## Overview

This skill implements privacy-respecting SDK usage analytics that help understand feature adoption, usage patterns, and developer experience while maintaining user trust.

## Capabilities

- Track SDK feature usage patterns
- Implement configurable opt-in/opt-out mechanisms
- Anonymize collected data appropriately
- Generate usage dashboards and reports
- Support event batching and offline collection
- Implement differential privacy techniques
- Configure data retention policies
- Support multiple analytics backends

## Target Processes

- Telemetry and Analytics Integration
- Developer Portal Implementation
- Developer Experience Optimization

## Integration Points

- Segment for event routing
- Amplitude for product analytics
- Mixpanel for user analytics
- Custom analytics backends
- Data warehouses

## Input Requirements

- Events to track
- Privacy requirements
- Opt-in/opt-out mechanisms
- Anonymization rules
- Retention policies

## Output Artifacts

- Analytics collection module
- Opt-in/opt-out UI components
- Event schemas
- Anonymization utilities
- Dashboard configurations
- Privacy documentation

## Usage Example

```yaml
skill:
  name: usage-analytics-collector
  context:
    consentModel: opt-in
    events:
      - sdkInitialized
      - apiCallMade
      - errorOccurred
      - featureUsed
    anonymization:
      ipAddresses: hash
      userIds: pseudonymize
    batching:
      enabled: true
      maxBatchSize: 100
      flushInterval: 60s
    retention: 90d
    backend: segment
```

## Best Practices

1. Default to opt-out for sensitive data
2. Clearly document what is collected
3. Anonymize all personal identifiers
4. Implement data minimization
5. Provide easy opt-out mechanisms
6. Respect Do Not Track signals
