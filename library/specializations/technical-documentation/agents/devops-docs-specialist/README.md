# DevOps Documentation Specialist Agent

## Overview

The `devops-docs-specialist` agent provides expertise in operational documentation, including runbooks, incident documentation, deployment guides, and on-call handbooks. It embodies best practices from SRE documentation methodologies.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | SRE Documentation Specialist |
| **Experience** | 6+ years in DevOps/SRE documentation |
| **Background** | Site reliability engineering |
| **Philosophy** | "If it's not documented, it didn't happen" |

## Core Expertise

1. **Runbook Development** - Action-oriented operational procedures
2. **Incident Documentation** - Postmortems and incident reports
3. **Deployment Guides** - Checklists and procedures
4. **On-Call Documentation** - Handbooks and escalation guides
5. **Infrastructure Docs** - System architecture documentation

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(devopsDocsTask, {
  agentName: 'devops-docs-specialist',
  prompt: {
    role: 'SRE Documentation Specialist',
    task: 'Create runbook for payment service alerts',
    context: {
      serviceName: 'payment-api',
      alerts: alertList,
      architecture: architectureDocs
    },
    instructions: [
      'Create alert response procedures',
      'Include diagnostic commands',
      'Document escalation paths',
      'Add rollback procedures'
    ],
    outputFormat: 'Markdown'
  }
});
```

### Direct Invocation

```bash
# Create runbook
/agent devops-docs-specialist create-runbook \
  --service payment-api \
  --alerts alerts.yaml

# Generate incident report
/agent devops-docs-specialist incident-report \
  --incident INC-2026-0042

# Create deployment checklist
/agent devops-docs-specialist deployment-checklist \
  --service user-api \
  --version 2.1.0
```

## Common Tasks

### 1. Runbook Creation

```bash
/agent devops-docs-specialist create-runbook \
  --service api-gateway \
  --include-alerts \
  --include-rollback
```

Output:
- Alert response procedures
- Diagnostic commands
- Remediation steps
- Escalation paths
- Rollback procedures

### 2. Incident Documentation

```bash
/agent devops-docs-specialist incident-postmortem \
  --incident INC-2026-0042 \
  --timeline events.json
```

Output:
- Executive summary
- Detailed timeline
- Root cause analysis
- Action items
- Lessons learned

### 3. Deployment Guide

```bash
/agent devops-docs-specialist deployment-guide \
  --service payment-api \
  --type blue-green
```

Output:
- Pre-deployment checklist
- Deployment steps
- Verification procedures
- Rollback plan

## Documentation Templates

### Runbook Structure

```markdown
# [Service] Runbook

## Quick Reference
| Action | Command |
|--------|---------|
| Check status | `kubectl get pods` |
| View logs | `kubectl logs -f` |

## Alert Procedures
### [Alert Name]
1. Diagnosis steps
2. Remediation actions
3. Escalation path

## Rollback Procedures
[Rollback steps]
```

### Incident Report

```markdown
# Incident Report: INC-YYYY-NNNN

## Summary
- Date: YYYY-MM-DD
- Duration: HH:MM
- Severity: SEV-X
- Impact: [description]

## Timeline
| Time | Event |
|------|-------|
| 14:00 | Alert fired |

## Root Cause
[Analysis]

## Action Items
| Action | Owner | Due |
|--------|-------|-----|
| Fix bug | @dev | Date |
```

## Process Integration

| Process | Agent Role |
|---------|------------|
| `runbook-docs.js` | Create and maintain runbooks |
| `incident-docs.js` | Facilitate postmortems |
| `how-to-guides.js` | Operational guides |

## Documentation Principles

### Actionability
- Commands should be copy-pasteable
- Include expected output
- Provide verification steps

### Accessibility
- Available during outages
- Mobile-friendly format
- Quick reference at top

### Maintainability
- Version controlled
- Regular testing schedule
- Clear ownership

## Quality Checklist

| Criterion | Required |
|-----------|----------|
| Quick reference section | Yes |
| Copy-pasteable commands | Yes |
| Verification steps | Yes |
| Rollback procedures | Yes |
| Escalation paths | Yes |
| Last tested date | Yes |

## Example Output

### Runbook Quick Reference

```markdown
## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| High CPU | Scale horizontally |
| OOM | Restart pod |
| Slow queries | Check connection pool |

### Status Check
```bash
kubectl get pods -n production | grep payment
```

### View Logs
```bash
kubectl logs -f -l app=payment-api --tail=100
```
```

## References

- [Google SRE Book](https://sre.google/books/)
- [PagerDuty Incident Response](https://response.pagerduty.com/)
- [Atlassian Incident Management](https://www.atlassian.com/incident-management)
- [Runbook Best Practices](https://www.transposit.com/devops-blog/itsm/what-makes-a-good-runbook/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-005
**Category:** Operations Documentation
**Status:** Active
