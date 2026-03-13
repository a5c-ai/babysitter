---
name: data-room
description: Organize and manage due diligence data rooms
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
metadata:
  specialization: entrepreneurship
  domain: business
  category: Due Diligence
  skill-id: SK-015
---

# Data Room Organizer Skill

## Overview

The Data Room Organizer skill provides comprehensive capabilities for organizing and managing due diligence data rooms. It enables startups to prepare professional, well-organized data rooms that streamline the due diligence process, track document requests, and manage investor access throughout the fundraising process.

## Capabilities

### Core Functions
- **Structure Generation**: Generate comprehensive data room folder structures
- **Document Checklists**: Create stage-appropriate document checklists
- **Access Control Setup**: Set up and manage access controls and permissions
- **Request Tracking**: Track document requests from investors and advisors
- **Document Summaries**: Generate executive summaries for key documents
- **Version Control**: Manage document versions and update histories
- **Due Diligence Indices**: Create comprehensive due diligence indices
- **Activity Tracking**: Track investor activity and document engagement

### Advanced Features
- Document gap analysis
- Red flag identification
- Compliance verification checklists
- Automatic document categorization
- Q&A management system
- Multi-investor access management
- Audit trail generation
- Export for deal closing

## Usage

### Input Requirements
- Fundraising stage (seed, Series A, etc.)
- Investor type (VC, strategic, etc.)
- Company structure and history
- Existing documents inventory
- Timeline for due diligence
- Special requirements or concerns

### Output Deliverables
- Organized data room structure
- Comprehensive document checklist
- Gap analysis with priorities
- Document summaries and indices
- Access control configuration
- Activity reports and analytics
- Request tracking dashboard

### Process Integration
This skill integrates with the following processes:
- `due-diligence-preparation.js` - Primary integration for all phases
- `series-a-fundraising.js` - Series A data room requirements
- `pre-seed-fundraising.js` - Seed stage documentation
- `board-meeting-presentation.js` - Board document repository

### Example Invocation
```
Skill: data-room
Context: Series A due diligence preparation
Input:
  - Stage: Series A
  - Investor Type: Institutional VC
  - Company Age: 2 years
  - Employees: 15
  - Structure: Delaware C-Corp
Output:
  - Data room folder structure (20+ categories)
  - Document checklist (100+ items)
  - Priority ranking for document preparation
  - Sample index template
  - Access control recommendations
  - Gap analysis based on current documents
```

## Dependencies

- Data room platform templates (DocSend, Notion, Google Drive)
- Document management capabilities
- Access control systems
- Activity tracking analytics
- Export and sharing capabilities

## Best Practices

1. Organize documents using standard investor-expected categories
2. Name files consistently with clear, descriptive conventions
3. Include document indices and navigation guides
4. Prepare executive summaries for complex documents
5. Ensure all documents are current and dated
6. Remove sensitive information not relevant to diligence
7. Set up granular access controls by investor tier
8. Track which documents are viewed most frequently
9. Respond to document requests within 24 hours
10. Maintain audit trails for compliance purposes
11. Prepare answers to common diligence questions in advance
12. Keep the data room updated throughout the process
