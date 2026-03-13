---
name: hr-investigation
description: Support workplace investigation processes with documentation and methodology guidance
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Employee Relations
  skill-id: SK-016
  dependencies:
    - Investigation templates
    - Employment law guidance
---

# HR Investigation Skill

## Overview

The HR Investigation skill provides capabilities for supporting workplace investigation processes. This skill enables proper investigation planning, interview guidance, evidence documentation, and consistent procedural handling for employee relations matters.

## Capabilities

### Investigation Planning
- Create investigation plans and interview guides
- Define scope and objectives
- Identify witnesses and evidence sources
- Establish timelines and milestones
- Document investigation parameters

### Interview Support
- Generate witness interview questions
- Create interview preparation guides
- Provide interview technique guidance
- Document interview notes consistently
- Handle sensitive conversations

### Evidence Management
- Document evidence and findings consistently
- Organize and catalog evidence
- Maintain chain of custody
- Track evidence sources
- Support document preservation

### Legal Standards
- Apply legal standards and burden of proof
- Reference relevant employment laws
- Consider jurisdiction-specific requirements
- Identify legal consultation needs
- Support defensible processes

### Report Generation
- Create investigation summary reports
- Document findings and analysis
- Present evidence objectively
- Make credibility assessments
- Provide recommendations

### Process Management
- Track investigation timelines and milestones
- Monitor due process requirements
- Ensure procedural consistency
- Manage confidentiality requirements
- Support appeals processes

## Usage

### Investigation Plan
```javascript
const investigationPlan = {
  case: {
    id: 'INV-2026-001',
    type: 'Harassment Complaint',
    priority: 'high',
    confidential: true
  },
  scope: {
    allegations: [
      'Alleged verbal harassment by supervisor',
      'Alleged hostile work environment'
    ],
    timeframe: 'October 2025 - January 2026',
    department: 'Sales'
  },
  witnesses: [
    { role: 'complainant', name: 'Employee A', interview: 1 },
    { role: 'respondent', name: 'Employee B', interview: 2 },
    { role: 'witness', name: 'Employee C', interview: 3 }
  ],
  evidence: [
    'Email communications',
    'Slack messages',
    'Performance documentation',
    'Prior complaints'
  ],
  timeline: {
    start: '2026-01-20',
    targetCompletion: '2026-02-10',
    milestones: [
      { task: 'Initial interviews', due: '2026-01-25' },
      { task: 'Document review', due: '2026-01-30' },
      { task: 'Follow-up interviews', due: '2026-02-05' },
      { task: 'Report draft', due: '2026-02-08' }
    ]
  }
};
```

### Interview Guide
```javascript
const interviewGuide = {
  interviewee: {
    role: 'complainant',
    case: 'INV-2026-001'
  },
  sections: [
    {
      topic: 'Background',
      questions: [
        'Please describe your role and reporting relationship.',
        'How long have you worked with [respondent]?'
      ]
    },
    {
      topic: 'Specific Incidents',
      questions: [
        'Please describe the incident(s) that led to your complaint.',
        'When and where did this occur?',
        'Who else was present?',
        'What exactly was said or done?'
      ]
    },
    {
      topic: 'Impact and Response',
      questions: [
        'How did this make you feel?',
        'Did you report this to anyone at the time?',
        'Has this affected your work?'
      ]
    }
  ],
  reminders: [
    'Maintain neutral demeanor',
    'Take detailed notes',
    'Remind of confidentiality expectations',
    'Remind of non-retaliation policy'
  ]
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| workplace-investigation.js | Full investigation workflow |
| grievance-handling.js | Formal complaint investigations |
| performance-improvement-plan.js | Documentation for termination |

## Best Practices

1. **Promptness**: Begin investigations quickly after complaint
2. **Neutrality**: Maintain objectivity throughout
3. **Thoroughness**: Follow all reasonable leads
4. **Documentation**: Document everything contemporaneously
5. **Confidentiality**: Protect information appropriately
6. **Non-Retaliation**: Monitor and prevent retaliation

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Response Time | Days to begin investigation | <3 days |
| Completion Time | Days to complete investigation | <30 days |
| Documentation Quality | Complete and defensible records | 100% |
| Outcome Tracking | Resolution effectiveness | Track patterns |
| Retaliation Incidents | Retaliation complaints post-investigation | 0 |

## Related Skills

- SK-022: Employment Compliance (legal guidance)
- SK-008: PIP Documentation (performance cases)
