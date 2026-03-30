---
name: cost-database-interface
description: Construction cost database interface skill for unit costs, productivity, and regional adjustments
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
  category: Construction Management
  skill-id: CIV-SK-028
---

# Cost Database Interface Skill

## Purpose

The Cost Database Interface Skill provides access to construction cost databases for unit costs, crew productivity rates, and regional cost adjustments.

## Capabilities

- RS Means database integration
- Unit cost lookup
- Regional cost adjustments
- Crew productivity rates
- Equipment rental rates
- Material price indices
- Historical cost trending
- Location factor application

## Usage Guidelines

### When to Use
- Developing cost estimates
- Benchmarking project costs
- Adjusting for location
- Forecasting costs

### Prerequisites
- Database access configured
- Cost categories identified
- Location factors known
- Time period specified

### Best Practices
- Use current data
- Apply appropriate factors
- Verify for local conditions
- Document cost sources

## Process Integration

This skill integrates with:
- Construction Cost Estimation

## Configuration

```yaml
cost-database-interface:
  databases:
    - rs-means
    - dodge
    - eni
  data-types:
    - unit-costs
    - productivity
    - equipment
    - materials
  adjustments:
    - location
    - time
    - size
```

## Output Artifacts

- Cost data extracts
- Location factors
- Productivity data
- Cost indices
