---
name: hipaa-compliance-validator
description: HIPAA compliance validation skill for genomic data handling and audit
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
  category: bioinformatics
  tags:
    - infrastructure
    - compliance
    - hipaa
    - privacy
---

# HIPAA Compliance Validator Skill

## Purpose
Enable HIPAA compliance validation for genomic data handling and audit.

## Capabilities
- PHI detection and flagging
- Access control validation
- Audit log analysis
- De-identification verification
- Consent tracking
- Compliance report generation

## Usage Guidelines
- Scan data for PHI before sharing
- Validate access controls are in place
- Maintain comprehensive audit logs
- Verify de-identification procedures
- Track consent for data use
- Generate compliance documentation

## Dependencies
- Custom validators
- Audit frameworks

## Process Integration
- Genomic Data Governance (genomic-data-governance)
- All clinical pipelines
