---
name: crisis-management-platform
description: Crisis response platform integration and real-time monitoring
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: public-relations
  domain: business
  category: Crisis Communications
  skill-id: SK-005
  dependencies:
    - Crisis management platform APIs
    - Slack/Teams APIs
---

# Crisis Management Platform Skill

## Overview

The Crisis Management Platform skill provides crisis response platform integration and real-time monitoring capabilities. This skill enables rapid crisis detection, coordinated response, and comprehensive documentation throughout crisis situations.

## Capabilities

### Monitoring and Detection
- Crisis monitoring dashboard configuration
- Real-time alert escalation
- Multi-channel signal detection
- Threshold-based triggering
- Pattern recognition for emerging issues

### Response Coordination
- Stakeholder notification system integration
- Holding statement rapid deployment
- Multi-channel response coordination
- Team collaboration tools integration
- Role-based access and assignments

### Digital Infrastructure
- Dark site activation management
- Social media response queuing
- Website messaging updates
- Email communication triggers
- Hotline message coordination

### Documentation and Logging
- Incident logging and documentation
- Response time tracking
- Decision audit trail
- Media inquiry tracking
- Stakeholder communication log

### Post-Crisis Analysis
- Post-crisis report generation
- Timeline reconstruction
- Response effectiveness analysis
- Lessons learned documentation
- Plan update recommendations

## Usage

### Crisis Dashboard Configuration
```javascript
const crisisDashboardConfig = {
  monitoringSources: {
    media: ['cision', 'meltwater'],
    social: ['sprinklr', 'talkwalker'],
    internal: ['employee-hotline', 'customer-service'],
    regulatory: ['sec-filings', 'fda-alerts']
  },
  alertTiers: {
    tier1: {
      triggers: ['executive-mention-negative', 'regulatory-action', 'data-breach'],
      escalation: 'immediate',
      notification: ['cco', 'ceo', 'legal', 'crisis-team']
    },
    tier2: {
      triggers: ['product-issue', 'employee-incident', 'competitor-attack'],
      escalation: '15min',
      notification: ['comms-director', 'pr-manager']
    },
    tier3: {
      triggers: ['negative-review-spike', 'social-complaint-surge'],
      escalation: '1hr',
      notification: ['social-team', 'customer-service']
    }
  },
  collaboration: {
    platform: 'slack',
    channels: {
      warRoom: '#crisis-war-room',
      mediaInquiries: '#media-inquiries',
      socialResponse: '#social-response'
    }
  },
  assets: {
    holdingStatements: ['data-breach', 'product-recall', 'executive-departure'],
    darkSites: ['incident-response.company.com'],
    templates: ['employee-comm', 'customer-comm', 'media-statement']
  }
};
```

### Crisis Response Execution
```javascript
const crisisResponse = {
  incident: {
    id: 'INC-2026-001',
    type: 'data-breach',
    detectedAt: '2026-02-15T14:30:00Z',
    severity: 'tier1',
    status: 'active'
  },
  actions: [
    { time: '14:30', action: 'Alert triggered', owner: 'system' },
    { time: '14:32', action: 'Crisis team notified', owner: 'system' },
    { time: '14:45', action: 'War room activated', owner: 'CCO' },
    { time: '15:00', action: 'Holding statement approved', owner: 'Legal' },
    { time: '15:15', action: 'Dark site activated', owner: 'Digital' },
    { time: '15:30', action: 'Employee communication sent', owner: 'Internal Comms' },
    { time: '16:00', action: 'Press statement released', owner: 'Media Relations' }
  ],
  metrics: {
    detectionToNotification: '2min',
    notificationToActivation: '13min',
    activationToStatement: '45min',
    mediaInquiriesReceived: 15,
    socialMentions: 450,
    employeeQuestions: 89
  },
  stakeholders: {
    media: { contacted: 15, responded: 12 },
    employees: { notified: 'all', questions: 89 },
    customers: { notified: 'affected', inquiries: 234 },
    regulators: { notified: true, filingRequired: true }
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| crisis-communications-plan.js | Plan activation |
| crisis-response-execution.js | Response coordination |
| crisis-simulation-training.js | Training scenarios |
| post-crisis-analysis.js | Analysis and reporting |

## Best Practices

1. **Test Regularly**: Conduct crisis drills at least quarterly
2. **Maintain Assets**: Keep holding statements and templates current
3. **Clear Escalation**: Define clear escalation paths and authority
4. **Document Everything**: Log all actions and decisions
5. **Speed Matters**: Reduce detection-to-response time continuously
6. **Post-Mortem**: Always conduct thorough post-crisis analysis

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Detection Time | Time to detect crisis | <15 minutes |
| Response Time | Detection to first response | <1 hour |
| Stakeholder Notification | Time to notify key stakeholders | <30 minutes |
| Message Consistency | Alignment across channels | 100% |
| Resolution Time | Time to crisis resolution | Minimized |

## Related Skills

- SK-001: Media Monitoring (detection)
- SK-002: Social Listening (social detection)
- SK-013: Media Training Simulation (preparation)
