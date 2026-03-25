---
name: JMeter Performance Testing
description: Apache JMeter expertise for enterprise-grade load and performance testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# JMeter Performance Testing Skill

## Overview

This skill provides expert-level capabilities for Apache JMeter-based performance testing, enabling test plan creation, distributed testing, and comprehensive result analysis.

## Capabilities

### Test Plan Development
- Create and modify JMeter test plans (JMX)
- Configure thread groups and samplers
- Implement HTTP, JDBC, JMS samplers
- Handle various protocols (HTTP, FTP, LDAP, SOAP)

### Dynamic Data Handling
- Correlation for dynamic values
- Regular expression extractors
- JSON/XPath extractors
- Parameterization with CSV data sets

### Distributed Testing
- Configure distributed testing across multiple machines
- Remote server management
- Load distribution strategies

### Results Analysis
- Analyze JMeter results and reports
- Generate HTML dashboard reports
- Aggregate report interpretation
- Identify performance bottlenecks

### Plugin Integration
- Blazemeter plugin integration
- Custom plugin configuration
- Extended samplers and listeners

## Target Processes

- `performance-testing.js` - Performance test implementation
- `api-testing.js` - API load testing

## Dependencies

- `Apache JMeter` - Load testing tool
- Java Runtime Environment (JRE)
- JMeter plugins (optional)

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'jmeter-performance',
    context: {
      action: 'execute-test-plan',
      testPlan: 'tests/performance/load-test.jmx',
      threads: 100,
      rampUp: 60,
      duration: 300,
      generateReport: true
    }
  }
}
```

## Configuration

The skill can execute JMeter test plans in GUI or non-GUI mode and supports distributed testing configurations.
