---
name: onboarding-workflow
description: Automate and manage employee onboarding workflows, checklists, and new hire integration
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Talent Acquisition
  skill-id: SK-004
  dependencies:
    - HRIS integration
    - Task management systems
---

# Onboarding Workflow Skill

## Overview

The Onboarding Workflow skill provides capabilities for automating and managing employee onboarding processes. This skill enables role-specific checklists, preboarding communications, 30-60-90 day plans, and comprehensive onboarding effectiveness measurement.

## Capabilities

### Onboarding Checklist Generation
- Generate role-specific onboarding checklists
- Create department-specific requirements
- Build compliance training schedules
- Configure equipment and access requests
- Set up documentation requirements

### Preboarding Communications
- Create preboarding communication sequences
- Send welcome messages and information packets
- Coordinate Day 1 logistics
- Share company culture materials
- Provide manager introduction communications

### 30-60-90 Day Planning
- Build 30-60-90 day plans by position type
- Create milestone definitions
- Set learning objectives
- Define performance expectations
- Schedule checkpoint meetings

### Task Tracking
- Track onboarding task completion and milestones
- Monitor progress against timelines
- Send reminder notifications
- Generate completion reports
- Identify at-risk new hires

### IT Provisioning
- Generate IT provisioning requests
- Configure system access workflows
- Track equipment delivery
- Manage software license assignments
- Coordinate security badge access

### Buddy/Mentor Programs
- Create buddy/mentor assignment workflows
- Match new hires with appropriate mentors
- Track buddy program engagement
- Generate conversation guides
- Measure mentorship effectiveness

### Effectiveness Measurement
- Measure onboarding effectiveness metrics
- Track time to productivity
- Survey new hire satisfaction
- Calculate onboarding ROI
- Benchmark against best practices

## Usage

### Onboarding Plan Generation
```javascript
const onboardingConfig = {
  employee: {
    name: 'John Smith',
    role: 'Software Engineer',
    department: 'Engineering',
    manager: 'Jane Doe',
    startDate: '2026-02-01',
    location: 'Remote'
  },
  components: {
    preboarding: true,
    firstDay: true,
    firstWeek: true,
    thirtyDayPlan: true,
    sixtyDayPlan: true,
    ninetyDayPlan: true
  },
  integrations: {
    hris: 'Workday',
    itTicketing: 'ServiceNow',
    lms: 'Cornerstone'
  }
};
```

### 30-60-90 Day Template
```javascript
const planTemplate = {
  role: 'Product Manager',
  milestones: {
    day30: [
      'Complete all compliance training',
      'Meet with all key stakeholders',
      'Understand product roadmap',
      'Shadow customer calls'
    ],
    day60: [
      'Own first feature specification',
      'Lead sprint planning meeting',
      'Present market analysis',
      'Complete product training'
    ],
    day90: [
      'Launch first feature',
      'Establish KPI dashboard',
      'Complete performance goals',
      'Full role independence'
    ]
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| employee-onboarding-program.js | Full onboarding workflow |
| full-cycle-recruiting.js | Handoff from recruiting |

## Best Practices

1. **Start Early**: Begin preboarding before Day 1
2. **Role Customization**: Tailor onboarding to specific roles
3. **Manager Involvement**: Ensure managers are active participants
4. **Feedback Loops**: Gather feedback at multiple checkpoints
5. **Buddy System**: Assign peers for informal support
6. **Clear Milestones**: Define success criteria at each stage

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Time to Productivity | Days to full role capability | Role-dependent |
| New Hire NPS | Onboarding experience score | >50 |
| Task Completion Rate | Checklist items completed on time | >90% |
| 90-Day Retention | New hires remaining at 90 days | >95% |
| Manager Satisfaction | Manager rating of onboarding | >4/5 |

## Related Skills

- SK-001: ATS Integration (recruiting handoff)
- SK-015: Benefits Enrollment (benefits onboarding)
