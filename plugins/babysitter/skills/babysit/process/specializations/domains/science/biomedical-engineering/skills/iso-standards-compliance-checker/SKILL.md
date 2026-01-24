---
name: iso-standards-compliance-checker
description: Medical device standards compliance verification skill for ISO 13485, ISO 14971, IEC 62304, IEC 60601, and related standards
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
  skill-id: BME-SK-003
---

# ISO Standards Compliance Checker Skill

## Purpose

The ISO Standards Compliance Checker Skill verifies medical device compliance with applicable ISO and IEC standards, generating compliance checklists, gap analyses, and evidence mapping for quality management and regulatory submissions.

## Capabilities

- Standards applicability determination
- Compliance checklist generation
- Gap analysis against standard clauses
- Evidence mapping to requirements
- Harmonized standards cross-reference
- Declaration of Conformity assistance
- Audit preparation support
- Non-conformance tracking
- Corrective action recommendations
- Standards version comparison
- Multi-standard compliance matrices

## Usage Guidelines

### When to Use
- Implementing quality management systems
- Preparing for certification audits
- Conducting internal compliance reviews
- Supporting regulatory submissions

### Prerequisites
- Device type and intended use defined
- Applicable regulatory pathways identified
- Quality management system documentation available
- Design and development records accessible

### Best Practices
- Identify all applicable standards early in development
- Maintain current knowledge of standards revisions
- Document compliance evidence systematically
- Conduct regular internal compliance reviews

## Process Integration

This skill integrates with the following processes:
- Design Control Process Implementation
- Medical Device Risk Management (ISO 14971)
- Software Development Lifecycle (IEC 62304)
- EU MDR Technical Documentation

## Dependencies

- ISO standards database
- FDA recognized consensus standards list
- Harmonized standards registry
- Standards development organization publications
- Regulatory guidance documents

## Configuration

```yaml
iso-standards-compliance-checker:
  standards-families:
    - ISO-13485
    - ISO-14971
    - IEC-62304
    - IEC-60601
    - ISO-10993
    - ISO-11135
    - ISO-11137
    - ISO-11607
  compliance-levels:
    - full
    - partial
    - not-applicable
  output-formats:
    - checklist
    - gap-analysis
    - evidence-matrix
```

## Output Artifacts

- Standards applicability matrices
- Compliance checklists by standard
- Gap analysis reports
- Evidence mapping documents
- Declaration of Conformity templates
- Audit preparation packages
- Non-conformance logs
- Corrective action recommendations

## Quality Criteria

- All applicable standards identified correctly
- Checklists reflect current standard versions
- Gap analysis is comprehensive and actionable
- Evidence mapping supports audit review
- Documentation maintains regulatory acceptance
- Compliance status accurately reported
