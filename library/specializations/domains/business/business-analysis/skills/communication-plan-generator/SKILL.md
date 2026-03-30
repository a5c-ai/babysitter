---
name: communication-plan-generator
description: Generate stakeholder communication plans and message templates for change initiatives
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-013
  category: Stakeholder Communication
---

# Communication Plan Generator

## Overview

The Communication Plan Generator skill provides specialized capabilities for creating comprehensive stakeholder communication plans. This skill enables systematic development of communication matrices, message templates, FAQ documents, and multi-channel communication strategies for projects and change initiatives.

## Capabilities

### Communication Matrix Creation
- Create communication matrices by stakeholder group
- Define message content by audience
- Specify frequency and timing
- Assign communication owners

### Message Template Generation
- Generate message templates for different audiences
- Create executive vs operational messaging
- Develop role-specific communication
- Build progressive disclosure messaging

### Communication Cadence Scheduling
- Schedule communication cadence
- Define milestone-based communications
- Create regular status update schedules
- Plan event-triggered communications

### FAQ Document Creation
- Create comprehensive FAQ documents
- Organize by topic and audience
- Address common concerns proactively
- Update FAQs based on feedback

### Change Announcement Templates
- Generate change announcement templates
- Create "what's changing" summaries
- Develop "what it means for you" messaging
- Build call-to-action communications

### Communication Effectiveness Tracking
- Track communication effectiveness
- Measure reach and engagement
- Gather feedback on clarity
- Adjust strategy based on metrics

### Multi-Channel Strategy
- Create multi-channel communication strategies
- Select appropriate channels by message type
- Balance push vs pull communications
- Design channel-specific content

## Usage

### Create Communication Plan
```
Create a communication plan for:
Project: [Project description]
Stakeholder Groups: [List of groups]

Include matrix, templates, and cadence.
```

### Generate Message Templates
```
Generate communication templates for this change:
[Change description]

Create versions for: executives, managers, end users.
```

### Create FAQ Document
```
Create an FAQ document for:
[Initiative description]

Address likely questions from each stakeholder group.
```

### Design Multi-Channel Strategy
```
Design a multi-channel communication strategy:
[Initiative details]
Available Channels: [List of channels]

Recommend channel mix and content approach.
```

## Process Integration

This skill integrates with the following business analysis processes:
- stakeholder-communication-planning.js - Core communication planning
- change-management-strategy.js - Change communication
- consulting-engagement-planning.js - Client communication
- stakeholder-analysis.js - Stakeholder-specific communication

## Dependencies

- Communication templates
- Message frameworks
- Scheduling algorithms
- Channel strategy guides

## Communication Planning Reference

### Communication Matrix Template
| Audience | Message | Channel | Frequency | Owner | Start Date |
|----------|---------|---------|-----------|-------|------------|
| Executives | Strategic updates | Email, Town Hall | Monthly | Sponsor | Week 1 |
| Managers | Operational details | Team meetings | Bi-weekly | PM | Week 2 |
| End Users | Impact & actions | Email, Intranet | As needed | Change Lead | Week 3 |

### Message Types by Phase
| Phase | Message Focus | Key Content |
|-------|--------------|-------------|
| Awareness | Why change | Business drivers, vision |
| Understanding | What's changing | Scope, timeline, impacts |
| Preparation | How to prepare | Training, resources, support |
| Implementation | Go-live details | Cutover, support contacts |
| Reinforcement | Success stories | Benefits realized, recognition |

### Channel Selection Guide
| Channel | Best For | Limitations |
|---------|----------|-------------|
| Email | Detailed information, documentation | Easy to ignore, no discussion |
| Town Hall | Major announcements, Q&A | Scheduling, one-time event |
| Intranet | Reference material, updates | Requires active visiting |
| Team Meetings | Discussion, feedback | Manager-dependent |
| Video | Demonstrations, personal messages | Production effort |
| Newsletters | Regular updates, stories | Limited engagement |
| Slack/Teams | Quick updates, discussion | Information overload |

### Message Template Structure
```
SUBJECT: [Clear, action-oriented subject line]

OPENING:
[Why this matters to the reader]

KEY POINTS:
- [Point 1: What's happening]
- [Point 2: What it means for you]
- [Point 3: What you need to do]

TIMELINE:
[Key dates and milestones]

SUPPORT:
[Where to get help, who to contact]

CALL TO ACTION:
[Specific next step]
```

### FAQ Development Process
1. Brainstorm likely questions by stakeholder group
2. Gather questions from pilot groups
3. Organize questions by topic
4. Draft clear, concise answers
5. Review with SMEs
6. Publish and maintain

### Communication Effectiveness Metrics
| Metric | Measurement | Target |
|--------|-------------|--------|
| Reach | % of audience who received | 100% |
| Open Rate | % who opened (email) | 70%+ |
| Read Rate | % who read completely | 50%+ |
| Understanding | Survey scores | 4.0/5.0 |
| Action Completion | % who took required action | 90%+ |

### Sender/Messenger Selection
| Message Type | Recommended Sender |
|--------------|-------------------|
| Strategic vision | Executive sponsor |
| Operational changes | Project manager |
| Technical details | Technical lead |
| Team impact | Direct manager |
| Support information | Change team |
