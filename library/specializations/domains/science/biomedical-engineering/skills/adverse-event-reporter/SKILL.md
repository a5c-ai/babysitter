---
name: adverse-event-reporter
description: Adverse event monitoring and reporting skill for MDR/MEDWATCH compliance
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
  category: Clinical Evidence
  skill-id: BME-SK-025
---

# Adverse Event Reporter Skill

## Purpose

The Adverse Event Reporter Skill supports adverse event monitoring and regulatory reporting for medical devices, ensuring compliance with FDA MDR requirements and EU vigilance obligations.

## Capabilities

- MDR reportability assessment
- FDA Form 3500A population assistance
- MEDWATCH submission guidance
- EU vigilance reporting templates
- Trend analysis and signal detection
- PSUR data compilation
- Field safety corrective action templates
- Complaint coding (MedDRA)
- Risk assessment updates
- Corrective action tracking
- Regulatory notification timelines

## Usage Guidelines

### When to Use
- Assessing adverse event reportability
- Preparing regulatory reports
- Conducting trend analyses
- Managing field actions

### Prerequisites
- Complaint information received
- Investigation completed
- Device information available
- Regulatory requirements identified

### Best Practices
- Assess reportability promptly
- Document decision rationale
- Track reporting timelines
- Integrate with risk management

## Process Integration

This skill integrates with the following processes:
- Post-Market Surveillance System Implementation
- Clinical Evaluation Report Development
- Medical Device Risk Management (ISO 14971)
- EU MDR Technical Documentation

## Dependencies

- FDA MAUDE database
- EUDAMED system
- MedDRA coding dictionary
- Complaint management systems
- Risk management databases

## Configuration

```yaml
adverse-event-reporter:
  reporting-systems:
    - FDA-MDR
    - EU-vigilance
    - Health-Canada
    - TGA
  report-types:
    - death
    - serious-injury
    - malfunction
    - field-safety-corrective-action
  timelines:
    - 30-day
    - 5-day
    - annual
```

## Output Artifacts

- Reportability assessments
- FDA Form 3500A drafts
- EU vigilance reports
- Trend analysis reports
- PSUR contributions
- FSCA notifications
- Risk management updates
- Corrective action plans

## Quality Criteria

- Reportability assessed per regulations
- Reports submitted within timelines
- MedDRA coding accurate
- Trend analysis comprehensive
- Risk management updated
- Documentation audit-ready
