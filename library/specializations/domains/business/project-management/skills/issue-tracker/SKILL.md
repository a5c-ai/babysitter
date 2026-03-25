---
name: issue-tracker
description: Track and manage project issues with escalation and resolution workflows
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Issue Management
  id: SK-014
---

# Issue Tracker

## Overview

The Issue Tracker skill provides comprehensive project issue management capabilities. It tracks issues through their lifecycle, manages escalation workflows, performs root cause analysis, and generates metrics for continuous improvement in issue resolution.

## Capabilities

### Issue Logging
- Create issue logs with categorization
- Assign priority, severity, and impact levels
- Link issues to WBS elements and deliverables
- Capture issue context and history
- Support issue templates by type

### Escalation Management
- Define escalation paths and triggers
- Automate escalation based on aging rules
- Track escalation history
- Notify stakeholders at escalation points
- Support custom escalation hierarchies

### Resolution Workflow
- Track issue aging and SLA compliance
- Manage resolution actions and owners
- Link issues to risks and change requests
- Track resolution verification
- Support issue reopen and recurrence tracking

### Analysis and Reporting
- Perform root cause analysis (5 Whys, Fishbone)
- Generate issue status reports
- Calculate issue resolution metrics
- Analyze issue trends and patterns
- Automate issue notifications and reminders

## Usage

### Input Requirements
- Issue description and classification
- Priority and severity criteria
- Escalation rules and thresholds
- SLA definitions
- Resolution workflow configuration

### Output Deliverables
- Issue register/log
- Issue status report
- Escalation alerts
- Resolution metrics dashboard
- Root cause analysis documentation

### Example Use Cases
1. **Issue Capture**: Log and categorize new issues
2. **Status Review**: Generate issue status for meetings
3. **Escalation**: Automate issue escalation process
4. **Process Improvement**: Analyze issue patterns

## Process Integration

This skill integrates with the following processes:
- Issue Management and Escalation
- Risk Monitoring and Response Execution
- Status Reporting and Communication Management
- Quality Assurance Implementation

## Dependencies

- Workflow automation frameworks
- Notification systems
- Analytics libraries
- Root cause analysis templates

## Related Skills

- SK-006: Risk Register Manager
- SK-012: Change Request Analyzer
- SK-016: Kanban Board Analyzer
