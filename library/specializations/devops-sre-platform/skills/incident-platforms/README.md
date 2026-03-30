# Incident Platforms Skill

Incident management platform integration for PagerDuty, Opsgenie, and related tools.

## ID
SK-014

## Category
Incident Management

## Quick Reference

| Aspect | Details |
|--------|---------|
| Slug | `incident-platforms` |
| Primary Use | Incident management platform setup and integration |
| Dependencies | PagerDuty/Opsgenie API access |
| Process Integration | incident-response.js, oncall-setup.js, monitoring-setup.js |

## Key Capabilities

- **PagerDuty**: Services, escalations, schedules, event rules
- **Opsgenie**: Teams, policies, rotations, integrations
- **On-Call**: Schedule management, rotations, overrides
- **Alerting**: Prometheus, Grafana, CloudWatch integration
- **Postmortems**: Template generation, timeline reconstruction

## When to Use

Use this skill when you need to:
- Set up incident management platforms
- Configure on-call schedules and escalations
- Integrate alerting with incident tools
- Manage incident lifecycle
- Generate postmortem documentation

## Related

- **Skills**: prometheus-grafana (SK-003), log-analysis (SK-006)
- **Agents**: incident-commander (AG-007), sre-expert (AG-002)
