---
name: misra-compliance
description: MISRA C/C++ static analysis and compliance checking
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
  category: automotive-engineering
  tags:
    - code-quality
    - misra
    - static-analysis
    - safety
---

# MISRA C/C++ Compliance Skill

## Purpose
Provide MISRA C/C++ static analysis and compliance checking for automotive software quality and safety.

## Capabilities
- MISRA C:2012/C++:2008 rule checking
- Polyspace/PRQA/Klocwork integration
- Violation categorization and reporting
- Deviation record management
- AUTOSAR C++14 guidelines
- CERT C compliance checking
- Custom rule configuration
- CI/CD integration for static analysis

## Usage Guidelines
- Configure static analysis for applicable MISRA rules
- Integrate analysis into CI/CD pipeline
- Categorize and prioritize violations
- Document deviations with justification
- Track compliance metrics over time
- Report compliance status for audits

## Dependencies
- Polyspace
- PRQA QAC
- Klocwork
- Coverity

## Process Integration
- ASD-002: ECU Software Development and Testing
- SAF-001: Functional Safety Development (ISO 26262)
- ASD-001: AUTOSAR Architecture Implementation
