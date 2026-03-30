---
name: outreach-sequences
description: Outreach.io sales engagement platform for sequence management
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: sales
  domain: business
  priority: P1
  integration-points:
    - Outreach API
---

# Outreach Sequences

## Overview

The Outreach Sequences skill provides integration with Outreach.io for sales engagement automation, including sequence enrollment and management, email and call task automation, A/B test results, and rep activity tracking. This skill orchestrates multi-channel outreach at scale.

## Capabilities

### Sequence Management
- Create and manage outreach sequences
- Enroll and unenroll prospects
- Pause and resume sequence execution
- Clone and modify sequence templates

### Task Automation
- Generate email and call tasks automatically
- Schedule tasks based on optimal timing
- Track task completion rates
- Manage task prioritization

### A/B Testing
- Access A/B test configurations
- Retrieve test results and statistics
- Identify winning variants
- Apply learnings across sequences

### Activity Tracking
- Monitor rep activity levels
- Track sequence performance metrics
- Measure email engagement rates
- Analyze response patterns

## Usage

### Campaign Enrollment
```
Enroll a batch of qualified leads into the appropriate outreach sequence based on their segment.
```

### Performance Optimization
```
Analyze A/B test results to identify top-performing email templates and subject lines.
```

### Activity Monitoring
```
Track team activity levels and sequence performance to ensure adequate prospect coverage.
```

## Enhances Processes

- lead-routing-assignment
- new-hire-onboarding-ramp
- sales-playbook-development

## Dependencies

- Outreach.io subscription
- Email integration (Gmail, Outlook)
- CRM synchronization
