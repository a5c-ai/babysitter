---
name: eu-mdr-gspr-mapper
description: EU MDR General Safety and Performance Requirements (GSPR) mapping and compliance documentation skill
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Regulatory Compliance
  skill-id: BME-SK-002
---

# EU MDR GSPR Mapper Skill

## Purpose

The EU MDR GSPR Mapper Skill facilitates compliance with the European Medical Device Regulation (MDR 2017/745) by mapping General Safety and Performance Requirements and generating comprehensive compliance documentation.

## Capabilities

- GSPR checklist generation by device classification
- Annex I requirement mapping
- Compliance evidence linkage
- Gap analysis reporting
- SSCP (Summary of Safety and Clinical Performance) drafting
- UDI-DI assignment assistance
- Technical documentation structure generation
- Harmonized standards cross-reference
- State of the art analysis support
- Risk-benefit analysis documentation
- Clinical evidence requirements mapping

## Usage Guidelines

### When to Use
- Preparing EU MDR technical documentation
- Conducting GSPR compliance assessments
- Drafting Summary of Safety and Clinical Performance
- Planning conformity assessment activities

### Prerequisites
- Device classification determined
- Applicable harmonized standards identified
- Risk management file available
- Clinical evaluation data compiled

### Best Practices
- Map all applicable GSPR requirements early in development
- Document evidence for each requirement systematically
- Maintain traceability between requirements and evidence
- Update documentation with regulatory changes

## Process Integration

This skill integrates with the following processes:
- EU MDR Technical Documentation
- Clinical Evaluation Report Development
- Post-Market Surveillance System Implementation
- Design Control Process Implementation

## Dependencies

- EUDAMED database integration
- MDR Annex templates
- Harmonized standards database
- MDCG guidance documents
- Notified body requirements

## Configuration

```yaml
eu-mdr-gspr-mapper:
  device-classes:
    - Class I
    - Class IIa
    - Class IIb
    - Class III
  documentation-types:
    - technical-documentation
    - sscp
    - declaration-of-conformity
  annex-sections:
    - chapter-i-general
    - chapter-ii-design-manufacture
    - chapter-iii-information
```

## Output Artifacts

- GSPR compliance checklists
- Requirement-to-evidence mapping
- Gap analysis reports
- SSCP drafts
- Technical documentation templates
- Harmonized standards matrices
- Compliance status dashboards

## Quality Criteria

- All applicable GSPR requirements identified
- Evidence mapping is complete and traceable
- Documentation meets Notified Body expectations
- Gap analysis identifies actionable items
- SSCP content meets MDR Article 32 requirements
- UDI assignments follow MDR Annex VI
