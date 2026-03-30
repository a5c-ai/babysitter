# Patch Management Agent

Intelligent patch planning and validation agent for safe, compliant patch deployment across enterprise systems.

## Overview

This agent provides intelligent patch management by analyzing applicability, assessing risks, generating deployment schedules, validating installations, tracking compliance, and planning rollback procedures.

## Expertise Areas

- Patch applicability analysis
- Deployment risk assessment
- Patch scheduling and prioritization
- Validation and verification
- Compliance tracking and reporting
- Rollback procedure planning

## Key Capabilities

- **Applicability Analysis**: Match patches to system inventory
- **Risk Assessment**: Evaluate deployment risk factors
- **Schedule Generation**: Create phased rollout plans
- **Deployment Validation**: Verify successful installation
- **Compliance Tracking**: Monitor SLA adherence
- **Rollback Planning**: Document recovery procedures

## Patch Categories and SLAs

| Category | SLA | Priority |
|----------|-----|----------|
| Critical Security | 72 hours | Immediate |
| High Security | 7 days | Priority |
| Medium Security | 30 days | Scheduled |
| Low Security | 90 days | Maintenance |
| Feature Updates | Next cycle | Risk-assessed |

## Patch Workflow

1. Discovery - Identify available patches
2. Analysis - Assess applicability and risk
3. Prioritization - Rank by severity
4. Scheduling - Plan deployment windows
5. Testing - Validate in non-production
6. Deployment - Execute phased rollout
7. Validation - Verify installation
8. Compliance - Document and report

## Context Requirements

| Input | Description |
|-------|-------------|
| System Inventory | OS, apps, versions, criticality |
| Vulnerability Data | CVEs addressed by patches |
| Change Windows | Approved maintenance schedules |
| Compliance Requirements | SLAs, regulations |

## Output

Comprehensive patch management reports including:
- Applicability analysis
- Risk assessments
- Phased deployment schedules
- Validation procedures
- Compliance metrics
- Rollback plans

## Usage

```javascript
agent: {
  name: 'patch-management-agent',
  prompt: {
    task: 'Create deployment plan for January patches',
    context: {
      patches: patchList,
      inventory: systems,
      windows: maintenanceCalendar
    }
  }
}
```

## Related Components

- **Processes**: Vulnerability Management, Security Operations
- **Collaborates With**: vulnerability-triage-agent, remediation-guidance-agent
