---
name: do-178c-compliance
description: Skill for planning and executing DO-178C software certification activities
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
    - certification
    - software
    - do-178c
    - airborne-software
---

# DO-178C Compliance Skill

## Purpose
Enable planning and execution of DO-178C software certification activities for airborne software development across all Design Assurance Levels.

## Capabilities
- Software level determination
- Plan for Software Aspects of Certification (PSAC)
- Software Development Plan (SDP) generation
- Software requirements analysis
- Traceability matrix management
- Structural coverage analysis (MC/DC)
- Tool qualification planning
- Deviation and issue management

## Usage Guidelines
- Determine software level based on system safety assessment
- Develop compliant plans before starting development
- Maintain complete traceability from requirements to code and tests
- Achieve required structural coverage for software level
- Qualify tools that could insert errors or fail to detect errors
- Document and resolve all deviations and issues

## Dependencies
- LDRA
- VectorCAST
- Coverage analysis tools
- Requirements management tools

## Process Integration
- AE-023: DO-178C Compliance Planning
