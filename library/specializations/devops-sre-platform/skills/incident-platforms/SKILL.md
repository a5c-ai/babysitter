---
name: incident-platforms
description: Incident management platform integration for PagerDuty, Opsgenie, and related tools
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# Incident Platforms Skill

## Overview

Specialized skill for incident management platform integration and operations. Provides deep expertise in PagerDuty, Opsgenie, and related incident response tooling.

## Capabilities

### PagerDuty Configuration
- Service and service directory setup
- Escalation policy design
- Schedule configuration
- Event rules and routing
- Service dependencies mapping
- Business services setup
- Analytics and reporting

### Opsgenie Configuration
- Team and user management
- Escalation policy creation
- Schedule and rotation setup
- Integration configurations
- Alert policies and routing
- Notification rules

### Incident Lifecycle
- Incident creation and triaging
- Priority and severity classification
- Status page updates
- Stakeholder communication
- Incident timeline documentation
- Resolution and closure

### On-Call Management
- Schedule creation and management
- Rotation patterns (weekly, daily, custom)
- Override handling
- Coverage gaps identification
- Handoff procedures
- On-call compensation tracking

### Alerting Integration
- Prometheus Alertmanager integration
- Grafana alerting integration
- CloudWatch alarm routing
- Custom webhook configurations
- Alert deduplication rules
- Suppression and maintenance windows

### Postmortem Support
- Postmortem template generation
- Timeline reconstruction
- Action item tracking
- Blameless postmortem facilitation
- Metrics extraction (MTTR, MTTD)

## Target Processes

- `incident-response.js` - Incident response framework
- `oncall-setup.js` - On-call rotation management
- `monitoring-setup.js` - Alert routing integration

## Usage Context

This skill is invoked when processes require:
- Setting up incident management platforms
- Configuring on-call schedules and escalations
- Integrating alerting with incident platforms
- Managing incident lifecycle
- Generating postmortem documentation

## Dependencies

- PagerDuty API access (API key)
- Opsgenie API access
- Monitoring system integration credentials

## Output Formats

- PagerDuty service/escalation configurations
- Opsgenie team/schedule configurations
- Integration webhook configurations
- Postmortem templates
- On-call schedule reports
