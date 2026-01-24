---
name: ifc-model-analyzer
description: IFC model analysis skill for validation, property extraction, and model comparison
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
  category: BIM Coordination
  skill-id: CIV-SK-015
---

# IFC Model Analyzer Skill

## Purpose

The IFC Model Analyzer Skill analyzes IFC format BIM models for schema validation, property extraction, quantity takeoff, and model comparison.

## Capabilities

- IFC schema validation
- Property set extraction
- Quantity takeoff
- Model comparison (diff)
- Element classification
- Coordinate system analysis
- LOD assessment
- Data quality checking

## Usage Guidelines

### When to Use
- Validating IFC exports
- Extracting model data
- Comparing model versions
- Checking data quality

### Prerequisites
- IFC file available
- Schema version identified
- Extraction requirements defined
- Comparison baseline established

### Best Practices
- Validate schema compliance
- Check coordinate systems
- Verify property mapping
- Document model assumptions

## Process Integration

This skill integrates with:
- BIM Coordination
- Structural Peer Review

## Configuration

```yaml
ifc-model-analyzer:
  analysis-types:
    - validation
    - extraction
    - comparison
    - quality-check
  ifc-versions:
    - IFC2x3
    - IFC4
    - IFC4.3
  outputs:
    - report
    - json
    - csv
```

## Output Artifacts

- Validation reports
- Property extractions
- Model comparisons
- Quality assessments
