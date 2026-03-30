---
name: environmental-impact-analyzer
description: Environmental impact assessment skill for NEPA, wetlands, and endangered species screening
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
  category: Environmental
  skill-id: CIV-SK-031
---

# Environmental Impact Analyzer Skill

## Purpose

The Environmental Impact Analyzer Skill assesses environmental impacts including NEPA requirements, wetland impacts, and endangered species screening for civil engineering projects.

## Capabilities

- NEPA checklist generation
- Wetland impact assessment
- Endangered species screening
- Air quality impact analysis
- Noise impact assessment
- Mitigation measure recommendations
- Cultural resource screening
- Environmental justice analysis

## Usage Guidelines

### When to Use
- Assessing project impacts
- Preparing environmental documents
- Screening for sensitive resources
- Developing mitigation measures

### Prerequisites
- Project scope defined
- Site location identified
- Baseline data available
- Regulatory requirements known

### Best Practices
- Screen early in design
- Document all findings
- Coordinate with agencies
- Plan for mitigation

## Process Integration

This skill integrates with:
- Permit Application Preparation
- Stormwater Management Design

## Configuration

```yaml
environmental-impact-analyzer:
  assessments:
    - NEPA
    - wetlands
    - endangered-species
    - air-quality
    - noise
  screening-tools:
    - IPAC
    - wetland-maps
    - GIS-layers
```

## Output Artifacts

- Impact assessments
- Screening reports
- Mitigation plans
- Agency correspondence
