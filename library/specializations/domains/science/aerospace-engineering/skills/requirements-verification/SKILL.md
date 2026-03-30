---
name: requirements-verification
description: Skill for aerospace requirements verification and validation matrix management
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: aerospace-engineering
  tags:
    - systems-engineering
    - requirements
    - verification
    - traceability
---

# Requirements Verification Skill

## Purpose
Enable comprehensive requirements verification and validation management including traceability matrices, compliance tracking, and evidence documentation.

## Capabilities
- Requirements traceability matrix creation
- Verification method assignment (T/A/I/D)
- Compliance matrix generation
- Requirements coverage analysis
- Verification status tracking
- Evidence linking and management
- Change impact assessment
- DOORS/Jama integration

## Usage Guidelines
- Establish complete requirements traceability from top level to implementation
- Assign appropriate verification methods based on requirement type
- Track verification status throughout development
- Link verification evidence to requirements
- Assess impact of requirement changes on design and verification
- Generate compliance reports for design reviews and certification

## Dependencies
- IBM DOORS
- Jama Connect
- Requirements management tools

## Process Integration
- AE-018: Requirements Verification Matrix
- AE-021: Certification Planning
