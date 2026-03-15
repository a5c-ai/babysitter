# SRE Expert Agent

## Overview

The `sre-expert` agent embodies the principles and practices from the Google SRE book. It provides expert guidance on SLO/SLI definition, error budget management, incident management, capacity planning, toil reduction, and reliability patterns.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Site Reliability Engineer |
| **Experience** | 8+ years in SRE/operations |
| **Background** | Google SRE methodology trained |
| **Philosophy** | "Hope is not a strategy" |

## Core SRE Principles

1. **Embracing Risk** - Balance reliability with innovation
2. **Service Level Objectives** - Define measurable reliability targets
3. **Eliminating Toil** - Automate repetitive tasks
4. **Monitoring** - The four golden signals
5. **Release Engineering** - Safe, reliable deployments
6. **Simplicity** - Reduce system complexity

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **SLO/SLI** | Definition, measurement, alerting |
| **Error Budgets** | Calculation, policies, burn rate alerts |
| **Incidents** | Response framework, postmortems |
| **Capacity** | Planning, forecasting, optimization |
| **Toil** | Identification, measurement, automation |
| **Reliability** | Patterns, anti-patterns, resilience |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(sreExpertTask, {
  agentName: 'sre-expert',
  prompt: {
    role: 'Senior SRE',
    task: 'Define SLOs for the payment service',
    context: {
      serviceName: 'payment-api',
      currentMetrics: await getServiceMetrics(),
      businessRequirements: requirements
    },
    instructions: [
      'Identify appropriate SLIs',
      'Define realistic SLO targets',
      'Create error budget policy',
      'Design alerting strategy'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Define SLOs for a service
/agent sre-expert define-slos \
  --service payment-api \
  --criticality tier1

# Error budget analysis
/agent sre-expert analyze-error-budget \
  --service payment-api \
  --window 30d

# Postmortem facilitation
/agent sre-expert facilitate-postmortem \
  --incident INC-2024-0042

# Toil assessment
/agent sre-expert assess-toil \
  --team platform-sre
```

## Common Tasks

### 1. SLO Definition

The agent can define comprehensive SLOs:

```bash
/agent sre-expert define-slos \
  --service user-api \
  --user-journey login,signup,profile \
  --output-format yaml
```

Output includes:
- Availability SLI and SLO
- Latency SLIs (P50, P95, P99)
- Error rate thresholds
- Alerting configuration
- Error budget policy

### 2. Error Budget Analysis

```bash
/agent sre-expert analyze-error-budget \
  --service payment-api \
  --window 30d \
  --include-forecast
```

Provides:
- Current budget consumption
- Burn rate trends
- Forecast to budget exhaustion
- Recommended actions

### 3. Incident Postmortem

```bash
/agent sre-expert generate-postmortem \
  --incident INC-2024-0042 \
  --timeline events.json \
  --metrics metrics.json
```

Generates:
- Structured postmortem document
- Root cause analysis
- Action items with priorities
- Lessons learned

### 4. Capacity Planning

```bash
/agent sre-expert capacity-plan \
  --service api-gateway \
  --horizon 6months \
  --growth-rate 15%
```

Delivers:
- Current capacity assessment
- Growth projections
- Resource requirements
- Cost estimates

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `slo-sli-tracking.js` | SLI selection, SLO target definition |
| `error-budget-management.js` | Policy creation, burn rate alerting |
| `incident-response.js` | Framework design, postmortem review |
| `oncall-setup.js` | Rotation design, escalation policies |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const defineSLOsTask = defineTask({
  name: 'define-slos',
  description: 'Define SLOs for a service with SRE best practices',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Define SLOs for ${inputs.serviceName}`,
      agent: {
        name: 'sre-expert',
        prompt: {
          role: 'Senior Site Reliability Engineer',
          task: 'Define comprehensive SLOs for the service',
          context: {
            service: inputs.serviceName,
            userJourneys: inputs.userJourneys,
            businessCriticality: inputs.criticality,
            currentMetrics: inputs.metrics,
            dependencies: inputs.dependencies
          },
          instructions: [
            'Identify user-facing SLIs for each journey',
            'Set realistic SLO targets based on current performance',
            'Define error budget policies',
            'Create multi-window burn rate alerts',
            'Document measurement methodology'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['slos', 'errorBudgetPolicy', 'alerts'],
          properties: {
            slos: { type: 'array' },
            errorBudgetPolicy: { type: 'object' },
            alerts: { type: 'array' }
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

## SRE Framework Reference

### The Four Golden Signals

| Signal | Description | Example Metric |
|--------|-------------|----------------|
| **Latency** | Time to service a request | `http_request_duration_seconds` |
| **Traffic** | Demand on the system | `http_requests_total` |
| **Errors** | Rate of failed requests | `http_errors_total` |
| **Saturation** | System resource utilization | `container_cpu_usage_seconds_total` |

### Error Budget Formula

```
Error Budget = 1 - SLO Target

Example:
- SLO: 99.9% availability
- Error Budget: 0.1%
- 30-day budget: 43.2 minutes downtime
```

### Burn Rate Alerting

| Condition | Burn Rate | Alert Severity |
|-----------|-----------|----------------|
| 2% budget in 1 hour | 14.4x | Critical (page) |
| 5% budget in 6 hours | 6x | Warning (ticket) |
| 10% budget in 3 days | 1x | Info |

## Knowledge Base

### Reliability Patterns

| Pattern | Use Case |
|---------|----------|
| Circuit Breaker | Prevent cascade failures |
| Bulkhead | Isolate failure domains |
| Retry with Backoff | Handle transient failures |
| Timeout | Prevent indefinite waits |
| Graceful Degradation | Maintain core functionality |

### Anti-patterns to Avoid

- Cascading failures
- Thundering herd
- Retry storms
- Death spirals
- Alert fatigue

## Interaction Guidelines

### What to Expect

- **Data-driven recommendations** with metrics support
- **Balanced approach** considering business and reliability
- **Blameless analysis** focusing on systems, not people
- **Actionable outcomes** with clear next steps

### Best Practices

1. Provide current metrics and SLO status
2. Include business context and priorities
3. Share recent incident history
4. Specify team capacity constraints

## Related Resources

- [prometheus-grafana skill](../skills/prometheus-grafana/) - Monitoring setup
- [incident-platforms skill](../skills/incident-platforms/) - PagerDuty/Opsgenie
- [observability-expert agent](../agents/observability-expert/) - Metrics expertise

## References

- [Site Reliability Engineering (Google)](https://sre.google/books/)
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/)
- [Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [SLO with Prometheus](https://prometheus.io/docs/practices/instrumentation/#counter-vs-gauge-summary-vs-histogram)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-002
**Category:** Site Reliability
**Status:** Active
