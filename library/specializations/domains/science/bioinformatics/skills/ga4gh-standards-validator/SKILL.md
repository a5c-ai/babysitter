---
name: ga4gh-standards-validator
description: GA4GH standards compliance skill for data sharing and interoperability
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
    - standards
    - ga4gh
    - interoperability
---

# GA4GH Standards Validator Skill

## Purpose
Provide GA4GH standards compliance for data sharing and interoperability.

## Capabilities
- VCF/BAM format validation
- htsget API compliance
- Beacon protocol testing
- DRS/WES/TES compliance
- Data model validation
- Interoperability testing

## Usage Guidelines
- Validate file formats against specifications
- Test API compliance for data sharing
- Implement Beacon for variant queries
- Ensure workflow execution standards compliance
- Validate data models for exchange
- Document compliance status

## Dependencies
- GA4GH toolkits
- htslib
- Beacon v2

## Process Integration
- Genomic Data Governance (genomic-data-governance)
- Reproducible Research Workflow (reproducible-research)
