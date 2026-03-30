---
name: change-request-analyzer
description: Analyze change request impacts on scope, schedule, and cost
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Change Control
  id: SK-012
---

# Change Request Analyzer

## Overview

The Change Request Analyzer skill provides comprehensive impact analysis for project change requests. It evaluates changes across the triple constraint (scope, schedule, cost) plus quality and risk, supporting informed decision-making by Change Control Boards and project governance.

## Capabilities

### Change Request Processing
- Parse and categorize change requests
- Classify by type (scope, schedule, cost, quality, requirements)
- Assign priority and urgency levels
- Track change request workflow status
- Link to originating issues or requirements

### Impact Analysis
- Calculate schedule impact of changes
- Calculate cost impact of changes
- Assess scope impact (WBS affected elements)
- Evaluate quality implications
- Identify risk impacts and new risks introduced

### Reporting and Presentation
- Generate impact assessment reports
- Create CCB presentation materials
- Produce change request summaries
- Build change log documentation
- Generate approval workflow notifications

### Metrics and Analysis
- Calculate change request approval metrics
- Track change request volume trends
- Analyze root causes of changes
- Measure rework caused by changes
- Report baseline change statistics

## Usage

### Input Requirements
- Change request description
- Current baseline data (scope, schedule, cost)
- WBS and schedule structure
- Resource assignments
- Risk register

### Output Deliverables
- Impact assessment report
- Schedule impact analysis
- Cost impact analysis
- Scope impact matrix
- CCB presentation package

### Example Use Cases
1. **Change Evaluation**: Assess change before CCB review
2. **What-If Analysis**: Model change scenarios
3. **Baseline Update**: Document approved change impacts
4. **Change Metrics**: Analyze change trends

## Process Integration

This skill integrates with the following processes:
- Change Control Management
- earned-value-management.js
- Risk Monitoring and Response Execution
- Issue Management and Escalation

## Dependencies

- Impact analysis algorithms
- Workflow management utilities
- Document generation libraries
- Metrics calculation frameworks

## Related Skills

- SK-004: EVM Calculator
- SK-006: Risk Register Manager
- SK-014: Issue Tracker
