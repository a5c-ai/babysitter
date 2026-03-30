---
name: project-charter-generator
description: Generate project charter documents with comprehensive project definition elements
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Project Initiation
  id: SK-017
---

# Project Charter Generator

## Overview

The Project Charter Generator skill creates comprehensive project charter documents that formally authorize projects and establish initial project definition. It supports multiple charter templates by project type and produces professional documentation for stakeholder approval.

## Capabilities

### Charter Content Generation
- Generate charter templates by project type (IT, construction, business)
- Capture objectives, scope, and success criteria
- Define high-level milestones and deliverables
- Document assumptions, constraints, and risks
- Define roles and governance structure

### Project Definition
- Articulate project justification and business case link
- Define measurable success criteria
- Establish high-level requirements
- Document stakeholder list and authority levels
- Set project boundaries (in-scope/out-of-scope)

### Approval and Authorization
- Generate authorization signature pages
- Create executive summary views
- Produce sponsor approval sections
- Document project manager authority
- Include escalation paths

### Export and Formatting
- Export to multiple formats (Markdown, Word, PDF)
- Apply organizational templates and branding
- Create presentation versions
- Generate checklist for charter completeness
- Support multi-language output

## Usage

### Input Requirements
- Project request/proposal information
- Business case summary
- Key stakeholder list
- Organizational project charter template
- Executive sponsor information

### Output Deliverables
- Complete project charter document
- Executive summary
- Signature/approval pages
- Charter compliance checklist
- Presentation version (optional)

### Example Use Cases
1. **Project Initiation**: Create charter for new project
2. **Charter Refresh**: Update charter for scope changes
3. **Gate Review**: Prepare charter for approval gate
4. **Template Creation**: Develop organizational charter template

## Process Integration

This skill integrates with the following processes:
- Project Charter Development
- Business Case Development
- Stakeholder Analysis and Engagement Planning
- budget-development.js

## Dependencies

- Document templates
- Formatting libraries
- PDF generation utilities
- Multi-format export converters

## Related Skills

- SK-007: WBS Generator
- SK-008: Stakeholder Matrix Generator
- SK-009: NPV/IRR Calculator
