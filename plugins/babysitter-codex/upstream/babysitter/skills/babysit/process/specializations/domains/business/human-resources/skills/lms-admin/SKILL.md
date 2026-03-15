---
name: lms-admin
description: Configure and manage Learning Management System operations including courses, enrollments, compliance training, and learning analytics
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
  - WebFetch
metadata:
  specialization: human-resources
  domain: business
  category: Learning & Development
  skill-id: SK-010
---

# LMS Administration Skill

## Overview

The LMS Administration skill provides comprehensive capabilities for configuring, managing, and optimizing Learning Management System operations. This skill supports course management, user administration, compliance tracking, and learning analytics across major LMS platforms including Cornerstone, Workday Learning, SAP SuccessFactors Learning, and others.

## Capabilities

### Core Functions

1. **Create Course Structures and Learning Paths**
   - Design course hierarchies and modules
   - Build sequential and branching learning paths
   - Configure prerequisites and dependencies
   - Create curriculum maps and certification programs
   - Set up blended learning configurations

2. **Configure User Enrollments and Assignments**
   - Manage individual and bulk enrollments
   - Configure automatic enrollment rules
   - Set up role-based learning assignments
   - Create enrollment workflows and approvals
   - Manage waitlists and capacity limits

3. **Build Compliance Training Schedules**
   - Configure recurring compliance training
   - Set up due date calculations and reminders
   - Create compliance training matrices by role
   - Manage version control for compliance content
   - Track regulatory requirement mappings

4. **Generate Completion Reports and Transcripts**
   - Create individual learning transcripts
   - Generate team and department reports
   - Build compliance status dashboards
   - Export data for external reporting
   - Create audit-ready documentation

5. **Track Learning Analytics and Engagement**
   - Monitor course completion rates
   - Analyze learner engagement metrics
   - Track time-to-completion data
   - Identify at-risk learners
   - Measure assessment performance

6. **Create Certificate and Credential Records**
   - Configure certificate templates
   - Set up credential expiration tracking
   - Manage recertification workflows
   - Create external certification records
   - Generate verification documentation

7. **Manage Content Libraries and Catalogs**
   - Organize content by category and topic
   - Configure content access permissions
   - Manage content versioning
   - Set up content retirement workflows
   - Integrate external content providers

## Usage

### Course Creation and Setup

```
Input:
- Course content and materials
- Learning objectives
- Target audience definition
- Assessment requirements
- Completion criteria

Output:
- Complete course structure
- Enrollment configuration
- Assessment setup
- Certificate template
- Launch checklist
```

### Compliance Training Configuration

```
Input:
- Regulatory requirements
- Affected job roles/positions
- Training frequency requirements
- Escalation procedures
- Audit requirements

Output:
- Compliance training matrix
- Automatic enrollment rules
- Reminder schedule configuration
- Reporting dashboard setup
- Audit trail configuration
```

### Learning Analytics Report

```
Input:
- Reporting period
- Population scope
- Metrics of interest
- Comparison benchmarks

Output:
- Completion rate analysis
- Engagement metrics report
- Trend analysis
- Recommendations for improvement
- Executive summary
```

## Integration Points

### Process Integration
- Learning Management System (LMS) Implementation
- Training Needs Analysis (TNA)
- Leadership Development Program
- Compliance Training Programs

### Related Skills
- SK-009: Training Needs Assessment
- SK-011: Succession Planning

### Related Agents
- AG-005: Learning and Development Specialist

### Platform Integrations
- Cornerstone OnDemand
- Workday Learning
- SAP SuccessFactors Learning
- LinkedIn Learning
- Udemy Business
- Coursera for Business
- Custom LMS platforms

## Templates

### Course Structure Template

```
Course Information:
- Course ID and Title
- Description and Objectives
- Target Audience
- Duration and Format
- Prerequisites

Content Structure:
- Module 1: [Title]
  - Lesson 1.1
  - Lesson 1.2
  - Assessment 1
- Module 2: [Title]
  - Lesson 2.1
  - Lesson 2.2
  - Assessment 2

Completion Requirements:
- Minimum score threshold
- Required activities
- Time requirements
- Certificate eligibility

Administrative Settings:
- Enrollment type
- Capacity limits
- Availability dates
- Access permissions
```

### Compliance Training Matrix

```
| Training Title | Frequency | Due Window | Target Roles | Regulatory Source |
|----------------|-----------|------------|--------------|-------------------|
| [Title]        | Annual    | 30 days    | [Roles]      | [Regulation]      |
| [Title]        | Bi-annual | 14 days    | [Roles]      | [Regulation]      |
```

### Learning Analytics Dashboard

```
Key Metrics:
- Overall Completion Rate
- Average Time to Complete
- Overdue Training Count
- Learner Engagement Score

Trending:
- Completion trends (30/60/90 days)
- High-performing courses
- At-risk populations
- Content engagement patterns

Compliance Status:
- Current compliance percentage
- Upcoming due dates
- Overdue by department
- Escalation queue
```

## Best Practices

1. **Course Design**
   - Keep modules focused and digestible (15-20 minutes)
   - Include varied content types (video, text, interactive)
   - Build in knowledge checks throughout
   - Provide clear learning objectives upfront

2. **Enrollment Management**
   - Use automated enrollment for mandatory training
   - Set reasonable completion windows
   - Configure escalation paths for overdue training
   - Maintain accurate job role mappings

3. **Compliance Training**
   - Maintain version control on compliance content
   - Document regulatory requirement mappings
   - Configure audit trails for all completions
   - Plan for annual content reviews

4. **Analytics and Reporting**
   - Establish baseline metrics before changes
   - Track leading indicators (enrollment) and lagging (completion)
   - Segment data by meaningful populations
   - Share insights with stakeholders regularly

5. **Content Management**
   - Regularly review and retire outdated content
   - Maintain consistent metadata and tagging
   - Test content across devices and browsers
   - Document content ownership and review cycles

## Configuration Checklist

### Initial Setup
- [ ] User roles and permissions configured
- [ ] Organizational hierarchy mapped
- [ ] Job role catalog established
- [ ] Integration connections tested
- [ ] Notification templates customized

### Course Deployment
- [ ] Content uploaded and tested
- [ ] Assessments validated
- [ ] Enrollment rules configured
- [ ] Completion criteria set
- [ ] Certificate template created

### Compliance Setup
- [ ] Training matrix documented
- [ ] Automatic assignments configured
- [ ] Reminder schedule set
- [ ] Escalation workflow active
- [ ] Audit reporting tested

### Ongoing Operations
- [ ] Regular completion reports scheduled
- [ ] Overdue training monitoring active
- [ ] Content review calendar maintained
- [ ] User feedback collection enabled
- [ ] Analytics dashboard published
