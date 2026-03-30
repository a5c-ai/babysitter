---
name: engineering-report-generator
description: Engineering report generation skill for standard technical reports and calculation sheets
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: civil-engineering
  domain: science
  category: Documentation
  skill-id: CIV-SK-035
---

# Engineering Report Generator Skill

## Purpose

The Engineering Report Generator Skill creates standard engineering reports including geotechnical, structural, and traffic reports with calculation documentation.

## Capabilities

- Standard report templates (geotechnical, structural, traffic)
- Calculation sheet formatting
- Drawing sheet generation
- Table and figure numbering
- Reference management
- PE seal block placement
- Executive summary generation
- Appendix organization

## Usage Guidelines

### When to Use
- Creating technical reports
- Documenting calculations
- Preparing deliverables
- Generating drawings

### Prerequisites
- Technical content complete
- Figures and tables prepared
- References compiled
- Review comments addressed

### Best Practices
- Follow template standards
- Maintain consistent formatting
- Include required content
- Quality check before issue

## Process Integration

This skill integrates with:
- All processes (documentation output)

## Configuration

```yaml
engineering-report-generator:
  report-types:
    - geotechnical
    - structural
    - traffic
    - design
  formats:
    - docx
    - pdf
    - html
  sections:
    - executive-summary
    - methodology
    - findings
    - recommendations
    - appendices
```

## Output Artifacts

- Technical reports
- Calculation packages
- Drawing sets
- Appendix documents
